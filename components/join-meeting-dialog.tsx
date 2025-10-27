"use client"

import { useState } from "react"
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

interface JoinMeetingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onJoinSuccess: (meetingId: string) => void
}

export function JoinMeetingDialog({ open, onOpenChange, onJoinSuccess }: JoinMeetingDialogProps) {
  const [meetingId, setMeetingId] = useState("")
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  const joinMeeting = async () => {
    if (!user || !meetingId.trim()) return

    setLoading(true)
    try {
      const meetingRef = doc(db, "meetings", meetingId)
      const meetingSnap = await getDoc(meetingRef)

      if (!meetingSnap.exists()) {
        throw new Error("Meeting not found")
      }

      const meetingData = meetingSnap.data()
      if (!meetingData.isActive) {
        throw new Error("This meeting has ended")
      }

      await updateDoc(meetingRef, {
        participants: arrayUnion(user.uid),
      })

      toast({
        title: "Joined meeting",
        description: "You can now participate in the meeting",
      })

      onOpenChange(false)
      setMeetingId("")
      onJoinSuccess(meetingId)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to join meeting",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join Meeting</DialogTitle>
          <DialogDescription>Enter the meeting ID to join an existing meeting</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="meetingId">Meeting ID</Label>
            <Input
              id="meetingId"
              value={meetingId}
              onChange={(e) => setMeetingId(e.target.value)}
              placeholder="Enter meeting ID"
              onKeyDown={(e) => e.key === "Enter" && joinMeeting()}
            />
          </div>
          <Button onClick={joinMeeting} disabled={loading || !meetingId.trim()} className="w-full">
            {loading ? "Joining..." : "Join Meeting"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
