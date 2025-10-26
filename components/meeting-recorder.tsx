"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mic, Square, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export type Meeting = {
  id: string
  date: string
  transcript: string
  summary: {
    overview: string
    keyPoints: string[]
    actionItems: string[]
    decisions: string[]
  }
}

export function MeetingRecorder({ onMeetingSaved }: { onMeetingSaved?: () => void }) {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [summary, setSummary] = useState<{
    overview: string
    keyPoints: string[]
    actionItems: string[]
    decisions: string[]
  } | null>(null)
  const [isSupported, setIsSupported] = useState(true)

  const recognitionRef = useRef<any>(null)
  const shouldProcessRef = useRef(false)
  const transcriptRef = useRef("")
  const { toast } = useToast()

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (!SpeechRecognition) {
        setIsSupported(false)
      }
    }
  }, [])

  const startRecording = async () => {
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      const recognition = new SpeechRecognition()

      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = "en-US"

      transcriptRef.current = ""

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
        console.error("[v0] Speech recognition error:", event.error)
        toast({
          title: "Error",
          description: "Speech recognition error: " + event.error,
          variant: "destructive",
        })
        setIsRecording(false)
        shouldProcessRef.current = false
      }

      recognition.onend = async () => {
        console.log("[v0] Recognition ended, shouldProcess:", shouldProcessRef.current)
        if (shouldProcessRef.current) {
          setIsRecording(false)
          setIsProcessing(true)
          shouldProcessRef.current = false
          await processSummary(transcriptRef.current.trim())
        }
      }

      recognitionRef.current = recognition
      recognition.start()
      setIsRecording(true)
      shouldProcessRef.current = true
      setTranscript("")
      setSummary(null)

      toast({
        title: "Recording started",
        description: "Your meeting is being recorded",
      })
    } catch (error) {
      console.error("[v0] Error starting recording:", error)
      toast({
        title: "Error",
        description: "Could not start speech recognition",
        variant: "destructive",
      })
    }
  }

  const stopRecording = () => {
    console.log("[v0] Stop button clicked")
    if (recognitionRef.current && isRecording) {
      shouldProcessRef.current = true
      recognitionRef.current.stop()
    }
  }

  const processSummary = async (transcriptText: string) => {
    try {
      console.log("[v0] Processing summary, transcript length:", transcriptText.length)

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
        body: JSON.stringify({ transcript: transcriptText }),
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
        summary: data.summary,
      }

      const existingMeetings = JSON.parse(localStorage.getItem("meetings") || "[]")
      localStorage.setItem("meetings", JSON.stringify([meeting, ...existingMeetings]))

      console.log("[v0] Meeting saved to localStorage")

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

      {transcript && (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-card-foreground">Transcript</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-64 overflow-y-auto rounded-lg bg-muted p-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{transcript}</p>
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
