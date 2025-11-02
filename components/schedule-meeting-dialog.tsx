"use client"

import { useState } from "react"
import { addDoc, collection, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Calendar, Clock } from "lucide-react"

interface ScheduleMeetingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ScheduleMeetingDialog({ open, onOpenChange }: ScheduleMeetingDialogProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [scheduledDate, setScheduledDate] = useState("")
  const [scheduledTime, setScheduledTime] = useState("")
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  const scheduleMeeting = async () => {
    if (!user || !title.trim() || !scheduledDate || !scheduledTime) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    if (!user.isAdmin) {
      toast({
        title: "Permission Denied",
        description: "Only administrators can schedule meetings.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    console.log("[v0] Scheduling meeting:", { title, scheduledDate, scheduledTime })

    try {
      // Combine date and time into a timestamp
      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`)
      const scheduledTimestamp = Timestamp.fromDate(scheduledDateTime)

      const docRef = await addDoc(collection(db, "meetings"), {
        title: title.trim(),
        description: description.trim(),
        createdAt: Timestamp.now(),
        createdBy: user.uid,
        participants: [user.uid],
        transcript: [],
        isActive: false, // Scheduled meetings start as inactive
        isScheduled: true,
        scheduledFor: scheduledTimestamp,
      })

      console.log("[v0] Meeting scheduled successfully with ID:", docRef.id)

      toast({
        title: "Meeting scheduled",
        description: `Meeting scheduled for ${scheduledDateTime.toLocaleString()}`,
      })

      // Reset form
      setTitle("")
      setDescription("")
      setScheduledDate("")
      setScheduledTime("")
      onOpenChange(false)
    } catch (error: any) {
      console.error("[v0] Error scheduling meeting:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to schedule meeting",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Get minimum date (today)
  const today = new Date().toISOString().split("T")[0]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Schedule Meeting</DialogTitle>
          <DialogDescription>Schedule a meeting for a future date and time</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Meeting Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Team Standup, Client Call"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description (Optional)
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add meeting agenda or notes..."
              rows={3}
            />
          </div>

          <div className="space-y-3 rounded-lg border border-border bg-muted/50 p-4">
            <p className="text-sm font-medium text-foreground">
              Schedule Date & Time <span className="text-destructive">*</span>
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="date" className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-primary" />
                  Date
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={today}
                  required
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="time" className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-primary" />
                  Time
                </Label>
                <Input
                  id="time"
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  required
                  className="bg-background"
                />
              </div>
            </div>
          </div>

          <Button
            onClick={scheduleMeeting}
            disabled={loading || !title.trim() || !scheduledDate || !scheduledTime}
            className="w-full"
          >
            {loading ? "Scheduling..." : "Schedule Meeting"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
