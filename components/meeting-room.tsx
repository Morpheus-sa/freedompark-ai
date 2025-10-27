"use client"

import { useEffect, useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mic, MicOff, Users, Sparkles, Copy, Check, ArrowLeft } from "lucide-react"
import Link from "next/link"
import type { RealtimeChannel } from "@supabase/supabase-js"

interface MeetingRoomProps {
  meetingId: string
  userId: string
  meetingTitle: string
}

interface Transcript {
  id: string
  user_id: string
  content: string
  created_at: string
  profiles?: {
    display_name: string
  }
}

interface Participant {
  id: string
  user_id: string
  is_active: boolean
  profiles?: {
    display_name: string
  }
}

declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

export function MeetingRoom({ meetingId, userId, meetingTitle }: MeetingRoomProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [transcripts, setTranscripts] = useState<Transcript[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [summary, setSummary] = useState<string | null>(null)
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  const [copied, setCopied] = useState(false)

  const recognitionRef = useRef<any>(null)
  const isRecordingRef = useRef(false)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const transcriptEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()

    const loadTranscripts = async () => {
      const { data } = await supabase
        .from("transcripts")
        .select("*, profiles(display_name)")
        .eq("meeting_id", meetingId)
        .order("created_at", { ascending: true })

      if (data) setTranscripts(data)
    }

    const loadParticipants = async () => {
      const { data } = await supabase
        .from("participants")
        .select("*, profiles(display_name)")
        .eq("meeting_id", meetingId)
        .eq("is_active", true)

      if (data) setParticipants(data)
    }

    loadTranscripts()
    loadParticipants()

    const channel = supabase
      .channel(`meeting:${meetingId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "transcripts",
          filter: `meeting_id=eq.${meetingId}`,
        },
        async (payload) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("id", payload.new.user_id)
            .single()

          setTranscripts((prev) => [
            ...prev,
            {
              ...payload.new,
              profiles: profile,
            } as Transcript,
          ])
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "participants",
          filter: `meeting_id=eq.${meetingId}`,
        },
        () => {
          loadParticipants()
        },
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
    }
  }, [meetingId])

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [transcripts])

  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.")
      return
    }

    const recognition = new SpeechRecognition()

    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = "en-US"

    let finalTranscript = ""

    recognition.onresult = (event) => {
      let interimTranscript = ""

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " "
        } else {
          interimTranscript += transcript
        }
      }

      if (finalTranscript.trim()) {
        saveTranscript(finalTranscript.trim())
        finalTranscript = ""
      }
    }

    recognition.onerror = (event) => {
      console.error("[v0] Speech recognition error:", event.error)
      if (event.error === "no-speech") {
        return
      }
      setIsRecording(false)
      isRecordingRef.current = false
    }

    recognition.onend = () => {
      if (isRecordingRef.current) {
        recognition.start()
      }
    }

    recognitionRef.current = recognition
    isRecordingRef.current = true
    recognition.start()
    setIsRecording(true)
  }

  const stopRecording = () => {
    if (recognitionRef.current) {
      isRecordingRef.current = false
      recognitionRef.current.stop()
      setIsRecording(false)
    }
  }

  const saveTranscript = async (content: string) => {
    const supabase = createClient()
    await supabase.from("transcripts").insert({
      meeting_id: meetingId,
      user_id: userId,
      content,
    })
  }

  const generateSummary = async () => {
    setIsGeneratingSummary(true)
    try {
      const fullTranscript = transcripts.map((t) => `${t.profiles?.display_name || "Unknown"}: ${t.content}`).join("\n")

      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: fullTranscript }),
      })

      const data = await response.json()
      setSummary(data.summary)
    } catch (error) {
      console.error("[v0] Error generating summary:", error)
    } finally {
      setIsGeneratingSummary(false)
    }
  }

  const copyRoomLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/rooms">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">{meetingTitle}</h1>
              <p className="mt-1 text-sm text-muted-foreground">Meeting ID: {meetingId.slice(0, 8)}</p>
            </div>
          </div>
          <Button variant="outline" onClick={copyRoomLink}>
            {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
            {copied ? "Copied!" : "Share Link"}
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Live Transcript</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant={isRecording ? "destructive" : "default"}
                      onClick={isRecording ? stopRecording : startRecording}
                    >
                      {isRecording ? (
                        <>
                          <MicOff className="mr-2 h-4 w-4" />
                          Stop Recording
                        </>
                      ) : (
                        <>
                          <Mic className="mr-2 h-4 w-4" />
                          Start Recording
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={generateSummary}
                      disabled={transcripts.length === 0 || isGeneratingSummary}
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      {isGeneratingSummary ? "Generating..." : "Summarize"}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 space-y-4 overflow-y-auto rounded-lg bg-muted/50 p-4">
                  {transcripts.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground">
                      No transcript yet. Start recording to begin.
                    </p>
                  ) : (
                    transcripts.map((transcript) => (
                      <div key={transcript.id} className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={transcript.user_id === userId ? "default" : "secondary"}>
                            {transcript.profiles?.display_name || "Unknown"}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(transcript.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm">{transcript.content}</p>
                      </div>
                    ))
                  )}
                  <div ref={transcriptEndRef} />
                </div>
              </CardContent>
            </Card>

            {summary && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>AI Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <pre className="whitespace-pre-wrap font-sans text-sm">{summary}</pre>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Participants ({participants.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {participants.map((participant) => (
                    <div key={participant.id} className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <span className="text-sm font-medium">
                        {participant.profiles?.display_name || "Unknown"}
                        {participant.user_id === userId && " (You)"}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
