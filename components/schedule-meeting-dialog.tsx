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
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, Clock } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"

interface ScheduleMeetingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const generateTimeSlots = () => {
  const slots: string[] = []
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
      slots.push(timeString)
    }
  }
  return slots
}

export function ScheduleMeetingDialog({ open, onOpenChange }: ScheduleMeetingDialogProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined)
  const [scheduledTime, setScheduledTime] = useState("")
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  const timeSlots = generateTimeSlots()

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
      const [hours, minutes] = scheduledTime.split(":").map(Number)
      const scheduledDateTime = new Date(scheduledDate)
      scheduledDateTime.setHours(hours, minutes, 0, 0)
      const scheduledTimestamp = Timestamp.fromDate(scheduledDateTime)

      const docRef = await addDoc(collection(db, "meetings"), {
        title: title.trim(),
        description: description.trim(),
        createdAt: Timestamp.now(),
        createdBy: user.uid,
        participants: [user.uid],
        transcript: [],
        isActive: false,
        isScheduled: true,
        scheduledFor: scheduledTimestamp,
      })

      console.log("[v0] Meeting scheduled successfully with ID:", docRef.id)

      toast({
        title: "✓ Meeting Scheduled Successfully",
        description: (
          <div className="mt-2 space-y-1">
            <p className="font-semibold">{title}</p>
            <p className="text-sm">📅 {format(scheduledDateTime, "EEEE, MMMM d, yyyy")}</p>
            <p className="text-sm">🕐 {scheduledTime} (24-hour format)</p>
            {description && <p className="mt-2 text-xs text-muted-foreground">{description}</p>}
          </div>
        ),
        duration: 8000, // Show for 8 seconds
      })

      setTitle("")
      setDescription("")
      setScheduledDate(undefined)
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
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
                <Label className="flex items-center gap-2 text-sm">
                  <CalendarIcon className="h-4 w-4 text-primary" />
                  Date
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-background",
                        !scheduledDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {scheduledDate ? format(scheduledDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={scheduledDate}
                      onSelect={setScheduledDate}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-primary" />
                  Time (24-hour format)
                </Label>
                <Select value={scheduledTime} onValueChange={setScheduledTime}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {scheduledDate && scheduledTime && (
              <div className="mt-2 rounded-md bg-primary/10 p-2 text-center text-sm text-primary">
                Scheduled for: {format(scheduledDate, "PPP")} at {scheduledTime}
              </div>
            )}
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
