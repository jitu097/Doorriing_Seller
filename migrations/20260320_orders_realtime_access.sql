-- Ensure the orders table can emit Postgres changes through Supabase Realtime.
alter publication supabase_realtime add table if not exists public.orders;

-- Helpful for richer UPDATE/DELETE payloads and safe for INSERT listeners.
alter table if exists public.orders replica identity full;

-- The frontend uses Firebase auth, so the Supabase JS client connects with the anon role
-- unless a custom Supabase-compatible JWT is explicitly attached.
-- Without a SELECT policy for anon, the Realtime socket can be SUBSCRIBED but receive no rows.
alter table if exists public.orders enable row level security;

drop policy if exists "orders_realtime_select_anon" on public.orders;
create policy "orders_realtime_select_anon"
on public.orders
for select
to anon
using (true);

drop policy if exists "orders_realtime_select_authenticated" on public.orders;
create policy "orders_realtime_select_authenticated"
on public.orders
for select
to authenticated
using (true);
