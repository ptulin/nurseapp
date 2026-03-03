-- NurseApp base schema (Supabase/Postgres)

create extension if not exists pgcrypto;

create table if not exists households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists profiles (
  id uuid primary key,
  email text,
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists household_memberships (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  role text not null check (role in (Family, Caregiver, Admin)),
  is_primary_contact boolean not null default false,
  created_at timestamptz not null default now(),
  unique (household_id, profile_id)
);

create table if not exists recipients (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  full_name text not null,
  color_label text,
  created_at timestamptz not null default now()
);

create table if not exists care_categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  unique (household_id, name)
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  recipient_id uuid not null references recipients(id) on delete cascade,
  category_id uuid not null references care_categories(id),
  title text not null,
  task_type text not null check (task_type in (task, med, note)),
  due_at timestamptz not null,
  status text not null default pending check (status in (pending, done, missed)),
  high_risk boolean not null default false,
  requires_second_confirm boolean not null default false,
  confirmed_by_second boolean not null default false,
  evidence_note text,
  evidence_image_url text,
  acknowledged_at timestamptz,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists alerts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  recipient_id uuid not null references recipients(id) on delete cascade,
  task_id uuid references tasks(id) on delete cascade,
  alert_type text not null check (alert_type in (med, task, note)),
  status text not null check (status in (active, acknowledged, resolved)),
  escalated_at timestamptz,
  acknowledged_by uuid references profiles(id),
  acknowledged_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  recipient_id uuid not null references recipients(id) on delete cascade,
  sender_profile_id uuid references profiles(id),
  sender_role text not null check (sender_role in (Family, Caregiver, Admin)),
  body text,
  image_url text,
  created_at timestamptz not null default now()
);

create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  actor_profile_id uuid references profiles(id),
  action text not null,
  target_type text not null,
  target_id uuid,
  payload jsonb,
  created_at timestamptz not null default now()
);

create table if not exists app_state_snapshots (
  id bigserial primary key,
  household_id text not null,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists idx_tasks_household_due on tasks (household_id, due_at);
create index if not exists idx_alerts_household_status on alerts (household_id, status);
create index if not exists idx_chat_household_recipient on chat_messages (household_id, recipient_id, created_at desc);
create index if not exists idx_snapshot_household_time on app_state_snapshots (household_id, updated_at desc);
