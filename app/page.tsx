"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { AuthDialog } from "@/components/auth-dialog"
import { MeetingRoomList } from "@/components/meeting-room-list"
import { JoinMeetingDialog } from "@/components/join-meeting-dialog"
import { CollaborativeMeetingRecorder } from "@/components/collaborative-meeting-recorder"
import { Button } from "@/components/ui/button"
import { LogOut, UserPlus } from "lucide-react"

export default function Home() {
  const { user, signOut } = useAuth()
  const [authDialogOpen, setAuthDialogOpen] = useState(false)
  const [joinDialogOpen, setJoinDialogOpen] = useState(false)
  const [activeMeetingId, setActiveMeetingId] = useState<string | null>(null)

  const handleJoinMeeting = (meetingId: string) => {
    setActiveMeetingId(meetingId)
  }

  const handleEndMeeting = () => {
    setActiveMeetingId(null)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-12">
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <h1 className="mb-3 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">AI Meeting Notes</h1>
              <p className="text-lg text-muted-foreground">Collaborative real-time meeting transcription with AI</p>
            </div>
            {user && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{user.displayName}</span>
                <Button variant="outline" size="sm" onClick={() => signOut()}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </header>

        {!user ? (
          <div className="mx-auto max-w-md text-center">
            <div className="rounded-lg border border-border bg-card p-8">
              <UserPlus className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h2 className="mb-2 text-xl font-semibold">Sign in to continue</h2>
              <p className="mb-6 text-sm text-muted-foreground">
                Create an account or sign in to join collaborative meetings
              </p>
              <Button onClick={() => setAuthDialogOpen(true)} className="w-full">
                Get Started
              </Button>
            </div>
          </div>
        ) : activeMeetingId ? (
          <div className="mx-auto max-w-4xl">
            <CollaborativeMeetingRecorder meetingId={activeMeetingId} onEndMeeting={handleEndMeeting} />
          </div>
        ) : (
          <div className="mx-auto max-w-4xl space-y-4">
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setJoinDialogOpen(true)}>
                Join with ID
              </Button>
            </div>
            <MeetingRoomList onJoinMeeting={handleJoinMeeting} />
          </div>
        )}

        <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
        <JoinMeetingDialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen} onJoinSuccess={handleJoinMeeting} />
      </div>
    </div>
  )
}
