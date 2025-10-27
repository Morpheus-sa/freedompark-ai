-- Create transcripts table for real-time meeting messages
create table if not exists public.transcripts (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.transcripts enable row level security;

-- RLS Policies for transcripts
create policy "Users can view transcripts in their meetings"
  on public.transcripts for select
  using (
    exists (
      select 1 from public.meetings
      where meetings.id = transcripts.meeting_id
      and (
        meetings.created_by = auth.uid() or
        exists (
          select 1 from public.participants
          where participants.meeting_id = meetings.id
          and participants.user_id = auth.uid()
        )
      )
    )
  );

create policy "Participants can insert transcripts"
  on public.transcripts for insert
  with check (
    auth.uid() = user_id and
    exists (
      select 1 from public.participants
      where participants.meeting_id = transcripts.meeting_id
      and participants.user_id = auth.uid()
      and participants.is_active = true
    )
  );

-- Create indexes for faster queries
create index if not exists transcripts_meeting_id_idx on public.transcripts(meeting_id);
create index if not exists transcripts_created_at_idx on public.transcripts(created_at);

-- Enable realtime for transcripts table
alter publication supabase_realtime add table public.transcripts;
