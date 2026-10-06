create extension if not exists pgcrypto;

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  status text not null default 'active' check (status in ('active', 'suspended', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create table public.tenant_settings (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  country text not null check (country ~ '^[A-Z]{2}$'),
  base_currency text not null check (base_currency ~ '^[A-Z]{3}$'),
  timezone text not null,
  default_locale text not null default 'fr' check (default_locale in ('fr', 'en')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  preferred_locale text not null default 'fr' check (preferred_locale in ('fr', 'en')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  scope text not null check (scope in ('tenant', 'platform')),
  created_at timestamptz not null default now()
);

create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  description text not null,
  created_at timestamptz not null default now()
);

create table public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'invited', 'inactive', 'revoked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  unique (tenant_id, user_id)
);

create table public.membership_roles (
  membership_id uuid not null references public.memberships(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete restrict,
  assigned_at timestamptz not null default now(),
  assigned_by uuid references auth.users(id) on delete set null,
  primary key (membership_id, role_id)
);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  email text not null,
  role_id uuid not null references public.roles(id) on delete restrict,
  token_hash text not null unique,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked', 'expired')),
  expires_at timestamptz not null default (now() + interval '14 days'),
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete restrict,
  unique (tenant_id, email, status)
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_type text not null,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  request_id text,
  created_at timestamptz not null default now()
);

create index memberships_user_id_idx on public.memberships(user_id);
create index memberships_tenant_id_idx on public.memberships(tenant_id);
create index membership_roles_role_id_idx on public.membership_roles(role_id);
create index invitations_tenant_id_idx on public.invitations(tenant_id);
create index invitations_email_idx on public.invitations(lower(email));
create index audit_events_tenant_created_idx on public.audit_events(tenant_id, created_at desc);
create index audit_events_actor_idx on public.audit_events(actor_user_id);

insert into public.permissions (key, description)
values
  ('tenant.settings.read', 'Read tenant settings'),
  ('tenant.settings.write', 'Update tenant settings'),
  ('users.read', 'Read tenant members'),
  ('users.invite', 'Invite tenant members'),
  ('users.manage_roles', 'Assign tenant roles'),
  ('users.deactivate', 'Deactivate tenant memberships'),
  ('audit.read', 'Read tenant audit events')
on conflict (key) do nothing;

insert into public.roles (key, label, scope)
values
  ('tenant_admin', 'Tenant administrator', 'tenant'),
  ('finance_manager', 'Finance manager', 'tenant'),
  ('cashier', 'Cashier', 'tenant'),
  ('registrar', 'Registrar', 'tenant'),
  ('auditor', 'Auditor', 'tenant')
on conflict (key) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.key in (
  'tenant.settings.read',
  'tenant.settings.write',
  'users.read',
  'users.invite',
  'users.manage_roles',
  'users.deactivate',
  'audit.read'
)
where r.key = 'tenant_admin'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.key in ('tenant.settings.read', 'users.read', 'audit.read')
where r.key in ('finance_manager', 'auditor')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.key = 'tenant.settings.read'
where r.key in ('cashier', 'registrar')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.key = 'users.read'
where r.key = 'registrar'
on conflict do nothing;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tenants_touch_updated_at
before update on public.tenants
for each row execute function public.touch_updated_at();

create trigger tenant_settings_touch_updated_at
before update on public.tenant_settings
for each row execute function public.touch_updated_at();

create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

create trigger memberships_touch_updated_at
before update on public.memberships
for each row execute function public.touch_updated_at();

create or replace function public.current_user_has_permission(target_tenant_id uuid, permission_key text)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.memberships m
    join public.membership_roles mr on mr.membership_id = m.id
    join public.role_permissions rp on rp.role_id = mr.role_id
    join public.permissions p on p.id = rp.permission_id
    where m.tenant_id = target_tenant_id
      and m.user_id = (select auth.uid())
      and m.status = 'active'
      and p.key = permission_key
  );
$$;

create or replace function public.create_tenant_with_admin(
  tenant_name text,
  tenant_slug text,
  tenant_country text,
  tenant_base_currency text,
  tenant_timezone text,
  tenant_default_locale text,
  actor_user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  new_tenant_id uuid;
  new_membership_id uuid;
  admin_role_id uuid;
  actor_email text;
begin
  if actor_user_id <> (select auth.uid()) then
    raise exception 'actor mismatch';
  end if;

  select email into actor_email from auth.users where id = actor_user_id;

  if actor_email is null then
    raise exception 'actor not found';
  end if;

  insert into public.profiles (id, email, preferred_locale)
  values (actor_user_id, actor_email, tenant_default_locale)
  on conflict (id) do update set email = excluded.email;

  insert into public.tenants (name, slug, created_by)
  values (tenant_name, tenant_slug, actor_user_id)
  returning id into new_tenant_id;

  insert into public.tenant_settings (tenant_id, country, base_currency, timezone, default_locale)
  values (new_tenant_id, tenant_country, tenant_base_currency, tenant_timezone, tenant_default_locale);

  insert into public.memberships (tenant_id, user_id, status, created_by)
  values (new_tenant_id, actor_user_id, 'active', actor_user_id)
  returning id into new_membership_id;

  select id into admin_role_id from public.roles where key = 'tenant_admin';

  insert into public.membership_roles (membership_id, role_id, assigned_by)
  values (new_membership_id, admin_role_id, actor_user_id);

  insert into public.audit_events (tenant_id, actor_user_id, action, target_type, target_id, metadata)
  values (
    new_tenant_id,
    actor_user_id,
    'tenant.created',
    'tenant',
    new_tenant_id,
    jsonb_build_object('slug', tenant_slug)
  );

  return new_tenant_id;
end;
$$;

create or replace function public.invite_tenant_member(
  target_tenant_id uuid,
  invitee_email text,
  role_key text,
  actor_user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  selected_role_id uuid;
  invitation_id uuid;
  generated_token text;
begin
  if actor_user_id <> (select auth.uid()) then
    raise exception 'actor mismatch';
  end if;

  if not public.current_user_has_permission(target_tenant_id, 'users.invite') then
    raise exception 'missing users.invite permission';
  end if;

  select id into selected_role_id
  from public.roles
  where key = role_key and scope = 'tenant';

  if selected_role_id is null then
    raise exception 'unknown role';
  end if;

  generated_token := encode(gen_random_bytes(32), 'hex');

  insert into public.invitations (tenant_id, email, role_id, token_hash, created_by)
  values (
    target_tenant_id,
    lower(invitee_email),
    selected_role_id,
    encode(digest(generated_token, 'sha256'), 'hex'),
    actor_user_id
  )
  returning id into invitation_id;

  insert into public.audit_events (tenant_id, actor_user_id, action, target_type, target_id, metadata)
  values (
    target_tenant_id,
    actor_user_id,
    'member.invited',
    'invitation',
    invitation_id,
    jsonb_build_object('email_domain', split_part(lower(invitee_email), '@', 2), 'role', role_key)
  );

  return invitation_id;
end;
$$;

revoke all on function public.create_tenant_with_admin(text, text, text, text, text, text, uuid) from public;
revoke all on function public.invite_tenant_member(uuid, text, text, uuid) from public;
revoke all on function public.current_user_has_permission(uuid, text) from public;
grant execute on function public.create_tenant_with_admin(text, text, text, text, text, text, uuid) to authenticated;
grant execute on function public.invite_tenant_member(uuid, text, text, uuid) to authenticated;
grant execute on function public.current_user_has_permission(uuid, text) to authenticated;

alter table public.tenants enable row level security;
alter table public.tenant_settings enable row level security;
alter table public.profiles enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.memberships enable row level security;
alter table public.membership_roles enable row level security;
alter table public.invitations enable row level security;
alter table public.audit_events enable row level security;

create policy "members can read their tenants"
on public.tenants for select
to authenticated
using (
  exists (
    select 1 from public.memberships m
    where m.tenant_id = tenants.id
      and m.user_id = (select auth.uid())
      and m.status = 'active'
  )
);

create policy "members can read tenant settings"
on public.tenant_settings for select
to authenticated
using (public.current_user_has_permission(tenant_id, 'tenant.settings.read'));

create policy "users can read own profile"
on public.profiles for select
to authenticated
using (id = (select auth.uid()));

create policy "tenant users can read member profiles"
on public.profiles for select
to authenticated
using (
  exists (
    select 1
    from public.memberships viewer
    join public.memberships subject on subject.tenant_id = viewer.tenant_id
    where viewer.user_id = (select auth.uid())
      and viewer.status = 'active'
      and subject.user_id = profiles.id
      and subject.status in ('active', 'invited', 'inactive')
  )
);

create policy "authenticated can read role catalog"
on public.roles for select
to authenticated
using (scope = 'tenant');

create policy "authenticated can read permission catalog"
on public.permissions for select
to authenticated
using (true);

create policy "authenticated can read role permission catalog"
on public.role_permissions for select
to authenticated
using (true);

create policy "members can read tenant memberships"
on public.memberships for select
to authenticated
using (public.current_user_has_permission(tenant_id, 'users.read'));

create policy "members can read tenant membership roles"
on public.membership_roles for select
to authenticated
using (
  exists (
    select 1
    from public.memberships m
    where m.id = membership_roles.membership_id
      and public.current_user_has_permission(m.tenant_id, 'users.read')
  )
);

create policy "admins can read tenant invitations"
on public.invitations for select
to authenticated
using (public.current_user_has_permission(tenant_id, 'users.invite'));

create policy "auditors can read tenant audit events"
on public.audit_events for select
to authenticated
using (tenant_id is not null and public.current_user_has_permission(tenant_id, 'audit.read'));
