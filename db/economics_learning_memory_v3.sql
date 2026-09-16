-- Economics Streaming OS v3 — private Learning Memory
-- Applied to Supabase project tlyczyfsboqrtrdpwizp on 2026-09-16.
-- Public Content/Knowledge Graph remains in repository JSON.
-- Personal memory is isolated by auth.uid() with RLS.

create table public.eco_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  active_project_id text,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint eco_profiles_settings_object check (jsonb_typeof(settings) = 'object')
);

create table public.eco_project_settings (
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  active boolean not null default true,
  weight_override jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, project_id),
  constraint eco_project_settings_weights_object check (jsonb_typeof(weight_override) = 'object')
);

create table public.eco_learning_state (
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id text not null,
  started boolean not null default false,
  completed boolean not null default false,
  applied boolean not null default false,
  evidence text,
  started_at timestamptz,
  completed_at timestamptz,
  applied_at timestamptz,
  last_opened_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, item_id),
  constraint eco_learning_state_progress check (
    (not completed or started) and (not applied or completed)
  )
);

create table public.eco_learning_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  item_id text,
  project_id text,
  action_id uuid,
  payload jsonb not null default '{}'::jsonb,
  event_at timestamptz not null default now(),
  constraint eco_learning_events_payload_object check (jsonb_typeof(payload) = 'object'),
  constraint eco_learning_events_type check (event_type in (
    'open','complete','apply','review','project_focus','project_toggle','sync_import','experiment'
  ))
);

create table public.eco_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id text not null,
  project_id text not null,
  concept_ids text[] not null default '{}',
  action text not null,
  expected_outcome text,
  metric text,
  review_date date,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  constraint eco_applications_action_nonempty check (length(btrim(action)) > 0),
  constraint eco_applications_status check (status in ('pending','reviewed','archived'))
);

create table public.eco_outcomes (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  signal text not null,
  observed_outcome text,
  learning text,
  observed_at timestamptz not null default now(),
  unique (application_id),
  foreign key (application_id, user_id)
    references public.eco_applications(id, user_id) on delete cascade,
  constraint eco_outcomes_signal check (signal in ('confirmed','inconclusive','contradicted'))
);

create table public.eco_experiments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  linked_application_id uuid,
  title text not null,
  hypothesis text not null,
  treatment text,
  comparison text,
  outcome_metric text,
  status text not null default 'designed',
  start_date date,
  end_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (linked_application_id, user_id)
    references public.eco_applications(id, user_id) on delete set null,
  constraint eco_experiments_title_nonempty check (length(btrim(title)) > 0),
  constraint eco_experiments_hypothesis_nonempty check (length(btrim(hypothesis)) > 0),
  constraint eco_experiments_status check (status in ('designed','running','completed','cancelled'))
);

create index eco_learning_events_user_time_idx on public.eco_learning_events(user_id, event_at desc);
create index eco_applications_user_status_review_idx on public.eco_applications(user_id, status, review_date);
create index eco_outcomes_user_time_idx on public.eco_outcomes(user_id, observed_at desc);
create index eco_experiments_user_status_idx on public.eco_experiments(user_id, status, updated_at desc);

alter table public.eco_profiles enable row level security;
alter table public.eco_project_settings enable row level security;
alter table public.eco_learning_state enable row level security;
alter table public.eco_learning_events enable row level security;
alter table public.eco_applications enable row level security;
alter table public.eco_outcomes enable row level security;
alter table public.eco_experiments enable row level security;

revoke all on table public.eco_profiles from anon, authenticated;
revoke all on table public.eco_project_settings from anon, authenticated;
revoke all on table public.eco_learning_state from anon, authenticated;
revoke all on table public.eco_learning_events from anon, authenticated;
revoke all on table public.eco_applications from anon, authenticated;
revoke all on table public.eco_outcomes from anon, authenticated;
revoke all on table public.eco_experiments from anon, authenticated;

grant select, insert, update, delete on table public.eco_profiles to authenticated;
grant select, insert, update, delete on table public.eco_project_settings to authenticated;
grant select, insert, update, delete on table public.eco_learning_state to authenticated;
grant select, insert, delete on table public.eco_learning_events to authenticated;
grant select, insert, update, delete on table public.eco_applications to authenticated;
grant select, insert, update, delete on table public.eco_outcomes to authenticated;
grant select, insert, update, delete on table public.eco_experiments to authenticated;

create policy "eco_profiles_select_own" on public.eco_profiles for select to authenticated using ((select auth.uid()) = user_id);
create policy "eco_profiles_insert_own" on public.eco_profiles for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "eco_profiles_update_own" on public.eco_profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "eco_profiles_delete_own" on public.eco_profiles for delete to authenticated using ((select auth.uid()) = user_id);

create policy "eco_project_settings_select_own" on public.eco_project_settings for select to authenticated using ((select auth.uid()) = user_id);
create policy "eco_project_settings_insert_own" on public.eco_project_settings for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "eco_project_settings_update_own" on public.eco_project_settings for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "eco_project_settings_delete_own" on public.eco_project_settings for delete to authenticated using ((select auth.uid()) = user_id);

create policy "eco_learning_state_select_own" on public.eco_learning_state for select to authenticated using ((select auth.uid()) = user_id);
create policy "eco_learning_state_insert_own" on public.eco_learning_state for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "eco_learning_state_update_own" on public.eco_learning_state for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "eco_learning_state_delete_own" on public.eco_learning_state for delete to authenticated using ((select auth.uid()) = user_id);

create policy "eco_learning_events_select_own" on public.eco_learning_events for select to authenticated using ((select auth.uid()) = user_id);
create policy "eco_learning_events_insert_own" on public.eco_learning_events for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "eco_learning_events_delete_own" on public.eco_learning_events for delete to authenticated using ((select auth.uid()) = user_id);

create policy "eco_applications_select_own" on public.eco_applications for select to authenticated using ((select auth.uid()) = user_id);
create policy "eco_applications_insert_own" on public.eco_applications for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "eco_applications_update_own" on public.eco_applications for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "eco_applications_delete_own" on public.eco_applications for delete to authenticated using ((select auth.uid()) = user_id);

create policy "eco_outcomes_select_own" on public.eco_outcomes for select to authenticated using ((select auth.uid()) = user_id);
create policy "eco_outcomes_insert_own" on public.eco_outcomes for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "eco_outcomes_update_own" on public.eco_outcomes for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "eco_outcomes_delete_own" on public.eco_outcomes for delete to authenticated using ((select auth.uid()) = user_id);

create policy "eco_experiments_select_own" on public.eco_experiments for select to authenticated using ((select auth.uid()) = user_id);
create policy "eco_experiments_insert_own" on public.eco_experiments for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "eco_experiments_update_own" on public.eco_experiments for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "eco_experiments_delete_own" on public.eco_experiments for delete to authenticated using ((select auth.uid()) = user_id);
