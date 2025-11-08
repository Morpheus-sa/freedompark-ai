"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { subscribeToUserNotifications, markNotificationAsRead } from "@/lib/notification-service"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Bell, Calendar, UserPlus, PlayCircle, StopCircle, Check, Info } from "lucide-react"
import type { Notification } from "@/types/notification"
import { useRouter } from "next/navigation"

export function NotificationsPanel() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) return

    const unsubscribe = subscribeToUserNotifications(user.uid, (notifs) => {
      setNotifications(notifs)
    })

    return unsubscribe
  }, [user])

  const unreadCount = notifications.filter((n) => !n.read).length

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "meeting_invitation":
      case "participant_added":
        return <UserPlus className="h-4 w-4 text-blue-500" />
      case "meeting_started":
        return <PlayCircle className="h-4 w-4 text-green-500" />
      case "meeting_ended":
        return <StopCircle className="h-4 w-4 text-red-500" />
      case "meeting_scheduled":
      case "meeting_reminder":
        return <Calendar className="h-4 w-4 text-purple-500" />
      case "meeting_updated":
        return <Info className="h-4 w-4 text-orange-500" />
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />
    }
  }

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return new Date(timestamp).toLocaleDateString("en-ZA", { month: "short", day: "numeric" })
  }

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markNotificationAsRead(notification.id)
    }

    if (notification.actionUrl) {
      router.push(notification.actionUrl)
      setOpen(false)
    } else if (notification.meetingId) {
      // Could navigate to meeting if needed
      setOpen(false)
    }
  }

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter((n) => !n.read)
    await Promise.all(unreadNotifications.map((n) => markNotificationAsRead(n.id)))
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
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
      </PopoverTrigger>
      <PopoverContent className="w-[380px] p-0" align="end">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h3 className="font-semibold text-foreground">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs h-7">
              <Check className="mr-1 h-3 w-3" />
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="py-12 text-center">
              <Bell className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full p-4 text-left transition-colors hover:bg-accent ${
                    !notification.read ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="mt-0.5 shrink-0">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-foreground line-clamp-1">{notification.title}</p>
                        {!notification.read && <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{notification.message}</p>
                      {notification.meetingCode && (
                        <Badge variant="outline" className="mt-1 font-mono text-xs">
                          {notification.meetingCode}
                        </Badge>
                      )}
                      <p className="text-xs text-muted-foreground">{formatTimestamp(notification.createdAt)}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
