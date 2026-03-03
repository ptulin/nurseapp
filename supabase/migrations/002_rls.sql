-- Row level security starter policies

alter table households enable row level security;
alter table household_memberships enable row level security;
alter table recipients enable row level security;
alter table care_categories enable row level security;
alter table tasks enable row level security;
alter table alerts enable row level security;
alter table chat_messages enable row level security;
alter table audit_log enable row level security;

create or replace function is_household_member(_household uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from household_memberships hm
    where hm.household_id = _household
      and hm.profile_id = auth.uid()
  );
$$;

create policy households_member_read
on households
for select
using (is_household_member(id));

create policy household_memberships_member_read
on household_memberships
for select
using (is_household_member(household_id));

create policy recipients_member_rw
on recipients
for all
using (is_household_member(household_id))
with check (is_household_member(household_id));

create policy categories_member_rw
on care_categories
for all
using (is_household_member(household_id))
with check (is_household_member(household_id));

create policy tasks_member_rw
on tasks
for all
using (is_household_member(household_id))
with check (is_household_member(household_id));

create policy alerts_member_rw
on alerts
for all
using (is_household_member(household_id))
with check (is_household_member(household_id));

create policy chat_member_rw
on chat_messages
for all
using (is_household_member(household_id))
with check (is_household_member(household_id));

create policy audit_member_read
on audit_log
for select
using (is_household_member(household_id));
