-- ============================================================
-- Mindra local IDs are ULIDs (Crockford base32, 26 chars), not UUIDs.
-- This migration switches every non-auth id and FK column from uuid
-- to text. The user_id columns (and preferences.id) reference
-- auth.users.id which is uuid; those stay uuid.
-- ============================================================

-- Drop FK constraints first; recasting a uuid column to text requires
-- the referenced column to be cast first, and FKs prevent that. Recreate
-- the FKs at the bottom against the new text columns.

alter table public.workouts drop constraint if exists workouts_pattern_id_fkey;
alter table public.exercises drop constraint if exists exercises_workout_id_fkey;
alter table public.sets drop constraint if exists sets_exercise_id_fkey;

-- workouts
alter table public.workouts alter column id type text using id::text;
alter table public.workouts alter column pattern_id type text using pattern_id::text;

-- patterns
alter table public.patterns alter column id type text using id::text;

-- exercises
alter table public.exercises alter column id type text using id::text;
alter table public.exercises alter column workout_id type text using workout_id::text;

-- sets
alter table public.sets alter column id type text using id::text;
alter table public.sets alter column exercise_id type text using exercise_id::text;

-- library
alter table public.library alter column id type text using id::text;

-- check_ins
alter table public.check_ins alter column id type text using id::text;

-- Recreate FK constraints against text columns.
alter table public.workouts
  add constraint workouts_pattern_id_fkey
  foreign key (pattern_id) references public.patterns(id) on delete set null;

alter table public.exercises
  add constraint exercises_workout_id_fkey
  foreign key (workout_id) references public.workouts(id) on delete cascade;

alter table public.sets
  add constraint sets_exercise_id_fkey
  foreign key (exercise_id) references public.exercises(id) on delete cascade;