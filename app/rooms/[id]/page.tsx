import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { MeetingRoom } from "@/components/meeting-room"
import { NavHeader } from "@/components/nav-header"

export default async function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", user.id).single()

  // Fetch meeting details
  const { data: meeting, error } = await supabase.from("meetings").select("*").eq("id", id).single()

  if (error || !meeting) {
    redirect("/rooms")
  }

  // Check if user is already a participant, if not add them
  const { data: existingParticipant } = await supabase
    .from("participants")
    .select("*")
    .eq("meeting_id", id)
    .eq("user_id", user.id)
    .single()

  if (!existingParticipant) {
    await supabase.from("participants").insert({
      meeting_id: id,
      user_id: user.id,
      is_active: true,
    })
  }

  return (
    <>
      <NavHeader userEmail={user.email} displayName={profile?.display_name} />
      <MeetingRoom meetingId={id} userId={user.id} meetingTitle={meeting.title} />
    </>
  )
}
