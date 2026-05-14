-- ============================================================
-- Mindra Supabase schema — initial
-- ============================================================
-- One row per user for user-scoped settings (profile + preferences merged).
-- Domain tables (workouts, exercises, sets, library, patterns, check_ins)
-- carry user_id and full sync metadata (updated_at, synced_at, deleted_at).
-- updated_at is timestamptz; the sync layer converts to/from ISO strings.
-- Every table has RLS; users can only access their own rows.
-- ============================================================

-- ----------- helper: updated_at trigger ----------------------
-- Postgres-side safety net: if a client forgets to bump updated_at, the
-- trigger does it. The client should still bump explicitly so the value
-- reflects "last edit on this device" rather than "last server write."
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  if new.updated_at is null or new.updated_at = old.updated_at then
    new.updated_at = now();
  end if;
  return new;
end;
$$;

-- ============================================================
-- preferences: merged profile + preferences.
-- One row per auth.users entry; created via on-signup trigger.
-- ============================================================
create table public.preferences (
  id uuid primary key references auth.users(id) on delete cascade,
  -- profile-shaped fields:
  display_name text not null default '',
  rest_default_s integer not null default 90,
  -- preferences-shaped fields:
  week_start text not null default 'mon' check (week_start in ('mon','sun')),
  units text not null default 'metric' check (units in ('metric','imperial')),
  -- kind mode:
  kind_mode boolean not null default false,
  kind_soft_language boolean not null default false,
  kind_reduced_motion boolean not null default false,
  kind_larger_text boolean not null default false,
  kind_hide_totals boolean not null default false,
  kind_hide_counts boolean not null default false,
  kind_word_check_in boolean not null default false,
  -- sync metadata:
  updated_at timestamptz not null default now(),
  synced_at timestamptz,
  deleted_at timestamptz
);

create trigger preferences_set_updated_at
before update on public.preferences
for each row execute function set_updated_at();

alter table public.preferences enable row level security;

create policy "preferences: select own"
on public.preferences for select using (auth.uid() = id);

create policy "preferences: insert own"
on public.preferences for insert with check (auth.uid() = id);

create policy "preferences: update own"
on public.preferences for update using (auth.uid() = id);

-- ============================================================
-- patterns
-- ============================================================
create table public.patterns (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  is_preset boolean not null default false,
  body jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  synced_at timestamptz,
  deleted_at timestamptz
);

create index patterns_user_name_idx on public.patterns(user_id, name);
create index patterns_user_updated_idx on public.patterns(user_id, updated_at);

create trigger patterns_set_updated_at
before update on public.patterns
for each row execute function set_updated_at();

alter table public.patterns enable row level security;

create policy "patterns: select own"
on public.patterns for select using (auth.uid() = user_id);

create policy "patterns: insert own"
on public.patterns for insert with check (auth.uid() = user_id);

create policy "patterns: update own"
on public.patterns for update using (auth.uid() = user_id);

create policy "patterns: delete own"
on public.patterns for delete using (auth.uid() = user_id);

-- ============================================================
-- workouts
-- pattern_id: FK with ON DELETE SET NULL — deleting a pattern nulls the
-- reference instead of orphaning a string id.
-- ============================================================
create table public.workouts (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  date text not null,                            -- ISO YYYY-MM-DD
  pattern_id uuid references public.patterns(id) on delete set null,
  note text not null default '',
  pain_pre jsonb not null default '[]'::jsonb,   -- PainSite[]
  pain_post jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  synced_at timestamptz,
  deleted_at timestamptz
);

create index workouts_user_date_idx on public.workouts(user_id, date);
create index workouts_user_updated_idx on public.workouts(user_id, updated_at);

create trigger workouts_set_updated_at
before update on public.workouts
for each row execute function set_updated_at();

alter table public.workouts enable row level security;

create policy "workouts: select own"
on public.workouts for select using (auth.uid() = user_id);

create policy "workouts: insert own"
on public.workouts for insert with check (auth.uid() = user_id);

create policy "workouts: update own"
on public.workouts for update using (auth.uid() = user_id);

create policy "workouts: delete own"
on public.workouts for delete using (auth.uid() = user_id);

-- ============================================================
-- exercises
-- ============================================================
create table public.exercises (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_id uuid not null references public.workouts(id) on delete cascade,
  position integer not null,
  name text not null,
  updated_at timestamptz not null default now(),
  synced_at timestamptz,
  deleted_at timestamptz
);

create index exercises_user_workout_idx on public.exercises(user_id, workout_id);
create index exercises_user_updated_idx on public.exercises(user_id, updated_at);

create trigger exercises_set_updated_at
before update on public.exercises
for each row execute function set_updated_at();

alter table public.exercises enable row level security;

create policy "exercises: select own"
on public.exercises for select using (auth.uid() = user_id);

create policy "exercises: insert own"
on public.exercises for insert with check (auth.uid() = user_id);

create policy "exercises: update own"
on public.exercises for update using (auth.uid() = user_id);

create policy "exercises: delete own"
on public.exercises for delete using (auth.uid() = user_id);

-- ============================================================
-- library (user's exercise library)
-- ============================================================
create table public.library (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  is_standard boolean not null default false,
  category text,
  last_used timestamptz,
  updated_at timestamptz not null default now(),
  synced_at timestamptz,
  deleted_at timestamptz
);

create index library_user_name_idx on public.library(user_id, name);
create index library_user_updated_idx on public.library(user_id, updated_at);

create trigger library_set_updated_at
before update on public.library
for each row execute function set_updated_at();

alter table public.library enable row level security;

create policy "library: select own"
on public.library for select using (auth.uid() = user_id);

create policy "library: insert own"
on public.library for insert with check (auth.uid() = user_id);

create policy "library: update own"
on public.library for update using (auth.uid() = user_id);

create policy "library: delete own"
on public.library for delete using (auth.uid() = user_id);

-- ============================================================
-- sets
-- ============================================================
create table public.sets (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  position integer not null,
  reps integer,
  weight_kg double precision,
  duration_s integer,
  rpe double precision,
  updated_at timestamptz not null default now(),
  synced_at timestamptz,
  deleted_at timestamptz
);

create index sets_user_exercise_idx on public.sets(user_id, exercise_id);
create index sets_user_updated_idx on public.sets(user_id, updated_at);

create trigger sets_set_updated_at
before update on public.sets
for each row execute function set_updated_at();

alter table public.sets enable row level security;

create policy "sets: select own"
on public.sets for select using (auth.uid() = user_id);

create policy "sets: insert own"
on public.sets for insert with check (auth.uid() = user_id);

create policy "sets: update own"
on public.sets for update using (auth.uid() = user_id);

create policy "sets: delete own"
on public.sets for delete using (auth.uid() = user_id);

-- ============================================================
-- check_ins
-- One non-deleted row per user per date; partial unique index allows
-- soft-deleted rows to coexist without blocking a fresh entry.
-- ============================================================
create table public.check_ins (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  date text not null,
  pain integer not null default 0,
  note text not null default '',
  pain_sites jsonb not null default '[]'::jsonb,
  is_rest_day boolean not null default false,
  rest_reason text check (rest_reason in ('planned','forced','skipped')),
  updated_at timestamptz not null default now(),
  synced_at timestamptz,
  deleted_at timestamptz
);

create unique index check_ins_user_date_unique
on public.check_ins(user_id, date)
where deleted_at is null;

create index check_ins_user_updated_idx on public.check_ins(user_id, updated_at);

create trigger check_ins_set_updated_at
before update on public.check_ins
for each row execute function set_updated_at();

alter table public.check_ins enable row level security;

create policy "check_ins: select own"
on public.check_ins for select using (auth.uid() = user_id);

create policy "check_ins: insert own"
on public.check_ins for insert with check (auth.uid() = user_id);

create policy "check_ins: update own"
on public.check_ins for update using (auth.uid() = user_id);

create policy "check_ins: delete own"
on public.check_ins for delete using (auth.uid() = user_id);

-- ============================================================
-- On-signup trigger: create preferences row automatically.
-- One source of truth per user — no "user signed in but has no
-- preferences row yet" edge case.
-- ============================================================
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.preferences (id)
  values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function handle_new_user();