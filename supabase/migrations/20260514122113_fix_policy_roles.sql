-- ============================================================
-- Re-create every RLS policy explicitly scoped to the `authenticated`
-- role. The originals were attached to `public`, which in some Supabase
-- configurations doesn't apply to authenticated user requests — leading
-- to a real cross-user data leak (User B could insert rows with User A's
-- user_id). This migration drops and recreates each policy with an
-- explicit `to authenticated` clause.
-- ============================================================

-- preferences
drop policy if exists "preferences: select own" on public.preferences;
drop policy if exists "preferences: insert own" on public.preferences;
drop policy if exists "preferences: update own" on public.preferences;

create policy "preferences: select own"
on public.preferences for select to authenticated
using (auth.uid() = id);

create policy "preferences: insert own"
on public.preferences for insert to authenticated
with check (auth.uid() = id);

create policy "preferences: update own"
on public.preferences for update to authenticated
using (auth.uid() = id);

-- patterns
drop policy if exists "patterns: select own" on public.patterns;
drop policy if exists "patterns: insert own" on public.patterns;
drop policy if exists "patterns: update own" on public.patterns;
drop policy if exists "patterns: delete own" on public.patterns;

create policy "patterns: select own"
on public.patterns for select to authenticated
using (auth.uid() = user_id);

create policy "patterns: insert own"
on public.patterns for insert to authenticated
with check (auth.uid() = user_id);

create policy "patterns: update own"
on public.patterns for update to authenticated
using (auth.uid() = user_id);

create policy "patterns: delete own"
on public.patterns for delete to authenticated
using (auth.uid() = user_id);

-- workouts
drop policy if exists "workouts: select own" on public.workouts;
drop policy if exists "workouts: insert own" on public.workouts;
drop policy if exists "workouts: update own" on public.workouts;
drop policy if exists "workouts: delete own" on public.workouts;

create policy "workouts: select own"
on public.workouts for select to authenticated
using (auth.uid() = user_id);

create policy "workouts: insert own"
on public.workouts for insert to authenticated
with check (auth.uid() = user_id);

create policy "workouts: update own"
on public.workouts for update to authenticated
using (auth.uid() = user_id);

create policy "workouts: delete own"
on public.workouts for delete to authenticated
using (auth.uid() = user_id);

-- exercises
drop policy if exists "exercises: select own" on public.exercises;
drop policy if exists "exercises: insert own" on public.exercises;
drop policy if exists "exercises: update own" on public.exercises;
drop policy if exists "exercises: delete own" on public.exercises;

create policy "exercises: select own"
on public.exercises for select to authenticated
using (auth.uid() = user_id);

create policy "exercises: insert own"
on public.exercises for insert to authenticated
with check (auth.uid() = user_id);

create policy "exercises: update own"
on public.exercises for update to authenticated
using (auth.uid() = user_id);

create policy "exercises: delete own"
on public.exercises for delete to authenticated
using (auth.uid() = user_id);

-- library
drop policy if exists "library: select own" on public.library;
drop policy if exists "library: insert own" on public.library;
drop policy if exists "library: update own" on public.library;
drop policy if exists "library: delete own" on public.library;

create policy "library: select own"
on public.library for select to authenticated
using (auth.uid() = user_id);

create policy "library: insert own"
on public.library for insert to authenticated
with check (auth.uid() = user_id);

create policy "library: update own"
on public.library for update to authenticated
using (auth.uid() = user_id);

create policy "library: delete own"
on public.library for delete to authenticated
using (auth.uid() = user_id);

-- sets
drop policy if exists "sets: select own" on public.sets;
drop policy if exists "sets: insert own" on public.sets;
drop policy if exists "sets: update own" on public.sets;
drop policy if exists "sets: delete own" on public.sets;

create policy "sets: select own"
on public.sets for select to authenticated
using (auth.uid() = user_id);

create policy "sets: insert own"
on public.sets for insert to authenticated
with check (auth.uid() = user_id);

create policy "sets: update own"
on public.sets for update to authenticated
using (auth.uid() = user_id);

create policy "sets: delete own"
on public.sets for delete to authenticated
using (auth.uid() = user_id);

-- check_ins
drop policy if exists "check_ins: select own" on public.check_ins;
drop policy if exists "check_ins: insert own" on public.check_ins;
drop policy if exists "check_ins: update own" on public.check_ins;
drop policy if exists "check_ins: delete own" on public.check_ins;

create policy "check_ins: select own"
on public.check_ins for select to authenticated
using (auth.uid() = user_id);

create policy "check_ins: insert own"
on public.check_ins for insert to authenticated
with check (auth.uid() = user_id);

create policy "check_ins: update own"
on public.check_ins for update to authenticated
using (auth.uid() = user_id);

create policy "check_ins: delete own"
on public.check_ins for delete to authenticated
using (auth.uid() = user_id);