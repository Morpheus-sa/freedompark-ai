"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Mic, Square, Loader2, Plus, User, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"

export type TranscriptSegment = {
  speaker: string
  text: string
  timestamp: number
}

export type Meeting = {
  id: string
  date: string
  transcript: string
  segments: TranscriptSegment[]
  speakers: string[]
  summary: {
    overview: string
    keyPoints: string[]
    actionItems: string[]
    decisions: string[]
    speakerInsights?: { speaker: string; contribution: string }[]
  }
}

export function MeetingRecorder({ onMeetingSaved }: { onMeetingSaved?: () => void }) {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [speakers, setSpeakers] = useState<string[]>([])
  const [activeSpeaker, setActiveSpeaker] = useState<string>("")
  const [newSpeakerName, setNewSpeakerName] = useState("")
  const [segments, setSegments] = useState<TranscriptSegment[]>([])
  const [summary, setSummary] = useState<{
    overview: string
    keyPoints: string[]
    actionItems: string[]
    decisions: string[]
    speakerInsights?: { speaker: string; contribution: string }[]
  } | null>(null)
  const [isSupported, setIsSupported] = useState(true)

  const recognitionRef = useRef<any>(null)
  const shouldProcessRef = useRef(false)
  const transcriptRef = useRef("")
  const segmentsRef = useRef<TranscriptSegment[]>([])
  const currentSegmentStartRef = useRef<number>(0)
  const { toast } = useToast()

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (!SpeechRecognition) {
        setIsSupported(false)
      }
    }
  }, [])

  const addSpeaker = () => {
    if (newSpeakerName.trim() && !speakers.includes(newSpeakerName.trim())) {
      const speaker = newSpeakerName.trim()
      setSpeakers([...speakers, speaker])
      if (!activeSpeaker) {
        setActiveSpeaker(speaker)
      }
      setNewSpeakerName("")
      toast({
        title: "Speaker added",
        description: `${speaker} has been added to the meeting`,
      })
    }
  }

  const removeSpeaker = (speaker: string) => {
    setSpeakers(speakers.filter((s) => s !== speaker))
    if (activeSpeaker === speaker) {
      setActiveSpeaker(speakers.filter((s) => s !== speaker)[0] || "")
    }
  }

  const switchSpeaker = (speaker: string) => {
    if (isRecording && activeSpeaker && transcriptRef.current.length > currentSegmentStartRef.current) {
      // Save current segment
      const segmentText = transcriptRef.current.substring(currentSegmentStartRef.current).trim()
      if (segmentText) {
        const newSegment: TranscriptSegment = {
          speaker: activeSpeaker,
          text: segmentText,
          timestamp: Date.now(),
        }
        segmentsRef.current = [...segmentsRef.current, newSegment]
        setSegments(segmentsRef.current)
      }
      currentSegmentStartRef.current = transcriptRef.current.length
    }
    setActiveSpeaker(speaker)
  }

  const startRecording = async () => {
    if (speakers.length === 0) {
      toast({
        title: "Add speakers first",
        description: "Please add at least one speaker before recording",
        variant: "destructive",
      })
      return
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      const recognition = new SpeechRecognition()

      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = "en-US"

      transcriptRef.current = ""
      segmentsRef.current = []
      currentSegmentStartRef.current = 0

      recognition.onresult = (event: any) => {
        let finalTranscript = ""
        let interimTranscript = ""

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript + " "
          } else {
            interimTranscript += transcript
          }
        }

        if (finalTranscript) {
          transcriptRef.current += finalTranscript
        }

        setTranscript(transcriptRef.current + interimTranscript)
      }

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error)
        toast({
          title: "Error",
          description: "Speech recognition error: " + event.error,
          variant: "destructive",
        })
        setIsRecording(false)
        shouldProcessRef.current = false
      }

      recognition.onend = async () => {
        console.log("Recognition ended, shouldProcess:", shouldProcessRef.current)
        if (shouldProcessRef.current) {
          if (activeSpeaker && transcriptRef.current.length > currentSegmentStartRef.current) {
            const segmentText = transcriptRef.current.substring(currentSegmentStartRef.current).trim()
            if (segmentText) {
              const newSegment: TranscriptSegment = {
                speaker: activeSpeaker,
                text: segmentText,
                timestamp: Date.now(),
              }
              segmentsRef.current = [...segmentsRef.current, newSegment]
              setSegments(segmentsRef.current)
            }
          }

          setIsRecording(false)
          setIsProcessing(true)
          shouldProcessRef.current = false
          await processSummary(transcriptRef.current.trim(), segmentsRef.current)
        }
      }

      recognitionRef.current = recognition
      recognition.start()
      setIsRecording(true)
      shouldProcessRef.current = true
      setTranscript("")
      setSummary(null)
      setSegments([])

      toast({
        title: "Recording started",
        description: "Your meeting is being recorded",
      })
    } catch (error) {
      console.error("Error starting recording:", error)
      toast({
        title: "Error",
        description: "Could not start speech recognition",
        variant: "destructive",
      })
    }
  }

  const stopRecording = () => {
    console.log("Stop button clicked")
    if (recognitionRef.current && isRecording) {
      shouldProcessRef.current = true
      recognitionRef.current.stop()
    }
  }

  const processSummary = async (transcriptText: string, transcriptSegments: TranscriptSegment[]) => {
    try {
      console.log("Processing summary, transcript length:", transcriptText.length)

      if (!transcriptText || transcriptText.length < 10) {
        toast({
          title: "No speech detected",
          description: "Please try recording again with clear speech",
          variant: "destructive",
        })
        setIsProcessing(false)
        return
      }

      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcript: transcriptText,
          segments: transcriptSegments,
          speakers: speakers,
        }),
      })

      if (!response.ok) {
        throw new Error("Summarization failed")
      }

      const data = await response.json()
      setSummary(data.summary)

      const meeting: Meeting = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        transcript: transcriptText,
        segments: transcriptSegments,
        speakers: speakers,
        summary: data.summary,
      }

      const existingMeetings = JSON.parse(localStorage.getItem("meetings") || "[]")
      localStorage.setItem("meetings", JSON.stringify([meeting, ...existingMeetings]))

      console.log("Meeting saved to localStorage")

      if (onMeetingSaved) {
        onMeetingSaved()
      }

      toast({
        title: "Meeting processed",
        description: "Your notes are ready",
      })
    } catch (error) {
      console.error("[v0] Error processing summary:", error)
      toast({
        title: "Error",
        description: "Failed to generate summary",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  if (!isSupported) {
    return (
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-card-foreground">Browser Not Supported</CardTitle>
          <CardDescription>
            Your browser doesn't support speech recognition. Please use Chrome, Edge, or Safari.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-card-foreground">Meeting Participants</CardTitle>
          <CardDescription>Add speakers before or during the meeting</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter speaker name..."
              value={newSpeakerName}
              onChange={(e) => setNewSpeakerName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addSpeaker()}
              disabled={isRecording || isProcessing}
              className="flex-1"
            />
            <Button onClick={addSpeaker} disabled={isRecording || isProcessing} size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {speakers.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-card-foreground">Speakers:</p>
              <div className="flex flex-wrap gap-2">
                {speakers.map((speaker) => (
                  <Badge
                    key={speaker}
                    variant={activeSpeaker === speaker ? "default" : "secondary"}
                    className="cursor-pointer gap-2 px-3 py-1"
                    onClick={() => switchSpeaker(speaker)}
                  >
                    <User className="h-3 w-3" />
                    {speaker}
                    {!isRecording && !isProcessing && (
                      <X
                        className="h-3 w-3 hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeSpeaker(speaker)
                        }}
                      />
                    )}
                  </Badge>
                ))}
              </div>
              {isRecording && activeSpeaker && (
                <p className="text-sm text-muted-foreground">
                  Currently speaking: <span className="font-medium text-primary">{activeSpeaker}</span>
                  {speakers.length > 1 && " (click another speaker to switch)"}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-card-foreground">Record Meeting</CardTitle>
          <CardDescription>Click to start recording your meeting</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center gap-4">
            {!isRecording && !isProcessing && (
              <Button
                size="lg"
                onClick={startRecording}
                className="h-16 w-16 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Mic className="h-6 w-6" />
              </Button>
            )}

            {isRecording && (
              <Button size="lg" onClick={stopRecording} variant="destructive" className="h-16 w-16 rounded-full">
                <Square className="h-6 w-6" />
              </Button>
            )}

            {isProcessing && (
              <div className="flex h-16 w-16 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
          </div>

          {isRecording && (
            <div className="flex items-center justify-center gap-2 text-sm text-destructive">
              <div className="h-2 w-2 animate-pulse rounded-full bg-destructive" />
              Recording in progress...
            </div>
          )}

          {isProcessing && <p className="text-center text-sm text-muted-foreground">Processing your recording...</p>}
        </CardContent>
      </Card>

      {(transcript || segments.length > 0) && (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-card-foreground">Transcript</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-64 overflow-y-auto rounded-lg bg-muted p-4 space-y-3">
              {segments.map((segment, i) => (
                <div key={i} className="space-y-1">
                  <p className="text-xs font-semibold text-primary">{segment.speaker}:</p>
                  <p className="text-sm leading-relaxed text-muted-foreground pl-4">{segment.text}</p>
                </div>
              ))}
              {isRecording && activeSpeaker && transcript.length > currentSegmentStartRef.current && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-primary">{activeSpeaker}:</p>
                  <p className="text-sm leading-relaxed text-muted-foreground pl-4">
                    {transcript.substring(currentSegmentStartRef.current)}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {summary && (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-card-foreground">AI Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="mb-2 font-semibold text-card-foreground">Overview</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{summary.overview}</p>
            </div>

            {summary.speakerInsights && summary.speakerInsights.length > 0 && (
              <div>
                <h3 className="mb-2 font-semibold text-card-foreground">Speaker Contributions</h3>
                <div className="space-y-2">
                  {summary.speakerInsights.map((insight, i) => (
                    <div key={i} className="rounded-lg bg-muted p-3">
                      <p className="text-sm font-medium text-primary mb-1">{insight.speaker}</p>
                      <p className="text-sm text-muted-foreground">{insight.contribution}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {summary.keyPoints.length > 0 && (
              <div>
                <h3 className="mb-2 font-semibold text-card-foreground">Key Points</h3>
                <ul className="space-y-2">
                  {summary.keyPoints.map((point, i) => (
                    <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                      <span className="text-primary">•</span>
                      <span className="leading-relaxed">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {summary.actionItems.length > 0 && (
              <div>
                <h3 className="mb-2 font-semibold text-card-foreground">Action Items</h3>
                <ul className="space-y-2">
                  {summary.actionItems.map((item, i) => (
                    <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                      <span className="text-accent">→</span>
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {summary.decisions.length > 0 && (
              <div>
                <h3 className="mb-2 font-semibold text-card-foreground">Decisions Made</h3>
                <ul className="space-y-2">
                  {summary.decisions.map((decision, i) => (
                    <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                      <span className="text-accent">✓</span>
                      <span className="leading-relaxed">{decision}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
