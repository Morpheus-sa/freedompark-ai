"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function NewRoomPage() {
  const [title, setTitle] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { data: meeting, error: meetingError } = await supabase
        .from("meetings")
        .insert({
          title,
          created_by: user.id,
          status: "waiting",
        })
        .select()
        .single()

      if (meetingError) throw meetingError

      // Add creator as participant
      const { error: participantError } = await supabase.from("participants").insert({
        meeting_id: meeting.id,
        user_id: user.id,
        is_active: true,
      })

      if (participantError) throw participantError

      router.push(`/rooms/${meeting.id}`)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Failed to create room")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Create Meeting Room</CardTitle>
            <CardDescription>Start a new collaborative meeting session</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateRoom}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="title">Meeting Title</Label>
                  <Input
                    id="title"
                    type="text"
                    placeholder="Weekly Team Sync"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 bg-transparent"
                    onClick={() => router.back()}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1" disabled={isLoading}>
                    {isLoading ? "Creating..." : "Create Room"}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
