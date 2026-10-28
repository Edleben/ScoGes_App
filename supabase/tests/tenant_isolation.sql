-- Run only through scripts/test-database.mjs: all fixtures and DDL are rolled back.
-- Exercise real RLS as authenticated/anon, never as the table owner.
do $$
declare
  user_a uuid := gen_random_uuid();
  user_b uuid := gen_random_uuid();
  user_c uuid := gen_random_uuid();
  tenant_a uuid := gen_random_uuid();
  tenant_b uuid := gen_random_uuid();
  membership_a uuid := gen_random_uuid();
  membership_b uuid := gen_random_uuid();
  membership_c uuid := gen_random_uuid();
begin
  perform set_config('test.user_a', user_a::text, true);
  perform set_config('test.user_b', user_b::text, true);
  perform set_config('test.tenant_a', tenant_a::text, true);
  perform set_config('test.tenant_b', tenant_b::text, true);
  perform set_config('test.membership_a', membership_a::text, true);
  perform set_config('test.membership_b', membership_b::text, true);
  perform set_config('test.membership_c', membership_c::text, true);
  insert into auth.users(id, email) values
    (user_a, user_a::text || '@example.invalid'),
    (user_b, user_b::text || '@example.invalid'),
    (user_c, user_c::text || '@example.invalid');
  insert into public.profiles(id,email) values
    (user_a, user_a::text || '@example.invalid'),
    (user_b, user_b::text || '@example.invalid'),
    (user_c, user_c::text || '@example.invalid');
  insert into public.tenants(id,name,slug) values
    (tenant_a, 'Isolation test A', 'test-' || tenant_a::text),
    (tenant_b, 'Isolation test B', 'test-' || tenant_b::text);
  insert into public.tenant_settings(tenant_id,country,base_currency,timezone) values
    (tenant_a, 'TG', 'XOF', 'Africa/Lome'), (tenant_b, 'TG', 'XOF', 'Africa/Lome');
  insert into public.memberships(id,tenant_id,user_id) values
    (membership_a, tenant_a, user_a), (membership_b, tenant_b, user_b),
    (membership_c, tenant_a, user_c);
  insert into public.membership_roles(membership_id,role_id)
    select membership_a,id from public.roles where key='cashier'
    union all select membership_b,id from public.roles where key='tenant_admin'
    union all select membership_c,id from public.roles where key='registrar';
end;
$$;

set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('test.user_a'), true);
select set_config('request.jwt.claims', json_build_object('sub',current_setting('test.user_a'),'role','authenticated')::text,true);
do $$
begin
  if (select count(*) from public.memberships where id=current_setting('test.membership_a')::uuid) <> 1 then
    raise exception 'cashier cannot resolve own active membership';
  end if;
  if (select count(*) from public.membership_roles where membership_id=current_setting('test.membership_a')::uuid) <> 1 then
    raise exception 'cashier cannot read own assigned role';
  end if;
  if exists(select 1 from public.memberships where id in (current_setting('test.membership_b')::uuid,current_setting('test.membership_c')::uuid)) then
    raise exception 'cashier can enumerate other members';
  end if;
  if exists(select 1 from public.membership_roles where membership_id in (current_setting('test.membership_b')::uuid,current_setting('test.membership_c')::uuid)) then
    raise exception 'cashier can read other member roles';
  end if;
  if not exists(select 1 from public.tenants where id=current_setting('test.tenant_a')::uuid) then
    raise exception 'cashier cannot read own tenant';
  end if;
  if exists(select 1 from public.tenants where id=current_setting('test.tenant_b')::uuid)
    or exists(select 1 from public.tenant_settings where tenant_id=current_setting('test.tenant_b')::uuid)
    or exists(select 1 from public.profiles where id=current_setting('test.user_b')::uuid) then
    raise exception 'cross-tenant data visible';
  end if;
  if public.current_user_has_permission(current_setting('test.tenant_a')::uuid,'users.invite') then
    raise exception 'cashier has invitation permission';
  end if;
  if exists(select 1 from public.profiles where id not in (current_setting('test.user_a')::uuid)) then
    raise exception 'cashier can enumerate other profiles';
  end if;
  -- RLS must deny protected writes even when a client supplies valid IDs.
  update public.memberships set status='revoked' where id=current_setting('test.membership_b')::uuid;
  if found then raise exception 'cross-tenant membership update allowed'; end if;
  delete from public.membership_roles where membership_id=current_setting('test.membership_a')::uuid;
  if found then raise exception 'cashier can change own assigned roles'; end if;
  begin
    insert into public.membership_roles(membership_id,role_id)
      select current_setting('test.membership_a')::uuid,id from public.roles where key='tenant_admin';
    raise exception 'cashier can elevate own role';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.invite_tenant_member(current_setting('test.tenant_b')::uuid,'denied@example.invalid','tenant_admin',current_setting('test.user_a')::uuid);
    raise exception 'cross-tenant invitation allowed';
  exception when raise_exception then
    if sqlerrm <> 'missing users.invite permission' then raise; end if;
  end;
  begin
    perform public.invite_tenant_member(current_setting('test.tenant_a')::uuid,'denied@example.invalid','registrar',current_setting('test.user_a')::uuid);
    raise exception 'cashier invitation allowed';
  exception when raise_exception then
    if sqlerrm <> 'missing users.invite permission' then raise; end if;
  end;
  begin
    perform public.invite_tenant_member(current_setting('test.tenant_b')::uuid,'denied@example.invalid','registrar',current_setting('test.user_b')::uuid);
    raise exception 'forged actor allowed';
  exception when raise_exception then
    if sqlerrm <> 'actor mismatch' then raise; end if;
  end;
end;
$$;

reset role;
-- Deactivation must remove self-resolution and settings access.
update public.memberships set status='inactive' where id=current_setting('test.membership_a')::uuid;
set local role authenticated;
do $$
begin
  if exists(select 1 from public.memberships where id=current_setting('test.membership_a')::uuid)
    or exists(select 1 from public.membership_roles where membership_id=current_setting('test.membership_a')::uuid)
    or exists(select 1 from public.tenant_settings where tenant_id=current_setting('test.tenant_a')::uuid) then
    raise exception 'inactive cashier retains access';
  end if;
end;
$$;

reset role;
update public.memberships set status='active' where id=current_setting('test.membership_a')::uuid;
insert into public.membership_roles(membership_id,role_id)
  select current_setting('test.membership_a')::uuid,id from public.roles where key='tenant_admin';
set local role authenticated;
do $$
begin
  if not exists(select 1 from public.memberships where id=current_setting('test.membership_c')::uuid)
    or not exists(select 1 from public.membership_roles where membership_id=current_setting('test.membership_c')::uuid)
    or not exists(select 1 from public.profiles where id=(select user_id from public.memberships where id=current_setting('test.membership_c')::uuid)) then
    raise exception 'administrator cannot read same-tenant member directory';
  end if;
  if exists(select 1 from public.memberships where tenant_id=current_setting('test.tenant_b')::uuid) then
    raise exception 'tenant A administrator crosses tenant boundary';
  end if;
end;
$$;

-- Tenant B admin retains own directory access without gaining Tenant A access.
select set_config('request.jwt.claim.sub', current_setting('test.user_b'), true);
select set_config('request.jwt.claims', json_build_object('sub',current_setting('test.user_b'),'role','authenticated')::text,true);
do $$
begin
  if not exists(select 1 from public.memberships where id=current_setting('test.membership_b')::uuid) then
    raise exception 'administrator cannot resolve membership';
  end if;
  if exists(select 1 from public.memberships where tenant_id=current_setting('test.tenant_a')::uuid) then
    raise exception 'administrator crosses tenant boundary';
  end if;
end;
$$;

reset role;
set local role anon;
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claims','{}',true);
do $$
begin
  begin
    if exists(select 1 from public.memberships where id=current_setting('test.membership_b')::uuid) then
      raise exception 'anonymous membership access allowed';
    end if;
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;
