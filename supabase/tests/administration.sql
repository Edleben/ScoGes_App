-- All fixtures and test-only triggers are rolled back by test-database.mjs.
reset role;
do $$
declare t uuid:=gen_random_uuid(); b uuid:=gen_random_uuid(); u uuid; m uuid; fixture_label text;
begin
  perform set_config('admin_test.tenant',t::text,true); perform set_config('admin_test.foreign_tenant',b::text,true);
  insert into public.tenants(id,name,slug) values(t,'Administration fixture','test-'||t),(b,'Foreign fixture','test-'||b);
  insert into public.tenant_settings(tenant_id,country,base_currency,timezone) values(t,'TG','XOF','Africa/Lome'),(b,'TG','XOF','Africa/Lome');
  foreach fixture_label in array array['owner','second','member','foreign'] loop
    u:=gen_random_uuid();m:=gen_random_uuid();
    perform set_config('admin_test.'||fixture_label,u::text,true);perform set_config('admin_test.'||fixture_label||'_membership',m::text,true);
    insert into auth.users(id,email) values(u,u||'@example.invalid');
    insert into public.profiles(id,email) values(u,u||'@example.invalid');
    insert into public.memberships(id,tenant_id,user_id) values(m,case when fixture_label='foreign' then b else t end,u);
    insert into public.membership_roles(membership_id,role_id) select m,id from public.roles where key=case when fixture_label='member' then 'cashier' else 'tenant_admin' end;
  end loop;
end;
$$;
create function pg_temp.admin_reject(statement text, expected_message text) returns void language plpgsql as $$
begin
  begin execute statement;
  exception when others then
    if sqlerrm=expected_message or (expected_message='permission denied' and sqlstate='42501') then return; end if;
    raise exception 'unexpected administration rejection: %',sqlerrm;
  end;
  raise exception 'unsafe administration operation succeeded';
end;
$$;
create function pg_temp.admin_call(fixture_label text, roles text[], requested_status text default null, revision timestamptz default null)
returns boolean language plpgsql as $$
declare result boolean;
begin
  select public.administer_tenant_membership(current_setting('admin_test.tenant')::uuid,m.id,
    coalesce(revision,m.updated_at),roles,requested_status) into result
    from public.memberships m where m.id=current_setting('admin_test.'||fixture_label||'_membership')::uuid;
  return result;
end;
$$;
set local role authenticated;
select set_config('request.jwt.claim.sub',current_setting('admin_test.owner'),true);
select set_config('request.jwt.claims',json_build_object('sub',current_setting('admin_test.owner'),'role','authenticated')::text,true);
-- Cross-tenant identifiers never become authority.
select pg_temp.admin_reject(format('select public.administer_tenant_membership(%L,%L,now(),array[''cashier''])',current_setting('admin_test.tenant'),current_setting('admin_test.foreign_membership')),'administration_denied');
select pg_temp.admin_reject(format('select public.update_tenant_settings(%L,now(),''US'',''USD'',''UTC'',''en'')',current_setting('admin_test.foreign_tenant')),'administration_denied');
select pg_temp.admin_reject('select pg_temp.admin_call(''member'',array[''platform_admin''])','invalid_administration');
select pg_temp.admin_reject('select pg_temp.admin_call(''member'',array[]::text[])','invalid_administration');
select pg_temp.admin_reject('select pg_temp.admin_call(''member'',array[''cashier'',''cashier''])','invalid_administration');
select pg_temp.admin_reject('select pg_temp.admin_call(''member'',array[null]::text[])','invalid_administration');
select pg_temp.admin_reject('select pg_temp.admin_call(''member'',array[''cashier''],''inactive'')','invalid_administration');
select pg_temp.admin_reject('select pg_temp.admin_call(''member'',null,''active'')','invalid_administration');
-- An active low-privilege identity cannot invoke either administrative RPC.
select set_config('request.jwt.claim.sub',current_setting('admin_test.member'),true);
select pg_temp.admin_reject(format('select public.administer_tenant_membership(%L,%L,now(),array[''tenant_admin''])',current_setting('admin_test.tenant'),current_setting('admin_test.member_membership')),'administration_denied');
select pg_temp.admin_reject(format('select public.update_tenant_settings(%L,now(),''US'',''USD'',''UTC'',''en'')',current_setting('admin_test.tenant')),'administration_denied');
select set_config('request.jwt.claim.sub',current_setting('admin_test.owner'),true);
-- Last-administrator protection applies to demotion, deactivation and revocation.
select pg_temp.admin_call('second',array['cashier']);
select pg_temp.admin_reject('select pg_temp.admin_call(''owner'',array[''cashier''])','last_admin');
select pg_temp.admin_reject('select pg_temp.admin_call(''owner'',null,''inactive'')','last_admin');
select pg_temp.admin_reject('select pg_temp.admin_call(''owner'',null,''revoked'')','last_admin');
select pg_temp.admin_call('second',array['tenant_admin']);

do $$
declare old_revision timestamptz; total integer; target uuid:=current_setting('admin_test.member_membership')::uuid;
begin
  select updated_at into old_revision from public.memberships where id=target;
  if not pg_temp.admin_call('member',array['finance_manager','auditor']) then raise exception 'role update did not change state'; end if;
  if (select updated_at from public.memberships where id=target)<=old_revision then raise exception 'membership revision did not advance'; end if;
  if not exists(select 1 from public.audit_events where target_id=target and action='member.role_changed'
    and actor_user_id=auth.uid() and tenant_id=current_setting('admin_test.tenant')::uuid and request_id is not null
    and metadata->'previous_roles'='["cashier"]'::jsonb and metadata->'roles'='["auditor","finance_manager"]'::jsonb)
    then raise exception 'role audit missing or inaccurate'; end if;
  select count(*) into total from public.audit_events where target_id=target;
  if pg_temp.admin_call('member',array['auditor','finance_manager']) then raise exception 'role no-op reported changed'; end if;
  if (select count(*) from public.audit_events where target_id=target)<>total then raise exception 'role no-op added audit'; end if;
  perform pg_temp.admin_reject(format('select pg_temp.admin_call(''member'',array[''cashier''],null,%L)',old_revision),'stale_write');
end;
$$;
-- Settings validate in the database, reject stale writes and audit only changed values.
do $$
declare t uuid:=current_setting('admin_test.tenant')::uuid; revision timestamptz; new_revision timestamptz;
begin
  select updated_at into revision from public.tenant_settings where tenant_id=t;
  perform pg_temp.admin_reject(format('select public.update_tenant_settings(%L,%L,''US'',''USD'',''Invalid/Zone'',''en'')',t,revision),'invalid_administration');
  perform pg_temp.admin_reject(format('select public.update_tenant_settings(%L,%L,null,''USD'',''UTC'',''en'')',t,revision),'invalid_administration');
  if not public.update_tenant_settings(t,revision,'US','USD','UTC','en') then raise exception 'settings update failed'; end if;
  select updated_at into new_revision from public.tenant_settings where tenant_id=t;
  if new_revision<=revision then raise exception 'settings revision did not advance'; end if;
  perform pg_temp.admin_reject(format('select public.update_tenant_settings(%L,%L,''TG'',''XOF'',''UTC'',''fr'')',t,revision),'stale_write');
  if public.update_tenant_settings(t,new_revision,'US','USD','UTC','en') then raise exception 'settings no-op reported changed'; end if;
  if (select count(*) from public.audit_events where tenant_id=t and action='tenant.settings.updated')<>1 then raise exception 'settings audit count incorrect'; end if;
  if not exists(select 1 from public.audit_events where tenant_id=t and action='tenant.settings.updated'
    and metadata->'before'->>'base_currency'='XOF' and metadata->'after'->>'base_currency'='USD' and actor_user_id=auth.uid())
    then raise exception 'settings audit inaccurate'; end if;
end;
$$;
-- Force audit insertion to fail and prove that each associated write rolls back.
reset role;
create function pg_temp.reject_admin_audit() returns trigger language plpgsql as $$
begin
  if new.action in ('member.role_changed','member.deactivated','member.revoked','tenant.settings.updated') then raise exception 'test_audit_failure'; end if;
  return new;
end;
$$;
create trigger test_reject_admin_audit before insert on public.audit_events for each row execute function pg_temp.reject_admin_audit();
set local role authenticated;
select pg_temp.admin_reject('select pg_temp.admin_call(''member'',array[''cashier''])','test_audit_failure');
select pg_temp.admin_reject('select pg_temp.admin_call(''member'',null,''inactive'')','test_audit_failure');
select pg_temp.admin_reject('select pg_temp.admin_call(''member'',null,''revoked'')','test_audit_failure');
select pg_temp.admin_reject(format('select public.update_tenant_settings(tenant_id,updated_at,''TG'',''XOF'',''UTC'',''fr'') from public.tenant_settings where tenant_id=%L',current_setting('admin_test.tenant')),'test_audit_failure');
do $$
begin
  if not exists(select 1 from public.memberships where id=current_setting('admin_test.member_membership')::uuid and status='active')
    or (select count(*) from public.membership_roles where membership_id=current_setting('admin_test.member_membership')::uuid)<>2
    or (select base_currency from public.tenant_settings where tenant_id=current_setting('admin_test.tenant')::uuid)<>'USD'
    then raise exception 'audit failure left partial changes'; end if;
end;
$$;
reset role;
drop trigger test_reject_admin_audit on public.audit_events;
set local role authenticated;
select pg_temp.admin_call('member',null,'inactive');
select pg_temp.admin_call('member',null,'revoked');
select pg_temp.admin_reject('select pg_temp.admin_call(''member'',array[''tenant_admin''])','invalid_administration');
select pg_temp.admin_reject('select pg_temp.admin_call(''member'',null,''active'')','invalid_administration');
do $$
begin
  if (select count(*) from public.audit_events where target_id=current_setting('admin_test.member_membership')::uuid
    and action in ('member.deactivated','member.revoked') and actor_user_id=auth.uid() and request_id is not null)<>2 then raise exception 'status audit missing'; end if;
  if not exists(select 1 from public.profiles where id=current_setting('admin_test.member')::uuid) then raise exception 'administrator cannot identify revoked member'; end if;
end;
$$;
-- Existing JWTs cannot retain tenant authority after membership revocation.
select set_config('request.jwt.claim.sub',current_setting('admin_test.member'),true);
select set_config('request.jwt.claims',json_build_object('sub',current_setting('admin_test.member'),'role','authenticated')::text,true);
do $$
begin
  if public.current_user_has_permission(current_setting('admin_test.tenant')::uuid,'tenant.settings.read')
    or exists(select 1 from public.tenant_settings where tenant_id=current_setting('admin_test.tenant')::uuid)
    or exists(select 1 from public.memberships where tenant_id=current_setting('admin_test.tenant')::uuid)
    or exists(select 1 from public.membership_roles where membership_id=current_setting('admin_test.member_membership')::uuid)
    then raise exception 'revoked JWT retained tenant access'; end if;
end;
$$;
select pg_temp.admin_reject(format('select public.administer_tenant_membership(%L,%L,now(),array[''tenant_admin''])',current_setting('admin_test.tenant'),current_setting('admin_test.member_membership')),'administration_denied');
select pg_temp.admin_reject(format('select public.update_tenant_settings(%L,now(),''US'',''USD'',''UTC'',''en'')',current_setting('admin_test.tenant')),'administration_denied');
reset role;
set local role anon;
select pg_temp.admin_reject(format('select public.administer_tenant_membership(%L,%L,now(),array[''tenant_admin''])',current_setting('admin_test.tenant'),current_setting('admin_test.owner_membership')),'permission denied');
select pg_temp.admin_reject(format('select public.update_tenant_settings(%L,now(),''US'',''USD'',''UTC'',''en'')',current_setting('admin_test.tenant')),'permission denied');
reset role;
