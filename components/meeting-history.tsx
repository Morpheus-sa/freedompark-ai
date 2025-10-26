"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Meeting } from "./meeting-recorder"

export function MeetingHistory({ refreshTrigger }: { refreshTrigger?: number }) {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    const loadMeetings = () => {
      const stored = localStorage.getItem("meetings")
      if (stored) {
        setMeetings(JSON.parse(stored))
      }
    }
    loadMeetings()
  }, [refreshTrigger])

  const deleteMeeting = (id: string) => {
    const updated = meetings.filter((m) => m.id !== id)
    setMeetings(updated)
    localStorage.setItem("meetings", JSON.stringify(updated))
    if (expandedId === id) {
      setExpandedId(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-card-foreground">Recent Meetings</CardTitle>
        <CardDescription>Your meeting history</CardDescription>
      </CardHeader>
      <CardContent>
        {meetings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 rounded-full bg-muted p-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="mb-2 font-medium text-card-foreground">No meetings yet</p>
            <p className="text-sm text-muted-foreground">Start recording to create your first meeting notes</p>
          </div>
        ) : (
          <div className="space-y-4">
            {meetings.map((meeting) => (
              <div key={meeting.id} className="rounded-lg border border-border bg-muted/50 p-4">
                <div className="mb-2 flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-card-foreground">{formatDate(meeting.date)}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{meeting.summary.overview}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMeeting(meeting.id)}
                    className="ml-2 h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedId(expandedId === meeting.id ? null : meeting.id)}
                  className="mt-2 h-auto p-0 text-xs text-primary hover:bg-transparent hover:underline"
                >
                  {expandedId === meeting.id ? "Show less" : "Show more"}
                </Button>

                {expandedId === meeting.id && (
                  <div className="mt-4 space-y-4 border-t border-border pt-4">
                    {meeting.summary.keyPoints.length > 0 && (
                      <div>
                        <h4 className="mb-2 text-sm font-semibold text-card-foreground">Key Points</h4>
                        <ul className="space-y-1">
                          {meeting.summary.keyPoints.map((point, i) => (
                            <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                              <span className="text-primary">•</span>
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {meeting.summary.actionItems.length > 0 && (
                      <div>
                        <h4 className="mb-2 text-sm font-semibold text-card-foreground">Action Items</h4>
                        <ul className="space-y-1">
                          {meeting.summary.actionItems.map((item, i) => (
                            <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                              <span className="text-accent">→</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {meeting.summary.decisions.length > 0 && (
                      <div>
                        <h4 className="mb-2 text-sm font-semibold text-card-foreground">Decisions</h4>
                        <ul className="space-y-1">
                          {meeting.summary.decisions.map((decision, i) => (
                            <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                              <span className="text-accent">✓</span>
                              <span>{decision}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div>
                      <h4 className="mb-2 text-sm font-semibold text-card-foreground">Full Transcript</h4>
                      <div className="max-h-48 overflow-y-auto rounded bg-background p-3">
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                          {meeting.transcript}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
