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

-- RLS Policies for participants
create policy "Users can view participants in their meetings"
  on public.participants for select
  using (
    exists (
      select 1 from public.meetings
      where meetings.id = participants.meeting_id
      and (
        meetings.created_by = auth.uid() or
        exists (
          select 1 from public.participants p2
          where p2.meeting_id = meetings.id
          and p2.user_id = auth.uid()
        )
      )
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
