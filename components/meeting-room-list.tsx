"use client"

import { useState, useEffect } from "react"
import { collection, query, where, onSnapshot, orderBy, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Users, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"
import type { Meeting } from "@/types/meeting"

interface MeetingRoomListProps {
  onJoinMeeting: (meetingId: string) => void
}

export function MeetingRoomList({ onJoinMeeting }: MeetingRoomListProps) {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [newMeetingTitle, setNewMeetingTitle] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (!user) return

    const q = query(
      collection(db, "meetings"),
      where("participants", "array-contains", user.uid),
      where("isActive", "==", true),
      orderBy("createdAt", "desc"),
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const meetingsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Meeting[]
      setMeetings(meetingsData)
    })

    return unsubscribe
  }, [user])

  const createMeeting = async () => {
    if (!user || !newMeetingTitle.trim()) return

    setLoading(true)
    try {
      const docRef = await addDoc(collection(db, "meetings"), {
        title: newMeetingTitle,
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        participants: [user.uid],
        transcript: [],
        isActive: true,
      })

      toast({
        title: "Meeting created",
        description: "You can now start recording",
      })

      setDialogOpen(false)
      setNewMeetingTitle("")
      onJoinMeeting(docRef.id)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create meeting",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Meeting Rooms</CardTitle>
            <CardDescription>Join or create a collaborative meeting</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                New Meeting
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Meeting</DialogTitle>
                <DialogDescription>Start a new collaborative meeting room</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Meeting Title</Label>
                  <Input
                    id="title"
                    value={newMeetingTitle}
                    onChange={(e) => setNewMeetingTitle(e.target.value)}
                    placeholder="e.g., Team Standup, Client Call"
                    onKeyDown={(e) => e.key === "Enter" && createMeeting()}
                  />
                </div>
                <Button onClick={createMeeting} disabled={loading || !newMeetingTitle.trim()} className="w-full">
                  {loading ? "Creating..." : "Create Meeting"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {meetings.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <Users className="mx-auto mb-2 h-12 w-12 opacity-50" />
            <p>No active meetings</p>
            <p className="text-sm">Create a new meeting to get started</p>
          </div>
        ) : (
          <div className="space-y-2">
            {meetings.map((meeting) => (
              <button
                key={meeting.id}
                onClick={() => onJoinMeeting(meeting.id)}
                className="w-full rounded-lg border border-border bg-card p-4 text-left transition-colors hover:bg-accent"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{meeting.title}</h3>
                    <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {meeting.participants.length} participant{meeting.participants.length !== 1 ? "s" : ""}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(meeting.createdAt, { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  <div className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">Active</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
