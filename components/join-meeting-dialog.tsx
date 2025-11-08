"use client"

import { useState } from "react"
import { doc, getDoc, updateDoc, arrayUnion, collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { formatMeetingCode, isValidMeetingCode } from "@/lib/meeting-code-generator"

interface JoinMeetingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onJoinSuccess: (meetingId: string) => void
}

export function JoinMeetingDialog({ open, onOpenChange, onJoinSuccess }: JoinMeetingDialogProps) {
  const [meetingCode, setMeetingCode] = useState("")
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  const joinMeeting = async () => {
    if (!user || !meetingCode.trim()) return

    setLoading(true)
    const codeOrId = meetingCode.trim()
    console.log("[v0] Attempting to join with code/ID:", codeOrId)

    try {
      let meetingId: string | null = null
      let meetingRef

      // Check if input is a valid meeting code format (XXXX-XXXX)
      if (isValidMeetingCode(codeOrId)) {
        console.log("[v0] Input is a valid meeting code, searching...")
        const formattedCode = formatMeetingCode(codeOrId)

        // Query Firestore for meeting with this code
        const meetingsQuery = query(collection(db, "meetings"), where("shareCode", "==", formattedCode))
        const querySnapshot = await getDocs(meetingsQuery)

        if (!querySnapshot.empty) {
          meetingId = querySnapshot.docs[0].id
          console.log("[v0] Found meeting by code:", meetingId)
        }
      } else {
        // Assume it's a meeting ID
        meetingId = codeOrId
        console.log("[v0] Input treated as meeting ID")
      }

      if (!meetingId) {
        throw new Error("Meeting not found with this code")
      }

      meetingRef = doc(db, "meetings", meetingId)
      const meetingSnap = await getDoc(meetingRef)

      if (!meetingSnap.exists()) {
        throw new Error("Meeting not found")
      }

      const meetingData = meetingSnap.data()

      if (!meetingData.isActive) {
        throw new Error("This meeting has ended")
      }

      if (meetingData.participants?.includes(user.uid)) {
        console.log("[v0] User already in meeting, joining directly")
        onOpenChange(false)
        setMeetingCode("")
        onJoinSuccess(meetingId)
        return
      }

      console.log("[v0] Adding user to participants")
      await updateDoc(meetingRef, {
        participants: arrayUnion(user.uid),
      })

      toast({
        title: "Joined meeting",
        description: "You can now participate in the meeting",
      })

      onOpenChange(false)
      setMeetingCode("")
      onJoinSuccess(meetingId)
    } catch (error: any) {
      console.error("[v0] Error joining meeting:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to join meeting. Check your code and try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCodeChange = (value: string) => {
    const cleaned = value.replace(/[^A-Z0-9-]/gi, "").toUpperCase()
    if (cleaned.length <= 9) {
      setMeetingCode(cleaned)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join Meeting</DialogTitle>
          <DialogDescription>Enter the meeting code or ID to join an existing meeting</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="meetingCode">Meeting Code / ID</Label>
            <Input
              id="meetingCode"
              value={meetingCode}
              onChange={(e) => handleCodeChange(e.target.value)}
              placeholder="e.g., ABCD-1234"
              onKeyDown={(e) => e.key === "Enter" && joinMeeting()}
              className="font-mono text-center text-lg tracking-wider"
            />
            <p className="text-xs text-muted-foreground">Enter either a meeting code (ABCD-1234) or full meeting ID</p>
          </div>
          <Button onClick={joinMeeting} disabled={loading || !meetingCode.trim()} className="w-full">
            {loading ? "Joining..." : "Join Meeting"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
