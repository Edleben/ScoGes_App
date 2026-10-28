-- Runs in the same rolled-back transaction as tenant_isolation.sql.
do $$
declare recipient uuid := gen_random_uuid(); recipient2 uuid := gen_random_uuid();
begin
  perform set_config('test.recipient',recipient::text,true);
  perform set_config('test.recipient2',recipient2::text,true);
  insert into auth.users(id,email,email_confirmed_at) values
    (recipient,recipient::text || '@example.invalid',now()),
    (recipient2,recipient2::text || '@example.invalid',now());
end;
$$;
create function pg_temp.reject_invitation(token text) returns void language plpgsql as $$
begin
  begin
    perform public.accept_tenant_invitation(token);
    raise exception 'unsafe invitation acceptance';
  exception when raise_exception then
    if sqlerrm <> 'invalid invitation' then raise; end if;
  end;
end;
$$;

set local role authenticated;
select set_config('request.jwt.claim.sub',current_setting('test.user_a'),true);
select set_config('request.jwt.claims',json_build_object('sub',current_setting('test.user_a'),'role','authenticated')::text,true);
do $$
declare issued jsonb;
begin
  issued := public.issue_tenant_invitation(current_setting('test.tenant_a')::uuid,current_setting('test.recipient') || '@example.invalid','cashier');
  perform set_config('test.invitation_id',issued->>'id',true);
  perform set_config('test.invitation_token',issued->>'token',true);
  begin
    perform public.issue_tenant_invitation(current_setting('test.tenant_a')::uuid,current_setting('test.recipient') || '@example.invalid','cashier');
    raise exception 'invitation cooldown bypassed';
  exception when raise_exception then if sqlerrm<>'invitation cooldown' then raise; end if; end;
  perform public.record_invitation_delivery((issued->>'id')::uuid,encode(sha256(convert_to(issued->>'token','UTF8')),'hex'),false);
end;
$$;

-- A different authenticated identity cannot use the token.
select set_config('request.jwt.claim.sub',current_setting('test.user_b'),true);
select pg_temp.reject_invitation(current_setting('test.invitation_token'));
-- Tenant B's administrator cannot invite into A.
do $$
begin
  begin
    perform public.issue_tenant_invitation(current_setting('test.tenant_a')::uuid,'denied@example.invalid','tenant_admin');
    raise exception 'cross-tenant invitation issuance allowed';
  exception when raise_exception then if sqlerrm<>'missing users.invite permission' then raise; end if; end;
end;
$$;

-- Unverified recipients, revoked/expired invitations and revoked inviters fail.
reset role;
update auth.users set email_confirmed_at=null where id=current_setting('test.recipient')::uuid;
set local role authenticated;
select set_config('request.jwt.claim.sub',current_setting('test.recipient'),true);
select pg_temp.reject_invitation(current_setting('test.invitation_token'));
reset role;
update auth.users set email_confirmed_at=now() where id=current_setting('test.recipient')::uuid;
update public.invitations set expires_at=now()-interval '1 minute' where id=current_setting('test.invitation_id')::uuid;
set local role authenticated;
select pg_temp.reject_invitation(current_setting('test.invitation_token'));
reset role;
update public.invitations set expires_at=now()+interval '14 days',status='revoked' where id=current_setting('test.invitation_id')::uuid;
set local role authenticated;
select pg_temp.reject_invitation(current_setting('test.invitation_token'));
reset role;
update public.invitations set status='pending' where id=current_setting('test.invitation_id')::uuid;
update public.memberships set status='revoked' where id=current_setting('test.membership_a')::uuid;
set local role authenticated;
select pg_temp.reject_invitation(current_setting('test.invitation_token'));
reset role;
update public.memberships set status='active' where id=current_setting('test.membership_a')::uuid;
set local role authenticated;
do $$
declare accepted jsonb;
begin
  accepted := public.accept_tenant_invitation(current_setting('test.invitation_token'));
  if accepted->>'tenant_id' <> current_setting('test.tenant_a') then raise exception 'wrong accepted tenant'; end if;
  if not exists(select 1 from public.memberships m join public.membership_roles mr on mr.membership_id=m.id
    join public.roles r on r.id=mr.role_id where m.id=(accepted->>'membership_id')::uuid and m.user_id=auth.uid() and r.key='cashier') then
    raise exception 'invited role not assigned';
  end if;
  if public.current_user_has_permission(current_setting('test.tenant_a')::uuid,'users.invite') then raise exception 'invitation elevated permissions'; end if;
end;
$$;
select pg_temp.reject_invitation(current_setting('test.invitation_token'));
reset role;
do $$
begin
  if (select count(*) from public.audit_events where target_id=current_setting('test.invitation_id')::uuid and action='member.invitation_accepted')<>1 then
    raise exception 'acceptance audit missing or duplicated';
  end if;
  if (select delivery_status from public.invitations where id=current_setting('test.invitation_id')::uuid)<>'failed' then
    raise exception 'delivery failure not recorded';
  end if;
end;
$$;

-- Reissue invalidates the previous token, while retaining an audit trail.
set local role authenticated;
select set_config('request.jwt.claim.sub',current_setting('test.user_a'),true);
do $$
declare issued jsonb;
begin
  issued := public.issue_tenant_invitation(current_setting('test.tenant_a')::uuid,current_setting('test.recipient2') || '@example.invalid','registrar');
  perform set_config('test.old_token',issued->>'token',true);
  perform set_config('test.reissued_id',issued->>'id',true);
end;
$$;
reset role;
update public.invitations set created_at=now()-interval '2 minutes' where id=current_setting('test.reissued_id')::uuid;
set local role authenticated;
do $$
declare issued jsonb;
begin
  issued := public.issue_tenant_invitation(current_setting('test.tenant_a')::uuid,current_setting('test.recipient2') || '@example.invalid','registrar');
  perform set_config('test.new_token',issued->>'token',true);
  if issued->>'token'=current_setting('test.old_token') then raise exception 'reissue reused token'; end if;
end;
$$;
select set_config('request.jwt.claim.sub',current_setting('test.recipient2'),true);
select pg_temp.reject_invitation(current_setting('test.old_token'));
-- Existing revoked membership must never be reactivated by an invitation.
reset role;
insert into public.profiles(id,email) values(current_setting('test.recipient2')::uuid,current_setting('test.recipient2') || '@example.invalid');
insert into public.memberships(tenant_id,user_id,status) values(current_setting('test.tenant_a')::uuid,current_setting('test.recipient2')::uuid,'revoked');
set local role authenticated;
select pg_temp.reject_invitation(current_setting('test.new_token'));
reset role;
set local role anon;
do $$
begin
  begin
    perform public.accept_tenant_invitation(current_setting('test.new_token'));
    raise exception 'anonymous invitation acceptance allowed';
  exception when insufficient_privilege then null; end;
end;
$$;
reset role;
