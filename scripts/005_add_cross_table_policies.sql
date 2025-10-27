-- Add RLS policies that reference multiple tables after all tables are created

-- Drop the simple meetings select policy
drop policy if exists "Users can view meetings they created" on public.meetings;

-- Add the full policy that includes participants
create policy "Users can view meetings they participate in"
  on public.meetings for select
  using (
    auth.uid() = created_by or
    exists (
      select 1 from public.participants
      where participants.meeting_id = meetings.id
      and participants.user_id = auth.uid()
    )
  );
