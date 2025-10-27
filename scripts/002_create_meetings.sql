-- Create meetings table for meeting rooms
create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  started_at timestamptz,
  ended_at timestamptz,
  status text not null default 'waiting' check (status in ('waiting', 'active', 'ended'))
);

-- Enable RLS
alter table public.meetings enable row level security;

-- Simplified RLS policies without participants reference
create policy "Users can view meetings they created"
  on public.meetings for select
  using (auth.uid() = created_by);

create policy "Users can create meetings"
  on public.meetings for insert
  with check (auth.uid() = created_by);

create policy "Meeting creators can update their meetings"
  on public.meetings for update
  using (auth.uid() = created_by);

create policy "Meeting creators can delete their meetings"
  on public.meetings for delete
  using (auth.uid() = created_by);

-- Create index for faster queries
create index if not exists meetings_created_by_idx on public.meetings(created_by);
create index if not exists meetings_status_idx on public.meetings(status);
