"use client"

import { useState, useEffect } from "react"
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, deleteDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Calendar, Users, Clock, Search, Trash2, Play, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Meeting } from "@/types/meeting"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ScheduledMeetingsListProps {
  onStartMeeting: (meetingId: string) => void
}

export function ScheduledMeetingsList({ onStartMeeting }: ScheduledMeetingsListProps) {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [currentTime, setCurrentTime] = useState(Date.now())
  const { user } = useAuth()
  const { toast } = useToast()

  // Update current time every minute for countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now())
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!user) return

    console.log("[v0] Setting up scheduled meetings listener for user:", user.uid)

    const q = query(
      collection(db, "meetings"),
      where("isScheduled", "==", true),
      where("isActive", "==", false),
      orderBy("scheduledFor", "asc"),
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log("[v0] Received scheduled meetings snapshot, docs count:", snapshot.docs.length)
        const meetingsData = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter((meeting: any) => meeting.participants?.includes(user.uid)) as Meeting[]

        console.log("[v0] Filtered scheduled meetings for user:", meetingsData.length)
        setMeetings(meetingsData)
      },
      (error) => {
        console.error("[v0] Error listening to scheduled meetings:", error)
        toast({
          title: "Error",
          description: "Failed to load scheduled meetings",
          variant: "destructive",
        })
      },
    )

    return unsubscribe
  }, [user, toast])

  const filteredMeetings = meetings.filter((meeting) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return meeting.title.toLowerCase().includes(query) || meeting.description?.toLowerCase().includes(query)
  })

  const startMeeting = async (meetingId: string) => {
    try {
      await updateDoc(doc(db, "meetings", meetingId), {
        isActive: true,
        isScheduled: false,
      })

      toast({
        title: "Meeting started",
        description: "The scheduled meeting is now active",
      })

      onStartMeeting(meetingId)
    } catch (error: any) {
      console.error("[v0] Error starting meeting:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to start meeting",
        variant: "destructive",
      })
    }
  }

  const cancelMeeting = async (meetingId: string, meetingTitle: string) => {
    if (!user?.isAdmin) {
      toast({
        title: "Permission denied",
        description: "Only admins can cancel scheduled meetings",
        variant: "destructive",
      })
      return
    }

    try {
      await deleteDoc(doc(db, "meetings", meetingId))
      toast({
        title: "Meeting cancelled",
        description: `"${meetingTitle}" has been removed`,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel meeting",
        variant: "destructive",
      })
    }
  }

  const formatScheduledTime = (timestamp: any) => {
    if (!timestamp) return "Unknown time"

    try {
      let dateValue: number

      // Handle Firestore Timestamp
      if (timestamp && typeof timestamp === "object" && "seconds" in timestamp) {
        dateValue = timestamp.seconds * 1000
      } else if (timestamp && typeof timestamp.toMillis === "function") {
        dateValue = timestamp.toMillis()
      } else if (typeof timestamp === "number") {
        dateValue = timestamp
      } else {
        return "Unknown time"
      }

      const date = new Date(dateValue)
      if (isNaN(date.getTime())) {
        return "Invalid time"
      }

      return date.toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (error) {
      console.error("[v0] Error formatting scheduled time:", error)
      return "Unknown time"
    }
  }

  const getTimeUntilMeeting = (scheduledFor: any) => {
    if (!scheduledFor) return null

    try {
      let dateValue: number

      if (scheduledFor && typeof scheduledFor === "object" && "seconds" in scheduledFor) {
        dateValue = scheduledFor.seconds * 1000
      } else if (scheduledFor && typeof scheduledFor.toMillis === "function") {
        dateValue = scheduledFor.toMillis()
      } else if (typeof scheduledFor === "number") {
        dateValue = scheduledFor
      } else {
        return null
      }

      const diff = dateValue - currentTime
      const isPast = diff < 0

      if (isPast) {
        return { text: "Ready to start", isPast: true, canStart: true }
      }

      const minutes = Math.floor(diff / 60000)
      const hours = Math.floor(minutes / 60)
      const days = Math.floor(hours / 24)

      if (days > 0) {
        return { text: `in ${days} day${days !== 1 ? "s" : ""}`, isPast: false, canStart: false }
      } else if (hours > 0) {
        return { text: `in ${hours} hour${hours !== 1 ? "s" : ""}`, isPast: false, canStart: false }
      } else if (minutes > 0) {
        return { text: `in ${minutes} minute${minutes !== 1 ? "s" : ""}`, isPast: false, canStart: minutes <= 15 }
      } else {
        return { text: "Starting soon", isPast: false, canStart: true }
      }
    } catch (error) {
      return null
    }
  }

  // Separate meetings into upcoming and ready to start
  const upcomingMeetings = filteredMeetings.filter((m) => {
    const timeInfo = getTimeUntilMeeting(m.scheduledFor)
    return timeInfo && !timeInfo.isPast
  })

  const readyMeetings = filteredMeetings.filter((m) => {
    const timeInfo = getTimeUntilMeeting(m.scheduledFor)
    return timeInfo && timeInfo.isPast
  })

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Scheduled Meetings
            </CardTitle>
            <CardDescription>View and manage your upcoming meetings</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search scheduled meetings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {filteredMeetings.length === 0 ? (
          <div className="py-12 text-center">
            <Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-50" />
            <p className="mb-2 font-medium text-foreground">
              {searchQuery ? "No meetings found" : "No scheduled meetings"}
            </p>
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? "Try a different search term"
                : user?.isAdmin
                  ? "Schedule a meeting to get started"
                  : "Scheduled meetings will appear here"}
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[600px]">
            <div className="space-y-4 pr-4">
              {/* Ready to start meetings */}
              {readyMeetings.length > 0 && (
                <div className="space-y-3">
                  <Alert className="border-primary/50 bg-primary/10">
                    <AlertCircle className="h-4 w-4 text-primary" />
                    <AlertDescription className="text-primary">
                      {readyMeetings.length} meeting{readyMeetings.length !== 1 ? "s" : ""} ready to start
                    </AlertDescription>
                  </Alert>

                  {readyMeetings.map((meeting) => {
                    const timeInfo = getTimeUntilMeeting(meeting.scheduledFor)

                    return (
                      <div
                        key={meeting.id}
                        className="rounded-lg border-2 border-primary/50 bg-primary/5 p-4 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="font-semibold text-foreground">{meeting.title}</h3>
                                {meeting.description && (
                                  <p className="mt-1 text-sm text-muted-foreground">{meeting.description}</p>
                                )}
                                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatScheduledTime(meeting.scheduledFor)}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    {meeting.participants.length} participant
                                    {meeting.participants.length !== 1 ? "s" : ""}
                                  </span>
                                  {timeInfo && (
                                    <Badge variant="default" className="gap-1">
                                      <Play className="h-3 w-3" />
                                      {timeInfo.text}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <Button onClick={() => startMeeting(meeting.id)} size="sm" className="flex-1">
                                <Play className="mr-2 h-4 w-4" />
                                Start Meeting
                              </Button>
                              {user?.isAdmin && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => cancelMeeting(meeting.id, meeting.title)}
                                  className="text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Upcoming meetings */}
              {upcomingMeetings.length > 0 && (
                <div className="space-y-3">
                  {readyMeetings.length > 0 && (
                    <h3 className="text-sm font-semibold text-muted-foreground">Upcoming</h3>
                  )}

                  {upcomingMeetings.map((meeting) => {
                    const timeInfo = getTimeUntilMeeting(meeting.scheduledFor)

                    return (
                      <div
                        key={meeting.id}
                        className="rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/5"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="font-semibold text-foreground">{meeting.title}</h3>
                                {meeting.description && (
                                  <p className="mt-1 text-sm text-muted-foreground">{meeting.description}</p>
                                )}
                                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatScheduledTime(meeting.scheduledFor)}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    {meeting.participants.length} participant
                                    {meeting.participants.length !== 1 ? "s" : ""}
                                  </span>
                                  {timeInfo && (
                                    <Badge variant="secondary" className="gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {timeInfo.text}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                {timeInfo?.canStart && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => startMeeting(meeting.id)}
                                    className="h-8 px-2 text-primary hover:text-primary"
                                    title="Start early"
                                  >
                                    <Play className="h-4 w-4" />
                                  </Button>
                                )}
                                {user?.isAdmin && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => cancelMeeting(meeting.id, meeting.title)}
                                    className="h-8 px-2 text-muted-foreground hover:text-destructive"
                                    title="Cancel meeting"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
