-- notification_tokens RLS hardening
-- This app uses Firebase Auth on the frontend and a verified backend service
-- role for writes. Keep client writes locked down and allow the backend path.

alter table if exists public.notification_tokens enable row level security;

drop policy if exists "notification_tokens_service_role_all" on public.notification_tokens;
create policy "notification_tokens_service_role_all"
on public.notification_tokens
for all
to service_role
using (true)
with check (true);

drop policy if exists "notification_tokens_authenticated_select_own" on public.notification_tokens;
create policy "notification_tokens_authenticated_select_own"
on public.notification_tokens
for select
to authenticated
using (
  customer_id in (
    select id
    from public.users
    where firebase_uid = auth.uid()::text
  )
);

-- Direct browser inserts are intentionally not allowed here because the app
-- authenticates with Firebase, not Supabase Auth. Token registration should
-- go through the backend route that verifies Firebase and writes with the
-- service role.
