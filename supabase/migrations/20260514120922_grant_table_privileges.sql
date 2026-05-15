-- ============================================================
-- Grant table privileges to authenticated role.
-- RLS policies determine *which rows* a user can touch; these grants
-- determine *whether the role can execute the verb at all*. Without
-- these, RLS never fires — permission is denied upstream.
-- ============================================================

grant select, insert, update, delete on public.preferences  to authenticated;
grant select, insert, update, delete on public.patterns     to authenticated;
grant select, insert, update, delete on public.workouts     to authenticated;
grant select, insert, update, delete on public.exercises    to authenticated;
grant select, insert, update, delete on public.library      to authenticated;
grant select, insert, update, delete on public.sets         to authenticated;
grant select, insert, update, delete on public.check_ins    to authenticated;