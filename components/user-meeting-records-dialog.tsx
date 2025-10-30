"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Users, FileText, Send, Download, CheckCircle2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import type { Meeting, User } from "@/types/meeting"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown } from "lucide-react"

interface UserMeetingRecordsDialogProps {
  user: User
  meetings: Meeting[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserMeetingRecordsDialog({ user, meetings, open, onOpenChange }: UserMeetingRecordsDialogProps) {
  const [sendingMeetingId, setSendingMeetingId] = useState<string | null>(null)
  const [sentMeetings, setSentMeetings] = useState<Set<string>>(new Set())

  const handleSendRecord = async (meeting: Meeting) => {
    setSendingMeetingId(meeting.id)
    console.log("[v0] Admin: Sending meeting record to user:", { meetingId: meeting.id, userEmail: user.email })

    // Simulate sending email (in production, this would call an API endpoint)
    await new Promise((resolve) => setTimeout(resolve, 1500))

    setSentMeetings((prev) => new Set(prev).add(meeting.id))
    setSendingMeetingId(null)
    console.log("[v0] Admin: Meeting record sent successfully")
  }

  const handleDownloadRecord = (meeting: Meeting) => {
    console.log("[v0] Admin: Downloading meeting record:", meeting.id)

    // Create a text representation of the meeting
    const recordText = `
Meeting: ${meeting.title}
Date: ${new Date(meeting.createdAt).toLocaleString()}
Participants: ${meeting.participants.length}

${
  meeting.summary
    ? `
Summary:
${meeting.summary.overview}

Key Points:
${meeting.summary.keyPoints.map((point, i) => `${i + 1}. ${point}`).join("\n")}

Action Items:
${meeting.summary.actionItems.map((item, i) => `${i + 1}. ${item}`).join("\n")}

Decisions:
${meeting.summary.decisions.map((decision, i) => `${i + 1}. ${decision}`).join("\n")}

Speaker Contributions:
${meeting.summary.speakerContributions.map((sc) => `${sc.speaker}: ${sc.contribution}`).join("\n\n")}
`
    : ""
}

Transcript:
${meeting.transcript.map((segment) => `[${new Date(segment.timestamp).toLocaleTimeString()}] ${segment.speakerName}: ${segment.text}`).join("\n")}
    `.trim()

    // Create and download the file
    const blob = new Blob([recordText], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `meeting-${meeting.id}-${new Date(meeting.createdAt).toISOString().split("T")[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Meeting Records for {user.displayName}</DialogTitle>
          <DialogDescription>View and send past meeting records to {user.email}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[600px]">
          <div className="space-y-4 pr-4">
            {meetings.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-sm text-muted-foreground">No meeting records found for this user.</p>
                </CardContent>
              </Card>
            ) : (
              meetings.map((meeting) => (
                <Card key={meeting.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base">{meeting.title}</CardTitle>
                          {meeting.isActive ? (
                            <Badge variant="default">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Ended</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDistanceToNow(meeting.createdAt, { addSuffix: true })}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {meeting.participants.length} participants
                          </div>
                          {meeting.transcript && (
                            <div className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {meeting.transcript.length} segments
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Summary Preview */}
                    {meeting.summary && (
                      <Collapsible>
                        <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border p-3 text-left hover:bg-accent">
                          <span className="text-sm font-medium">View Summary</span>
                          <ChevronDown className="h-4 w-4" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2 space-y-3 rounded-lg border p-4">
                          <div>
                            <h4 className="mb-1 text-sm font-medium">Overview</h4>
                            <p className="text-sm leading-relaxed text-muted-foreground">{meeting.summary.overview}</p>
                          </div>

                          {meeting.summary.keyPoints.length > 0 && (
                            <div>
                              <h4 className="mb-2 text-sm font-medium">Key Points</h4>
                              <ul className="space-y-1">
                                {meeting.summary.keyPoints.map((point, i) => (
                                  <li key={i} className="text-sm leading-relaxed text-muted-foreground">
                                    • {point}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {meeting.summary.actionItems.length > 0 && (
                            <div>
                              <h4 className="mb-2 text-sm font-medium">Action Items</h4>
                              <ul className="space-y-1">
                                {meeting.summary.actionItems.map((item, i) => (
                                  <li key={i} className="text-sm leading-relaxed text-muted-foreground">
                                    • {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </CollapsibleContent>
                      </Collapsible>
                    )}

                    <Separator />

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 bg-transparent"
                        onClick={() => handleDownloadRecord(meeting)}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>

                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleSendRecord(meeting)}
                        disabled={sendingMeetingId === meeting.id || sentMeetings.has(meeting.id)}
                      >
                        {sendingMeetingId === meeting.id ? (
                          <>
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
                            Sending...
                          </>
                        ) : sentMeetings.has(meeting.id) ? (
                          <>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Sent
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Send to {user.email}
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
