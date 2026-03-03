-- Bootstrap first household and lock snapshots by household membership

alter table app_state_snapshots enable row level security;

create policy snapshots_member_rw
on app_state_snapshots
for all
using (
  exists (
    select 1
    from household_memberships hm
    where hm.profile_id = auth.uid()
      and hm.household_id::text = app_state_snapshots.household_id
  )
)
with check (
  exists (
    select 1
    from household_memberships hm
    where hm.profile_id = auth.uid()
      and hm.household_id::text = app_state_snapshots.household_id
  )
);

create or replace function bootstrap_household(p_household_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
  v_household uuid;
begin
  v_user := auth.uid();
  if v_user is null then
    raise exception Not