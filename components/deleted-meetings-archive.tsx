"use client"

import { useState, useEffect } from "react"
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, deleteDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Archive, Users, Clock, Search, RotateCcw, Trash2, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Meeting } from "@/types/meeting"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function DeletedMeetingsArchive() {
  const [deletedMeetings, setDeletedMeetings] = useState<Meeting[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [meetingToDelete, setMeetingToDelete] = useState<Meeting | null>(null)
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (!user?.isAdmin) return

    console.log("Setting up deleted meetings listener")

    const q = query(collection(db, "meetings"), where("isDeleted", "==", true), orderBy("deletedAt", "desc"))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const meetingsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Meeting[]

        setDeletedMeetings(meetingsData)
      },
      (error) => {
        console.error("Error listening to deleted meetings:", error)
        toast({
          title: "Error",
          description: "Failed to load deleted meetings",
          variant: "destructive",
        })
      },
    )

    return unsubscribe
  }, [user, toast])

  const filteredMeetings = deletedMeetings.filter((meeting) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return meeting.title.toLowerCase().includes(query) || meeting.description?.toLowerCase().includes(query)
  })

  const restoreMeeting = async (meetingId: string, meetingTitle: string) => {
    try {
      await updateDoc(doc(db, "meetings", meetingId), {
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
      })

      toast({
        title: "Meeting restored",
        description: `"${meetingTitle}" has been restored successfully`,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to restore meeting",
        variant: "destructive",
      })
    }
  }

  const permanentlyDeleteMeeting = async () => {
    if (!meetingToDelete) return

    try {
      await deleteDoc(doc(db, "meetings", meetingToDelete.id))

      toast({
        title: "Meeting permanently deleted",
        description: `"${meetingToDelete.title}" has been permanently removed from the database`,
      })
      setMeetingToDelete(null)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to permanently delete meeting",
        variant: "destructive",
      })
    }
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Unknown date"

    try {
      let dateValue: number

      if (timestamp && typeof timestamp === "object" && "seconds" in timestamp) {
        dateValue = timestamp.seconds * 1000
      } else if (timestamp && typeof timestamp.toMillis === "function") {
        dateValue = timestamp.toMillis()
      } else if (typeof timestamp === "number") {
        dateValue = timestamp
      } else {
        return "Unknown date"
      }

      const date = new Date(dateValue)
      if (isNaN(date.getTime())) {
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
      return "Unknown date"
    }
  }

  if (!user?.isAdmin) {
    return null
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Archive className="h-5 w-5" />
                Deleted Meetings Archive
              </CardTitle>
              <CardDescription>View and restore archived meetings (Admin only)</CardDescription>
            </div>
            <Badge variant="secondary">{deletedMeetings.length} archived</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search archived meetings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {filteredMeetings.length === 0 ? (
            <div className="py-12 text-center">
              <Archive className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-50" />
              <p className="mb-2 font-medium text-foreground">
                {searchQuery ? "No meetings found" : "No deleted meetings"}
              </p>
              <p className="text-sm text-muted-foreground">
                {searchQuery ? "Try a different search term" : "Deleted meetings will appear here"}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3 pr-4">
                {filteredMeetings.map((meeting) => (
                  <div
                    key={meeting.id}
                    className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-foreground">{meeting.title}</h3>
                              <Badge variant="destructive" className="text-xs">
                                Deleted
                              </Badge>
                            </div>
                            {meeting.description && (
                              <p className="mt-1 text-sm text-muted-foreground">{meeting.description}</p>
                            )}
                            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Created: {formatDate(meeting.createdAt)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Archive className="h-3 w-3" />
                                Deleted: {formatDate(meeting.deletedAt)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {meeting.participants.length} participant
                                {meeting.participants.length !== 1 ? "s" : ""}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => restoreMeeting(meeting.id, meeting.title)}
                            className="gap-2"
                          >
                            <RotateCcw className="h-4 w-4" />
                            Restore
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setMeetingToDelete(meeting)}
                            className="gap-2"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete Permanently
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!meetingToDelete} onOpenChange={(open) => !open && setMeetingToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Permanently Delete Meeting?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The meeting "{meetingToDelete?.title}" and all its data (transcript,
              summary, participants) will be permanently removed from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={permanentlyDeleteMeeting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
