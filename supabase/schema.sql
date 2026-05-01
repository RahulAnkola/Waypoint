-- Run this in your Supabase SQL editor

create table if not exists public.trips (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  origin jsonb not null,       -- { address: string, lat: number, lng: number }
  destination jsonb not null,  -- { address: string, lat: number, lng: number }
  waypoints jsonb default '[]'::jsonb, -- [{ address: string, lat: number, lng: number }]
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table public.trips enable row level security;

-- Policies: users can only access their own trips
create policy "select_own_trips" on public.trips
  for select using (auth.uid() = user_id);

create policy "insert_own_trips" on public.trips
  for insert with check (auth.uid() = user_id);

create policy "update_own_trips" on public.trips
  for update using (auth.uid() = user_id);

create policy "delete_own_trips" on public.trips
  for delete using (auth.uid() = user_id);

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trips_updated_at
  before update on public.trips
  for each row execute procedure public.handle_updated_at();
