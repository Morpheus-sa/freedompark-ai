"use client"

import { useState, useEffect } from "react"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Users } from "lucide-react"
import type { User } from "@/types/meeting"

interface MeetingParticipantsProps {
  participantIds: string[]
}

export function MeetingParticipants({ participantIds }: MeetingParticipantsProps) {
  const [participants, setParticipants] = useState<User[]>([])

  useEffect(() => {
    const fetchParticipants = async () => {
      if (participantIds.length === 0) return

      try {
        const usersRef = collection(db, "users")
        const q = query(usersRef, where("uid", "in", participantIds))
        const snapshot = await getDocs(q)

        const users = snapshot.docs.map((doc) => doc.data() as User)
        setParticipants(users)
      } catch (error) {
        console.error("[v0] Error fetching participants:", error)
      }
    }

    fetchParticipants()
  }, [participantIds])

  return (
    <div className="flex items-center gap-2">
      <Users className="h-4 w-4 text-muted-foreground" />
      <div className="flex -space-x-2">
        {participants.slice(0, 3).map((participant) => (
          <Avatar key={participant.uid} className="h-8 w-8 border-2 border-background">
            <AvatarFallback className="text-xs">{participant.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
        ))}
      </div>
      {participants.length > 3 && (
        <Badge variant="secondary" className="text-xs">
          +{participants.length - 3}
        </Badge>
      )}
    </div>
  )
}
