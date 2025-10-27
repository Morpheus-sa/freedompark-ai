"use client"

import { useState, useEffect } from "react"
import { collection, query, where, getDocs, doc, updateDoc, arrayRemove } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Crown, MoreVertical, UserMinus, Mic, MicOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { User, Meeting } from "@/types/meeting"

interface ParticipantListPanelProps {
  meeting: Meeting
}

export function ParticipantListPanel({ meeting }: ParticipantListPanelProps) {
  const [participants, setParticipants] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const { toast } = useToast()
  const isHost = user?.uid === meeting.createdBy

  useEffect(() => {
    console.log("[v0] ParticipantListPanel - meeting data:", {
      meetingId: meeting.id,
      participantIds: meeting.participants,
      participantCount: meeting.participants.length,
      createdBy: meeting.createdBy,
    })

    const fetchParticipants = async () => {
      if (meeting.participants.length === 0) {
        console.log("[v0] No participants in meeting")
        setLoading(false)
        return
      }

      try {
        console.log("[v0] Fetching participants from Firestore users collection...")
        const usersRef = collection(db, "users")
        const q = query(usersRef, where("uid", "in", meeting.participants))
        const snapshot = await getDocs(q)

        console.log("[v0] Firestore query result:", {
          docsFound: snapshot.docs.length,
          expectedCount: meeting.participants.length,
        })

        const users = snapshot.docs.map((doc) => {
          const data = doc.data() as User
          console.log("[v0] Found user:", data)
          return data
        })

        setParticipants(users)

        // If we didn't find all users, create fallback entries
        if (users.length < meeting.participants.length) {
          console.log("[v0] Some users not found in Firestore, creating fallback entries")
          const foundUids = users.map((u) => u.uid)
          const missingUids = meeting.participants.filter((uid) => !foundUids.includes(uid))

          const fallbackUsers: User[] = missingUids.map((uid) => ({
            uid,
            email: "unknown@example.com",
            displayName: uid === meeting.createdBy ? "Meeting Host" : `User ${uid.slice(0, 6)}`,
          }))

          console.log("[v0] Created fallback users:", fallbackUsers)
          setParticipants([...users, ...fallbackUsers])
        }
      } catch (error) {
        console.error("[v0] Error fetching participants:", error)
        // Create fallback entries for all participants
        const fallbackUsers: User[] = meeting.participants.map((uid) => ({
          uid,
          email: "unknown@example.com",
          displayName: uid === meeting.createdBy ? "Meeting Host" : `User ${uid.slice(0, 6)}`,
        }))
        setParticipants(fallbackUsers)
      } finally {
        setLoading(false)
      }
    }

    fetchParticipants()
  }, [meeting.participants, meeting.createdBy, meeting.id])

  const removeParticipant = async (participantId: string) => {
    if (!isHost) {
      toast({
        title: "Permission denied",
        description: "Only the host can remove participants",
        variant: "destructive",
      })
      return
    }

    if (participantId === meeting.createdBy) {
      toast({
        title: "Cannot remove host",
        description: "The meeting host cannot be removed",
        variant: "destructive",
      })
      return
    }

    try {
      const meetingRef = doc(db, "meetings", meeting.id)
      await updateDoc(meetingRef, {
        participants: arrayRemove(participantId),
      })

      toast({
        title: "Participant removed",
        description: "The participant has been removed from the meeting",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove participant",
        variant: "destructive",
      })
    }
  }

  const toggleMute = async (participantId: string) => {
    if (!isHost) {
      toast({
        title: "Permission denied",
        description: "Only the host can mute participants",
        variant: "destructive",
      })
      return
    }

    try {
      const meetingRef = doc(db, "meetings", meeting.id)
      const mutedParticipants = meeting.mutedParticipants || []
      const isMuted = mutedParticipants.includes(participantId)

      if (isMuted) {
        await updateDoc(meetingRef, {
          mutedParticipants: arrayRemove(participantId),
        })
        toast({
          title: "Participant unmuted",
          description: "The participant can now speak",
        })
      } else {
        await updateDoc(meetingRef, {
          mutedParticipants: [...mutedParticipants, participantId],
        })
        toast({
          title: "Participant muted",
          description: "The participant has been muted",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to toggle mute",
        variant: "destructive",
      })
    }
  }

  console.log("[v0] ParticipantListPanel render:", {
    participantsCount: participants.length,
    loading,
    isHost,
  })

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Participants</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading participants...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Participants ({participants.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {participants.length === 0 ? (
          <p className="text-sm text-muted-foreground">No participants yet</p>
        ) : (
          <div className="space-y-2">
            {participants.map((participant) => {
              const isParticipantHost = participant.uid === meeting.createdBy
              const isMuted = meeting.mutedParticipants?.includes(participant.uid)
              const isCurrentUser = participant.uid === user?.uid

              return (
                <div
                  key={participant.uid}
                  className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {participant.displayName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {participant.displayName}
                          {isCurrentUser && " (You)"}
                        </span>
                        {isParticipantHost && (
                          <Badge variant="default" className="h-5 gap-1 px-1.5 text-xs">
                            <Crown className="h-3 w-3" />
                            Host
                          </Badge>
                        )}
                      </div>
                      {isMuted && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <MicOff className="h-3 w-3" />
                          Muted by host
                        </span>
                      )}
                    </div>
                  </div>

                  {isHost && !isParticipantHost && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => toggleMute(participant.uid)}>
                          {isMuted ? (
                            <>
                              <Mic className="mr-2 h-4 w-4" />
                              Unmute
                            </>
                          ) : (
                            <>
                              <MicOff className="mr-2 h-4 w-4" />
                              Mute
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => removeParticipant(participant.uid)}
                          className="text-destructive focus:text-destructive"
                        >
                          <UserMinus className="mr-2 h-4 w-4" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
