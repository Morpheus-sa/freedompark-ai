"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { collection, query, where, onSnapshot, orderBy, limit } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"
import { format } from "date-fns"

interface Notification {
  id: string
  type: "meeting_scheduled" | "meeting_started" | "meeting_ended"
  title: string
  message: string
  timestamp: number
  read: boolean
}

export function NotificationCenter() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!user) return

    // Listen for scheduled meetings created by or including the user
    const meetingsQuery = query(
      collection(db, "meetings"),
      where("participants", "array-contains", user.uid),
      where("isScheduled", "==", true),
      orderBy("createdAt", "desc"),
      limit(10),
    )

    const unsubscribe = onSnapshot(meetingsQuery, (snapshot) => {
      const newNotifications: Notification[] = []

      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const meeting = change.doc.data()
          const scheduledDate = meeting.scheduledFor?.toDate()

          if (scheduledDate) {
            newNotifications.push({
              id: change.doc.id,
              type: "meeting_scheduled",
              title: "Meeting Scheduled",
              message: `"${meeting.title}" scheduled for ${format(scheduledDate, "PPP 'at' HH:mm")}`,
              timestamp: meeting.createdAt?.toMillis() || Date.now(),
              read: false,
            })
          }
        }
      })

      if (newNotifications.length > 0) {
        setNotifications((prev) => [...newNotifications, ...prev].slice(0, 10))
        setUnreadCount((prev) => prev + newNotifications.length)
      }
    })

    return () => unsubscribe()
  }, [user])

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  const clearAll = () => {
    setNotifications([])
    setUnreadCount(0)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {notifications.length > 0 && (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={markAllAsRead}>
                Mark all read
              </Button>
              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={clearAll}>
                Clear
              </Button>
            </div>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex flex-col items-start gap-1 p-3 ${!notification.read ? "bg-primary/5" : ""}`}
              >
                <div className="flex items-center gap-2 w-full">
                  <span className="font-semibold text-sm">{notification.title}</span>
                  {!notification.read && <Badge variant="secondary" className="h-2 w-2 rounded-full p-0" />}
                </div>
                <p className="text-xs text-muted-foreground">{notification.message}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(notification.timestamp), "MMM d, h:mm a")}
                </p>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
