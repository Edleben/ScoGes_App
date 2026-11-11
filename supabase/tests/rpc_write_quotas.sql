-- Must run inside the guarded disposable-CI transaction, after rpc_quota_fixtures.sql.
do $$
begin
  if not (select relrowsecurity from pg_class where oid='app_private.rpc_write_windows'::regclass)
    then raise exception 'quota metadata lacks RLS'; end if;
  if has_schema_privilege('authenticated','app_private','USAGE') or has_schema_privilege('anon','app_private','USAGE')
    or has_table_privilege('authenticated','app_private.rpc_write_windows','SELECT,INSERT,UPDATE,DELETE')
    or has_function_privilege('authenticated','app_private.enforce_rpc_write_quota()','EXECUTE')
    or has_function_privilege('anon','app_private.rpc_write_policy(text)','EXECUTE') then raise exception 'quota metadata is exposed'; end if;
end;
$$;
set local role authenticated;
select pg_temp.quota_actor('actor');
select pg_temp.quota_reject('select * from app_private.rpc_write_windows','42501');
select pg_temp.quota_reject('select app_private.enforce_rpc_write_quota()','42501');
select pg_temp.quota_reject('update app_private.rpc_write_windows set occurred_at=array[]::timestamptz[]','42501');
select pg_temp.quota_reject(format('select public.create_tenant_with_admin(''Forged'',''forged'',''TG'',''XOF'',''UTC'',''fr'',%L)',current_setting('quota_test.recipient')),'P0001');

do $$
declare i integer; t uuid; country text;
begin
  for i in 1..5 loop
    perform public.create_tenant_with_admin('Quota tenant','test-'||gen_random_uuid(),'TG','XOF','UTC','fr',auth.uid());
  end loop;
  perform pg_temp.quota_reject('select public.create_tenant_with_admin(''Blocked'',''test-''||gen_random_uuid(),''TG'',''XOF'',''UTC'',''fr'',auth.uid())','PT429');
  for i in 1..60 loop
    t:=current_setting('quota_test.tenant_'||case when i%2=1 then 1 else 2 end)::uuid;
    country:=case when ((i-1)/2)%2=0 then 'US' else 'TG' end;
    perform public.update_tenant_settings(t,updated_at,country,'XOF','UTC','fr') from public.tenant_settings where tenant_id=t;
  end loop;
  perform pg_temp.quota_reject(format('select public.administer_tenant_membership(%L,%L,updated_at,array[''auditor'']) from public.memberships where id=%L',current_setting('quota_test.tenant_1'),current_setting('quota_test.membership'),current_setting('quota_test.membership')),'PT429');
  perform pg_temp.quota_reject(format('select public.administer_tenant_membership(%L,id,updated_at,null,''inactive'') from public.memberships where id=%L',current_setting('quota_test.tenant_1'),current_setting('quota_test.membership')),'PT429');
  perform pg_temp.quota_reject(format('select public.administer_tenant_membership(%L,id,updated_at,null,''revoked'') from public.memberships where id=%L',current_setting('quota_test.tenant_1'),current_setting('quota_test.membership')),'PT429');
  perform pg_temp.quota_reject(format('select public.update_tenant_settings(tenant_id,updated_at,''CA'',''XOF'',''UTC'',''fr'') from public.tenant_settings where tenant_id=%L',current_setting('quota_test.tenant_2')),'PT429');
  -- No-op remains a no-op even at the write ceiling.
  if public.update_tenant_settings(current_setting('quota_test.tenant_1')::uuid,
    (select updated_at from public.tenant_settings where tenant_id=current_setting('quota_test.tenant_1')::uuid),'TG','XOF','UTC','fr')
    then raise exception 'settings no-op changed state'; end if;
end;
$$;
reset role;
do $$
begin
  if (select count(*) from public.tenants where created_by=current_setting('quota_test.actor')::uuid)<>5
    or (select count(*) from public.audit_events where actor_user_id=current_setting('quota_test.actor')::uuid and action='tenant.created')<>5
    or (select count(*) from public.audit_events where actor_user_id=current_setting('quota_test.actor')::uuid and action='tenant.settings.updated')<>60
    or (select status from public.memberships where id=current_setting('quota_test.membership')::uuid)<>'active'
    or not exists(select 1 from public.membership_roles mr join public.roles r on r.id=mr.role_id where mr.membership_id=current_setting('quota_test.membership')::uuid and r.key='cashier')
    or exists(select 1 from public.audit_events where action in ('member.role_changed','member.deactivated','member.revoked') and actor_user_id=current_setting('quota_test.actor')::uuid)
    then raise exception 'quota rejection left partial business/audit changes'; end if;
end;
$$;
-- Expiry permits one new write; old timestamps are pruned, not treated as a new fixed bucket.
update app_private.rpc_write_windows set occurred_at=array_prepend(clock_timestamp()-interval '11 minutes',array_fill(clock_timestamp(),array[59]))
  where actor_id=current_setting('quota_test.actor')::uuid and scope='administration';
set local role authenticated;
select pg_temp.quota_actor('actor');
select public.update_tenant_settings(tenant_id,updated_at,'CA','XOF','UTC','fr') from public.tenant_settings where tenant_id=current_setting('quota_test.tenant_2')::uuid;
select pg_temp.quota_actor('recipient');
select pg_temp.quota_reject(format('select public.update_tenant_settings(%L,null,''CA'',''XOF'',''UTC'',''fr'')',current_setting('quota_test.tenant_1')),'P0001');
reset role;
do $$
begin
  if exists(select 1 from app_private.rpc_write_windows where actor_id=current_setting('quota_test.recipient')::uuid)
    or (select cardinality(occurred_at) from app_private.rpc_write_windows where actor_id=current_setting('quota_test.actor')::uuid and scope='administration')<>60
    then raise exception 'expiry or denied-actor quota attribution failed'; end if;
end;
$$;
-- Backward clock movement must not erase future-dated trusted usage.
update app_private.rpc_write_windows set occurred_at=array_fill(clock_timestamp()+interval '1 minute',array[60]) where actor_id=current_setting('quota_test.actor')::uuid and scope='administration';
set local role authenticated;
select pg_temp.quota_actor('actor');
select pg_temp.quota_reject(format('select public.update_tenant_settings(tenant_id,updated_at,''GB'',''XOF'',''UTC'',''fr'') from public.tenant_settings where tenant_id=%L',current_setting('quota_test.tenant_2')),'PT429');
reset role;
-- A counter storage failure must roll the preceding business write back too.
alter table app_private.rpc_write_windows add constraint quota_test_failure check(false) not valid;
set local role authenticated;
select pg_temp.quota_actor('actor');
select pg_temp.quota_reject(format('select public.update_tenant_settings(tenant_id,updated_at,''GB'',''XOF'',''UTC'',''fr'') from public.tenant_settings where tenant_id=%L',current_setting('quota_test.tenant_2')),'23514');
reset role;
alter table app_private.rpc_write_windows drop constraint quota_test_failure;
do $$
begin
  if (select country from public.tenant_settings where tenant_id=current_setting('quota_test.tenant_2')::uuid)<>'CA'
    or (select count(*) from public.audit_events where actor_user_id=current_setting('quota_test.actor')::uuid and action='tenant.settings.updated')<>61 then raise exception 'quota failure was not atomic'; end if;
end;
$$;
-- Explicitly exhaust the database quota with no matching invitation audit rows:
-- proves both current and legacy RPCs hit this backstop, not only the older SQL limit.
insert into app_private.rpc_write_windows values(current_setting('quota_test.actor')::uuid,'invitation',array_fill(clock_timestamp(),array[20]));
set local role authenticated;
select pg_temp.quota_actor('actor');
select pg_temp.quota_reject(format('select public.issue_tenant_invitation(%L,''blocked@example.invalid'',''cashier'')',current_setting('quota_test.tenant_1')),'PT429');
select pg_temp.quota_reject(format('select public.invite_tenant_member(%L,''legacy@example.invalid'',''cashier'',auth.uid())',current_setting('quota_test.tenant_1')),'PT429');
reset role;
update app_private.rpc_write_windows set occurred_at=array_fill(clock_timestamp(),array[19]) where actor_id=current_setting('quota_test.actor')::uuid and scope='invitation';
set local role authenticated;
do $$
declare invitation jsonb;
begin
  invitation:=public.issue_tenant_invitation(current_setting('quota_test.tenant_1')::uuid,current_setting('quota_test.recipient')||'@example.invalid','cashier');
  perform set_config('quota_test.invitation',invitation->>'id',true);
  perform set_config('quota_test.token',invitation->>'token',true);
end;
$$;
reset role;
insert into app_private.rpc_write_windows values(current_setting('quota_test.actor')::uuid,'invitation_delivery',array_fill(clock_timestamp(),array[40]));
set local role authenticated;
select pg_temp.quota_reject(format('select public.record_invitation_delivery(%L,encode(sha256(convert_to(current_setting(''quota_test.token''),''UTF8'')),''hex''),true)',current_setting('quota_test.invitation')),'PT429');
reset role;
update app_private.rpc_write_windows set occurred_at=array_fill(clock_timestamp(),array[39]) where actor_id=current_setting('quota_test.actor')::uuid and scope='invitation_delivery';
set local role authenticated;
select public.record_invitation_delivery(current_setting('quota_test.invitation')::uuid,encode(sha256(convert_to(current_setting('quota_test.token'),'UTF8')),'hex'),false);
select pg_temp.quota_reject(format('select public.record_invitation_delivery(%L,encode(sha256(convert_to(current_setting(''quota_test.token''),''UTF8'')),''hex''),true)',current_setting('quota_test.invitation')),'PT429');
reset role;
insert into app_private.rpc_write_windows values(current_setting('quota_test.recipient')::uuid,'acceptance',array_fill(clock_timestamp(),array[20]));
set local role authenticated;
select pg_temp.quota_actor('recipient');
select pg_temp.quota_reject('select public.accept_tenant_invitation(current_setting(''quota_test.token''))','PT429');
reset role;
do $$
begin
  if (select status from public.invitations where id=current_setting('quota_test.invitation')::uuid)<>'pending'
    or (select delivery_status from public.invitations where id=current_setting('quota_test.invitation')::uuid)<>'failed'
    or exists(select 1 from public.memberships where user_id=current_setting('quota_test.recipient')::uuid)
    then raise exception 'blocked invitation write changed state'; end if;
end;
$$;
update app_private.rpc_write_windows set occurred_at=array_fill(clock_timestamp()-interval '11 minutes',array[20]) where actor_id=current_setting('quota_test.recipient')::uuid and scope='acceptance';
set local role authenticated;
select public.accept_tenant_invitation(current_setting('quota_test.token'));
select pg_temp.quota_reject('select public.accept_tenant_invitation(current_setting(''quota_test.token''))','P0001');
reset role;
do $$
declare deleted_actor uuid:=gen_random_uuid();
begin
  if (select cardinality(occurred_at) from app_private.rpc_write_windows where actor_id=current_setting('quota_test.recipient')::uuid and scope='acceptance')<>1
    or (select count(*) from public.audit_events where actor_user_id=current_setting('quota_test.recipient')::uuid and action in ('member.invitation_accepted','member.role_assigned'))<>2
    or (select count(*) from public.invitations where created_by=current_setting('quota_test.actor')::uuid)<>1 then raise exception 'invitation quota accounting incorrect'; end if;
  insert into auth.users(id,email) values(deleted_actor,deleted_actor||'@example.invalid');
  insert into app_private.rpc_write_windows values(deleted_actor,'onboarding',array[clock_timestamp()]);
  delete from auth.users where id=deleted_actor;
  if exists(select 1 from app_private.rpc_write_windows where actor_id=deleted_actor) then raise exception 'quota actor deletion retained metadata'; end if;
end;
$$;
