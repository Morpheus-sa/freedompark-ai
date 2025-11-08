"use client"

import { useState, useEffect } from "react"
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  arrayUnion,
  orderBy,
  getDoc,
  addDoc,
  Timestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Users, Clock, Shield, AlertCircle, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"
import type { Meeting } from "@/types/meeting"
import { ScheduleMeetingDialog } from "@/components/schedule-meeting-dialog"
import { JoinMeetingDialog } from "@/components/join-meeting-dialog"
import { generateMeetingCode } from "@/lib/meeting-code-generator"
import { sendNotification } from "@/lib/notification-service"

interface MeetingRoomListProps {
  onJoinMeeting: (meetingId: string) => void
}

export function MeetingRoomList({ onJoinMeeting }: MeetingRoomListProps) {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [newMeetingTitle, setNewMeetingTitle] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false)
  const [joinDialogOpen, setJoinDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (!user) return

    console.log("Setting up meetings listener for user:", user.uid)

    const q = query(collection(db, "meetings"), where("isActive", "==", true), orderBy("createdAt", "desc"))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log("Received meetings snapshot, docs count:", snapshot.docs.length)
        const meetingsData = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter((meeting: any) => meeting.participants?.includes(user.uid)) as Meeting[]

        console.log("Filtered meetings for user:", meetingsData.length)
        setMeetings(meetingsData)
      },
      (error) => {
        console.error("Error listening to meetings:", error)
        const isPermissionError =
          error.code === "permission-denied" ||
          error.message?.includes("permission") ||
          error.message?.includes("PERMISSION_DENIED")

        toast({
          title: isPermissionError ? "Permission Denied" : "Error",
          description: isPermissionError
            ? "Firestore security rules are blocking access. Please deploy the firestore.rules file to your Firebase project."
            : "Failed to load meetings",
          variant: "destructive",
        })
      },
    )

    return unsubscribe
  }, [user, toast])

  const createMeeting = async () => {
    if (!user || !newMeetingTitle.trim()) return

    if (!user.isAdmin) {
      toast({
        title: "Permission Denied",
        description: "Only administrators can create meetings.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    console.log("[v0] Creating meeting:", newMeetingTitle)

    try {
      const shareCode = generateMeetingCode()
      console.log("[v0] Generated share code:", shareCode)

      const docRef = await addDoc(collection(db, "meetings"), {
        title: newMeetingTitle,
        shareCode,
        createdAt: Timestamp.now(),
        createdBy: user.uid,
        participants: [user.uid],
        invitedParticipants: [],
        transcript: [],
        isActive: true,
      })

      console.log("[v0] Meeting created with ID:", docRef.id, "Code:", shareCode)

      toast({
        title: "Meeting created",
        description: `Share code: ${shareCode}`,
      })

      setDialogOpen(false)
      setNewMeetingTitle("")
      onJoinMeeting(docRef.id)
    } catch (error: any) {
      console.error("[v0] Error creating meeting:", error)
      const isPermissionError =
        error.code === "permission-denied" ||
        error.message?.includes("permission") ||
        error.message?.includes("PERMISSION_DENIED")

      toast({
        title: isPermissionError ? "Permission Denied" : "Error",
        description: isPermissionError
          ? "Only administrators can create meetings. Please contact an admin to create a meeting for you."
          : error.message || "Failed to create meeting",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const joinMeeting = async (meetingId: string) => {
    if (!user) return

    try {
      const meetingRef = doc(db, "meetings", meetingId)
      const meetingDoc = await getDoc(meetingRef)

      if (!meetingDoc.exists()) {
        toast({
          title: "Error",
          description: "Meeting not found",
          variant: "destructive",
        })
        return
      }

      const meetingData = meetingDoc.data() as Meeting

      if (!meetingData.participants.includes(user.uid)) {
        await updateDoc(meetingRef, {
          participants: arrayUnion(user.uid),
        })

        if (meetingData.createdBy !== user.uid) {
          await sendNotification(
            meetingData.createdBy,
            "participant_added",
            "Participant Joined",
            `${user.displayName} joined "${meetingData.title}"`,
            {
              meetingId: meetingData.id,
              meetingTitle: meetingData.title,
              meetingCode: meetingData.shareCode,
            },
          )
        }
      }

      onJoinMeeting(meetingId)
    } catch (error: any) {
      console.error("Error joining meeting:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to join meeting",
        variant: "destructive",
      })
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Meeting Rooms</CardTitle>
              <CardDescription>Join or create a collaborative meeting</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!user?.isAdmin && (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Only administrators can create meetings. You can join existing meetings or ask an admin to create one
                for you.
              </AlertDescription>
            </Alert>
          )}

          <div className="mb-6 flex flex-col gap-3 sm:flex-row">
            <div className="flex flex-1 gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Enter meeting ID to join"
                  onFocus={() => setJoinDialogOpen(true)}
                  readOnly
                  className="cursor-pointer"
                />
              </div>
            </div>

            {user?.isAdmin ? (
              <div className="flex gap-2">
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex-1 sm:flex-none">
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
                <Button variant="outline" onClick={() => setScheduleDialogOpen(true)} className="flex-1 sm:flex-none">
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule
                </Button>
              </div>
            ) : (
              <Button disabled className="cursor-not-allowed opacity-50">
                <Shield className="mr-2 h-4 w-4" />
                Admin Only
              </Button>
            )}
          </div>

          {meetings.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Users className="mx-auto mb-2 h-12 w-12 opacity-50" />
              <p>No active meetings</p>
              <p className="text-sm">
                {user?.isAdmin ? "Create a new meeting to get started" : "Wait for an admin to create a meeting"}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {meetings.map((meeting) => (
                  <button
                    key={meeting.id}
                    onClick={() => joinMeeting(meeting.id)}
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
                          {meeting.createdAt && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(
                                meeting.createdAt instanceof Timestamp ? meeting.createdAt.toDate() : meeting.createdAt,
                                { addSuffix: true },
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                        Active
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <ScheduleMeetingDialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen} />
      <JoinMeetingDialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen} onJoinSuccess={onJoinMeeting} />
    </>
  )
}
