"use client"

import { useState } from "react"
import { MeetingRecorder } from "@/components/meeting-recorder"
import { MeetingHistory } from "@/components/meeting-history"

export default function Home() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-12 text-center">
          <h1 className="mb-3 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">AI Meeting Notes</h1>
          <p className="text-lg text-muted-foreground">Record, transcribe and summarize your meetings with AI</p>
        </header>

        <div className="grid gap-8 lg:grid-cols-2">
          <MeetingRecorder onMeetingSaved={() => setRefreshTrigger((prev) => prev + 1)} />
          <MeetingHistory refreshTrigger={refreshTrigger} />
        </div>
      </div>
    </div>
  )
}
