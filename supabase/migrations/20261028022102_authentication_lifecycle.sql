-- Invitation lifecycle: token digests only, bounded issuance, atomic acceptance.
alter table public.invitations add column delivery_status text not null default 'pending'
  check (delivery_status in ('pending', 'sent', 'failed'));
alter table public.invitations drop constraint invitations_tenant_id_email_status_key;
create unique index invitations_pending_email_unique
  on public.invitations(tenant_id, lower(email)) where status = 'pending';

create function public.issue_tenant_invitation(target_tenant_id uuid, invitee_email text, role_key text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  selected_role uuid;
  token text;
  invitation_id uuid;
  normalized_email text := lower(btrim(invitee_email));
begin
  if actor is null then raise exception 'authentication required'; end if;
  if not public.current_user_has_permission(target_tenant_id, 'users.invite') then
    raise exception 'missing users.invite permission';
  end if;
  if not public.current_user_has_permission(target_tenant_id, 'users.manage_roles') then
    raise exception 'missing users.manage_roles permission';
  end if;
  if not exists(select 1 from public.tenants where id=target_tenant_id and status='active') then
    raise exception 'tenant unavailable';
  end if;
  select id into selected_role from public.roles where key=role_key and scope='tenant';
  if selected_role is null then raise exception 'unknown role'; end if;
  if role_key='tenant_admin' and not exists (
    select 1 from public.memberships m join public.membership_roles mr on mr.membership_id=m.id
    join public.roles r on r.id=mr.role_id where m.user_id=actor and m.tenant_id=target_tenant_id
    and m.status='active' and r.key='tenant_admin'
  ) then raise exception 'role assignment denied'; end if;
  if normalized_email is null or char_length(normalized_email)>254 or normalized_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' then
    raise exception 'invalid email';
  end if;
  -- Serialize per actor and recipient so concurrent requests cannot bypass limits.
  perform pg_advisory_xact_lock(hashtextextended(actor::text, 0));
  perform pg_advisory_xact_lock(hashtextextended(target_tenant_id::text || normalized_email, 0));
  if (select count(*) from public.audit_events where actor_user_id=actor and action='member.invited'
      and created_at>now()-interval '1 hour') >= 20 then raise exception 'invitation rate limit'; end if;
  if exists(select 1 from public.invitations where tenant_id=target_tenant_id and lower(email)=normalized_email
      and status='pending' and created_at>now()-interval '1 minute') then raise exception 'invitation cooldown'; end if;
  if exists(select 1 from public.memberships m join auth.users u on u.id=m.user_id
      where m.tenant_id=target_tenant_id and lower(u.email)=normalized_email) then
    raise exception 'membership already exists';
  end if;
  token := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  insert into public.invitations(tenant_id,email,role_id,token_hash,created_by)
    values(target_tenant_id,normalized_email,selected_role,encode(sha256(convert_to(token,'UTF8')),'hex'),actor)
    on conflict (tenant_id,lower(email)) where status='pending' do update set
      token_hash=excluded.token_hash, role_id=excluded.role_id, created_by=actor,
      created_at=now(), expires_at=now()+interval '14 days', delivery_status='pending'
    returning id into invitation_id;
  insert into public.audit_events(tenant_id,actor_user_id,action,target_type,target_id,metadata)
    values(target_tenant_id,actor,'member.invited','invitation',invitation_id,jsonb_build_object('role',role_key));
  return jsonb_build_object('id',invitation_id,'token',token);
end;
$$;

create function public.record_invitation_delivery(invitation_id uuid, token_digest text, delivered boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare target_tenant uuid;
begin
  if auth.uid() is null or delivered is null then raise exception 'delivery update denied'; end if;
  select i.tenant_id into target_tenant from public.invitations i
    where i.id=invitation_id and i.created_by=auth.uid() and i.token_hash=token_digest and i.status='pending' for update;
  if target_tenant is null or not public.current_user_has_permission(target_tenant,'users.invite') then
    raise exception 'delivery update denied';
  end if;
  update public.invitations set delivery_status=case when delivered then 'sent' else 'failed' end where id=invitation_id;
  insert into public.audit_events(tenant_id,actor_user_id,action,target_type,target_id)
    values(target_tenant,auth.uid(),case when delivered then 'member.invitation_sent' else 'member.invitation_delivery_failed' end,'invitation',invitation_id);
end;
$$;

create function public.accept_tenant_invitation(invitation_token text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  actor_email text;
  invitation public.invitations%rowtype;
  new_membership uuid;
begin
  if actor is null or invitation_token is null or invitation_token !~ '^[a-f0-9]{64}$' then raise exception 'invalid invitation'; end if;
  select lower(email) into actor_email from auth.users where id=actor and email_confirmed_at is not null;
  if actor_email is null then raise exception 'invalid invitation'; end if;
  select * into invitation from public.invitations
    where token_hash=encode(sha256(convert_to(invitation_token,'UTF8')),'hex') for update;
  if invitation.id is null or invitation.status<>'pending' or invitation.expires_at<=now()
      or lower(invitation.email)<>actor_email then raise exception 'invalid invitation'; end if;
  if not exists(select 1 from public.tenants where id=invitation.tenant_id and status='active') then raise exception 'invalid invitation'; end if;
  -- A revoked inviter cannot leave usable invitations behind.
  if not exists (
    select m.id from public.memberships m join public.membership_roles mr on mr.membership_id=m.id
    join public.role_permissions rp on rp.role_id=mr.role_id join public.permissions p on p.id=rp.permission_id
    where m.user_id=invitation.created_by and m.tenant_id=invitation.tenant_id and m.status='active'
      and p.key in ('users.invite','users.manage_roles') group by m.id having count(distinct p.key)=2
  ) then raise exception 'invalid invitation'; end if;
  if exists(select 1 from public.roles where id=invitation.role_id and key='tenant_admin') and not exists (
    select 1 from public.memberships m join public.membership_roles mr on mr.membership_id=m.id
    join public.roles r on r.id=mr.role_id where m.user_id=invitation.created_by and m.tenant_id=invitation.tenant_id
      and m.status='active' and r.key='tenant_admin'
  ) then raise exception 'invalid invitation'; end if;
  if exists(select 1 from public.memberships where tenant_id=invitation.tenant_id and user_id=actor) then
    raise exception 'invalid invitation';
  end if;
  insert into public.profiles(id,email) values(actor,actor_email)
    on conflict(id) do update set email=excluded.email;
  insert into public.memberships(tenant_id,user_id,created_by) values(invitation.tenant_id,actor,invitation.created_by)
    returning id into new_membership;
  insert into public.membership_roles(membership_id,role_id,assigned_by) values(new_membership,invitation.role_id,invitation.created_by);
  update public.invitations set status='accepted' where id=invitation.id;
  insert into public.audit_events(tenant_id,actor_user_id,action,target_type,target_id,metadata) values
    (invitation.tenant_id,actor,'member.invitation_accepted','invitation',invitation.id,jsonb_build_object('membership_id',new_membership)),
    (invitation.tenant_id,actor,'member.role_assigned','membership',new_membership,jsonb_build_object('role_id',invitation.role_id));
  return jsonb_build_object('tenant_id',invitation.tenant_id,'membership_id',new_membership);
end;
$$;

-- Preserve the original UUID API while closing its weaker authorization path.
create or replace function public.invite_tenant_member(target_tenant_id uuid, invitee_email text, role_key text, actor_user_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or actor_user_id is distinct from auth.uid() then raise exception 'actor mismatch'; end if;
  return (public.issue_tenant_invitation(target_tenant_id,invitee_email,role_key)->>'id')::uuid;
end;
$$;

revoke all on function public.issue_tenant_invitation(uuid,text,text) from public,anon;
revoke all on function public.record_invitation_delivery(uuid,text,boolean) from public,anon;
revoke all on function public.accept_tenant_invitation(text) from public,anon;
grant execute on function public.issue_tenant_invitation(uuid,text,text) to authenticated;
grant execute on function public.record_invitation_delivery(uuid,text,boolean) to authenticated;
grant execute on function public.accept_tenant_invitation(text) to authenticated;
