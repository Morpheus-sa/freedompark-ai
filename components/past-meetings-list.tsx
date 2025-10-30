"use client"

import { useState, useEffect } from "react"
import { collection, query, where, onSnapshot, orderBy, doc, deleteDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { History, Users, Clock, Search, Trash2, ChevronDown, ChevronUp, Sparkles, Share2, Edit } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Meeting } from "@/types/meeting"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function PastMeetingsList() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null)
  const [editedSummary, setEditedSummary] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [sortBy, setSortBy] = useState<"date" | "title">("date")
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (!user) return

    console.log("[v0] Setting up past meetings listener for user:", user.uid)

    const q = query(collection(db, "meetings"), where("isActive", "==", false), orderBy("createdAt", "desc"))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log("[v0] Received past meetings snapshot, docs count:", snapshot.docs.length)
        const meetingsData = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter((meeting: any) => meeting.participants?.includes(user.uid)) as Meeting[]

        console.log("[v0] Filtered past meetings for user:", meetingsData.length)
        setMeetings(meetingsData)
      },
      (error) => {
        console.error("[v0] Error listening to past meetings:", error)
        toast({
          title: "Error",
          description: "Failed to load past meetings",
          variant: "destructive",
        })
      },
    )

    return unsubscribe
  }, [user, toast])

  const filteredMeetings = meetings
    .filter((meeting) => {
      if (!searchQuery) return true
      const query = searchQuery.toLowerCase()
      return (
        meeting.title.toLowerCase().includes(query) ||
        meeting.summary?.overview.toLowerCase().includes(query) ||
        meeting.transcript.some((segment) => segment.text.toLowerCase().includes(query))
      )
    })
    .sort((a, b) => {
      if (sortBy === "date") {
        return b.createdAt - a.createdAt
      } else {
        return a.title.localeCompare(b.title)
      }
    })

  const deleteMeeting = async (meetingId: string) => {
    try {
      await deleteDoc(doc(db, "meetings", meetingId))
      toast({
        title: "Meeting deleted",
        description: "The meeting has been removed",
      })
      if (expandedId === meetingId) {
        setExpandedId(null)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete meeting",
        variant: "destructive",
      })
    }
  }

  const shareMeeting = async (meeting: Meeting) => {
    try {
      const shareText = `Meeting: ${meeting.title}\nDate: ${formatDate(meeting.createdAt)}\n\n${
        meeting.summary?.overview || "No summary available"
      }`

      if (navigator.share) {
        await navigator.share({
          title: meeting.title,
          text: shareText,
        })
        toast({
          title: "Shared successfully",
          description: "Meeting details have been shared",
        })
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareText)
        toast({
          title: "Copied to clipboard",
          description: "Meeting details have been copied",
        })
      }
    } catch (error: any) {
      if (error.name !== "AbortError") {
        toast({
          title: "Error",
          description: "Failed to share meeting",
          variant: "destructive",
        })
      }
    }
  }

  const openEditDialog = (meeting: Meeting) => {
    if (!user?.isAdmin) {
      toast({
        title: "Permission denied",
        description: "Only admins can edit meeting summaries",
        variant: "destructive",
      })
      return
    }
    setEditingMeeting(meeting)
    setEditedSummary(meeting.summary?.overview || "")
  }

  const saveEditedSummary = async () => {
    if (!editingMeeting) return

    setIsSaving(true)
    try {
      await updateDoc(doc(db, "meetings", editingMeeting.id), {
        "summary.overview": editedSummary,
      })
      toast({
        title: "Summary updated",
        description: "Meeting summary has been saved",
      })
      setEditingMeeting(null)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update summary",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const formatDate = (timestamp: any) => {
    console.log("[v0] formatDate input:", timestamp, "type:", typeof timestamp)

    if (!timestamp) {
      return "Unknown date"
    }

    try {
      let dateValue: number

      // Check if it's a Firestore Timestamp object
      if (timestamp && typeof timestamp === "object" && "seconds" in timestamp) {
        dateValue = timestamp.seconds * 1000
        console.log("[v0] Converted Firestore Timestamp to ms:", dateValue)
      }
      // Check if it has toMillis method (Firestore Timestamp)
      else if (timestamp && typeof timestamp.toMillis === "function") {
        dateValue = timestamp.toMillis()
        console.log("[v0] Used toMillis():", dateValue)
      }
      // Check if it's already a number
      else if (typeof timestamp === "number") {
        dateValue = timestamp
        console.log("[v0] Already a number:", dateValue)
      } else {
        console.error("[v0] Unknown timestamp format:", timestamp)
        return "Unknown date"
      }

      if (isNaN(dateValue)) {
        console.error("[v0] Invalid date value:", dateValue)
        return "Invalid date"
      }

      const date = new Date(dateValue)
      if (isNaN(date.getTime())) {
        console.error("[v0] Invalid Date object:", date)
        return "Invalid date"
      }

      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (error) {
      console.error("[v0] Error formatting date:", error)
      return "Unknown date"
    }
  }

  const uniqueSpeakers = (meeting: Meeting) => {
    return Array.from(new Set(meeting.transcript.map((s) => s.speakerName)))
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Past Meetings
            </CardTitle>
            <CardDescription>Review and search your meeting history</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setSortBy(sortBy === "date" ? "title" : "date")}>
              Sort by: {sortBy === "date" ? "Date" : "Title"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search meetings by title, content, or topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {filteredMeetings.length === 0 ? (
          <div className="py-12 text-center">
            <History className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-50" />
            <p className="mb-2 font-medium text-foreground">{searchQuery ? "No meetings found" : "No past meetings"}</p>
            <p className="text-sm text-muted-foreground">
              {searchQuery ? "Try a different search term" : "Completed meetings will appear here"}
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[600px]">
            <div className="space-y-3 pr-4">
              {filteredMeetings.map((meeting) => (
                <div
                  key={meeting.id}
                  className="rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">{meeting.title}</h3>
                          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDate(meeting.createdAt)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {meeting.participants.length} participant{meeting.participants.length !== 1 ? "s" : ""}
                            </span>
                            {uniqueSpeakers(meeting).length > 0 && (
                              <span className="text-xs">
                                {uniqueSpeakers(meeting).length} speaker
                                {uniqueSpeakers(meeting).length !== 1 ? "s" : ""}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => shareMeeting(meeting)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                            title="Share meeting"
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                          {meeting.summary && user?.isAdmin && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(meeting)}
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                              title="Edit summary (Admin only)"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteMeeting(meeting.id)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                            title="Delete meeting"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {meeting.summary && (
                        <p className="line-clamp-2 text-sm text-muted-foreground">{meeting.summary.overview}</p>
                      )}

                      {uniqueSpeakers(meeting).length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {uniqueSpeakers(meeting)
                            .slice(0, 3)
                            .map((speaker) => (
                              <Badge key={speaker} variant="secondary" className="text-xs">
                                {speaker}
                              </Badge>
                            ))}
                          {uniqueSpeakers(meeting).length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{uniqueSpeakers(meeting).length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedId(expandedId === meeting.id ? null : meeting.id)}
                        className="h-auto p-0 text-xs text-primary hover:bg-transparent hover:underline"
                      >
                        {expandedId === meeting.id ? (
                          <>
                            <ChevronUp className="mr-1 h-3 w-3" />
                            Show less
                          </>
                        ) : (
                          <>
                            <ChevronDown className="mr-1 h-3 w-3" />
                            Show details
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {expandedId === meeting.id && meeting.summary && (
                    <div className="mt-4 space-y-4 border-t border-border pt-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Sparkles className="h-4 w-4 text-primary" />
                        AI Summary
                      </div>

                      <div>
                        <h4 className="mb-2 text-sm font-semibold text-foreground">Overview</h4>
                        <p className="text-sm leading-relaxed text-muted-foreground">{meeting.summary.overview}</p>
                      </div>

                      {meeting.summary.keyPoints.length > 0 && (
                        <>
                          <Separator />
                          <div>
                            <h4 className="mb-2 text-sm font-semibold text-foreground">Key Points</h4>
                            <ul className="space-y-1">
                              {meeting.summary.keyPoints.map((point, i) => (
                                <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                                  <span className="text-primary">•</span>
                                  <span className="leading-relaxed">{point}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </>
                      )}

                      {meeting.summary.actionItems.length > 0 && (
                        <>
                          <Separator />
                          <div>
                            <h4 className="mb-2 text-sm font-semibold text-foreground">Action Items</h4>
                            <ul className="space-y-1">
                              {meeting.summary.actionItems.map((item, i) => (
                                <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                                  <span className="text-accent">→</span>
                                  <span className="leading-relaxed">{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </>
                      )}

                      {meeting.summary.decisions.length > 0 && (
                        <>
                          <Separator />
                          <div>
                            <h4 className="mb-2 text-sm font-semibold text-foreground">Decisions</h4>
                            <ul className="space-y-1">
                              {meeting.summary.decisions.map((decision, i) => (
                                <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                                  <span className="text-accent">✓</span>
                                  <span className="leading-relaxed">{decision}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </>
                      )}

                      {meeting.summary.speakerContributions.length > 0 && (
                        <>
                          <Separator />
                          <div>
                            <h4 className="mb-2 text-sm font-semibold text-foreground">Speaker Contributions</h4>
                            <div className="space-y-3">
                              {meeting.summary.speakerContributions.map((item, index) => (
                                <div key={index} className="rounded-lg bg-muted/50 p-3 space-y-1">
                                  <Badge variant="outline" className="text-xs">
                                    {item.speaker}
                                  </Badge>
                                  <p className="text-sm leading-relaxed text-muted-foreground">{item.contribution}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                      <Separator />

                      <div>
                        <h4 className="mb-2 text-sm font-semibold text-foreground">Full Transcript</h4>
                        <ScrollArea className="h-48 rounded-lg border border-border bg-muted/30 p-3">
                          <div className="space-y-3">
                            {meeting.transcript.map((segment) => (
                              <div key={segment.id} className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="text-xs">
                                    {segment.speakerName}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(segment.timestamp).toLocaleTimeString()}
                                  </span>
                                </div>
                                <p className="text-sm leading-relaxed text-foreground pl-4">{segment.text}</p>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        <Dialog open={!!editingMeeting} onOpenChange={(open) => !open && setEditingMeeting(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Meeting Summary</DialogTitle>
              <DialogDescription>Update the AI-generated summary for this meeting</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Summary Overview</label>
                <Textarea
                  value={editedSummary}
                  onChange={(e) => setEditedSummary(e.target.value)}
                  placeholder="Enter meeting summary..."
                  className="mt-2 min-h-[200px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingMeeting(null)} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={saveEditedSummary} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
