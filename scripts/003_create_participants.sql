-- Create participants table for tracking who's in each meeting
create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz default now(),
  left_at timestamptz,
  is_active boolean default true,
  unique(meeting_id, user_id)
);

-- Enable RLS
alter table public.participants enable row level security;

-- Simplified RLS policy to avoid infinite recursion
-- Users can view participants if they are in the same meeting (by checking their own participant record directly)
create policy "Users can view participants in their meetings"
  on public.participants for select
  using (
    -- User can see their own participant record
    auth.uid() = user_id
    or
    -- User can see other participants if they have a participant record in the same meeting
    meeting_id in (
      select meeting_id from public.participants
      where user_id = auth.uid()
    )
  );

create policy "Users can join meetings"
  on public.participants for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own participation"
  on public.participants for update
  using (auth.uid() = user_id);

-- Create indexes for faster queries
create index if not exists participants_meeting_id_idx on public.participants(meeting_id);
create index if not exists participants_user_id_idx on public.participants(user_id);
create index if not exists participants_is_active_idx on public.participants(is_active);
