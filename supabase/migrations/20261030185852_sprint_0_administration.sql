-- A revision must advance even for multiple writes in one transaction or clock drift.
create function public.advance_administration_revision()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := greatest(clock_timestamp(), old.updated_at + interval '1 microsecond');
  return new;
end;
$$;
revoke all on function public.advance_administration_revision() from public,anon,authenticated;
create or replace trigger memberships_touch_updated_at before update on public.memberships
  for each row execute function public.advance_administration_revision();
create or replace trigger tenant_settings_touch_updated_at before update on public.tenant_settings
  for each row execute function public.advance_administration_revision();

-- Every administrative mutation locks the tenant before rechecking permissions.
-- This serializes administrator removal, including concurrent edits of different members.
create function public.administer_tenant_membership(
  target_tenant_id uuid, target_membership_id uuid, expected_updated_at timestamptz,
  new_role_keys text[] default null, new_status text default null
)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  subject public.memberships%rowtype;
  previous_roles text[];
  selected_roles text[];
  permission_key text;
  event_action text;
  actor_is_admin boolean;
begin
  if actor is null then raise exception 'administration_denied'; end if;
  if (new_role_keys is null) = (new_status is null) then raise exception 'invalid_administration'; end if;
  permission_key := case when new_role_keys is not null then 'users.manage_roles' else 'users.deactivate' end;
  if not public.current_user_has_permission(target_tenant_id, permission_key) then raise exception 'administration_denied'; end if;
  perform 1 from public.tenants where id=target_tenant_id and status='active' for update;
  if not found or not public.current_user_has_permission(target_tenant_id, permission_key) then raise exception 'administration_denied'; end if;
  select * into subject from public.memberships where id=target_membership_id and tenant_id=target_tenant_id for update;
  if not found then raise exception 'administration_denied'; end if;
  if expected_updated_at is null or subject.updated_at is distinct from expected_updated_at then raise exception 'stale_write'; end if;
  select coalesce(array_agg(r.key order by r.key), '{}'::text[]) into previous_roles
    from public.membership_roles mr join public.roles r on r.id=mr.role_id where mr.membership_id=subject.id;
  select exists(select 1 from public.memberships m join public.membership_roles mr on mr.membership_id=m.id
    join public.roles r on r.id=mr.role_id where m.tenant_id=target_tenant_id and m.user_id=actor
    and m.status='active' and r.key='tenant_admin') into actor_is_admin;

  if new_role_keys is not null then
    if subject.status <> 'active' or cardinality(new_role_keys) not between 1 and 5
      or array_position(new_role_keys, null) is not null
      or not new_role_keys <@ array['tenant_admin','finance_manager','cashier','registrar','auditor']::text[]
      then raise exception 'invalid_administration'; end if;
    select array_agg(distinct key order by key) into selected_roles from unnest(new_role_keys) as key;
    if cardinality(selected_roles) <> cardinality(new_role_keys) then raise exception 'invalid_administration'; end if;
    if (select count(*) from public.roles where key=any(selected_roles) and scope='tenant') <> cardinality(selected_roles)
      then raise exception 'invalid_administration'; end if;
    if ('tenant_admin'=any(previous_roles) or 'tenant_admin'=any(selected_roles)) and not actor_is_admin
      then raise exception 'administration_denied'; end if;
    if selected_roles=previous_roles then return false; end if;
    event_action := 'member.role_changed';
  else
    if new_status not in ('inactive','revoked') or subject.status not in ('active','inactive')
      or (subject.status='inactive' and new_status<>'revoked') then raise exception 'invalid_administration'; end if;
    if 'tenant_admin'=any(previous_roles) and not actor_is_admin then raise exception 'administration_denied'; end if;
    event_action := case when new_status='revoked' then 'member.revoked' else 'member.deactivated' end;
  end if;

  if subject.status='active' and 'tenant_admin'=any(previous_roles)
    and (new_status is not null or not 'tenant_admin'=any(selected_roles))
    and not exists(select 1 from public.memberships m join public.membership_roles mr on mr.membership_id=m.id
      join public.roles r on r.id=mr.role_id where m.tenant_id=target_tenant_id and m.id<>subject.id
      and m.status='active' and r.key='tenant_admin') then raise exception 'last_admin'; end if;

  if new_role_keys is not null then
    delete from public.membership_roles where membership_id=subject.id;
    insert into public.membership_roles(membership_id,role_id,assigned_by)
      select subject.id,id,actor from public.roles where key=any(selected_roles) and scope='tenant';
    update public.memberships set updated_at=clock_timestamp() where id=subject.id;
  else
    update public.memberships set status=new_status where id=subject.id;
  end if;
  insert into public.audit_events(tenant_id,actor_user_id,action,target_type,target_id,metadata,request_id)
    values(target_tenant_id,actor,event_action,'membership',subject.id,
      case when new_role_keys is not null then jsonb_build_object('previous_roles',previous_roles,'roles',selected_roles)
      else jsonb_build_object('previous_status',subject.status,'status',new_status) end,gen_random_uuid()::text);
  return true;
end;
$$;

create function public.update_tenant_settings(
  target_tenant_id uuid, expected_updated_at timestamptz, new_country text,
  new_base_currency text, new_timezone text, new_default_locale text
)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  previous public.tenant_settings%rowtype;
  before_values jsonb;
  after_values jsonb;
begin
  if actor is null or not public.current_user_has_permission(target_tenant_id,'tenant.settings.write') then raise exception 'administration_denied'; end if;
  perform 1 from public.tenants where id=target_tenant_id and status='active' for update;
  if not found or not public.current_user_has_permission(target_tenant_id,'tenant.settings.write') then raise exception 'administration_denied'; end if;
  if new_country is null or new_country !~ '^[A-Z]{2}$' or new_base_currency is null or new_base_currency !~ '^[A-Z]{3}$'
    or new_default_locale is null or new_default_locale not in ('fr','en') or new_timezone is null
    or char_length(new_timezone)>80 or not exists(select 1 from pg_catalog.pg_timezone_names where name=new_timezone)
    then raise exception 'invalid_administration'; end if;
  select * into previous from public.tenant_settings where tenant_id=target_tenant_id for update;
  if not found then raise exception 'administration_denied'; end if;
  if expected_updated_at is null or previous.updated_at is distinct from expected_updated_at then raise exception 'stale_write'; end if;
  before_values := jsonb_build_object('country',previous.country,'base_currency',previous.base_currency,'timezone',previous.timezone,'default_locale',previous.default_locale);
  after_values := jsonb_build_object('country',new_country,'base_currency',new_base_currency,'timezone',new_timezone,'default_locale',new_default_locale);
  if before_values=after_values then return false; end if;
  update public.tenant_settings set country=new_country,base_currency=new_base_currency,timezone=new_timezone,default_locale=new_default_locale where tenant_id=target_tenant_id;
  insert into public.audit_events(tenant_id,actor_user_id,action,target_type,target_id,metadata,request_id)
    values(target_tenant_id,actor,'tenant.settings.updated','tenant_settings',target_tenant_id,
      jsonb_build_object('before',before_values,'after',after_values),gen_random_uuid()::text);
  return true;
end;
$$;

revoke all on function public.administer_tenant_membership(uuid,uuid,timestamptz,text[],text) from public,anon,authenticated;
revoke all on function public.update_tenant_settings(uuid,timestamptz,text,text,text,text) from public,anon,authenticated;
grant execute on function public.administer_tenant_membership(uuid,uuid,timestamptz,text[],text) to authenticated;
grant execute on function public.update_tenant_settings(uuid,timestamptz,text,text,text,text) to authenticated;

-- Authorized administrators must still identify revoked members in the history list.
drop policy "tenant users can read member profiles" on public.profiles;
create policy "tenant users can read member profiles" on public.profiles for select to authenticated using (
  exists(select 1 from public.memberships subject where subject.user_id=profiles.id
    and public.current_user_has_permission(subject.tenant_id,'users.read'))
);

-- Invitation acceptance shares the authorization serialization boundary.
create or replace function public.accept_tenant_invitation(invitation_token text)
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
  -- Use the same tenant lock as role/status administration before rechecking the inviter.
  perform 1 from public.tenants where id=invitation.tenant_id and status='active' for update;
  if not found then raise exception 'invalid invitation'; end if;
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

