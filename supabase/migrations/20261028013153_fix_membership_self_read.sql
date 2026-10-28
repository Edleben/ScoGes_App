-- Self-resolution must not require permission to enumerate the tenant directory.
-- Existing users.read policies continue to govern access to other memberships.
create policy "users can read own active membership"
on public.memberships for select to authenticated
using (user_id = (select auth.uid()) and status = 'active');

create policy "users can read own active membership roles"
on public.membership_roles for select to authenticated
using (
  exists (
    select 1 from public.memberships m
    where m.id = membership_roles.membership_id
      and m.user_id = (select auth.uid())
      and m.status = 'active'
  )
);

-- The previous profile policy relied on directory RLS implicitly. Make that
-- permission explicit so adding self-read never broadens profile visibility.
drop policy "tenant users can read member profiles" on public.profiles;
create policy "tenant users can read member profiles"
on public.profiles for select to authenticated
using (
  exists (
    select 1 from public.memberships subject
    where subject.user_id = profiles.id
      and subject.status in ('active', 'invited', 'inactive')
      and public.current_user_has_permission(subject.tenant_id, 'users.read')
  )
);
