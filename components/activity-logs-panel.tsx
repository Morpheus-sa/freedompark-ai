"use client"

import { useEffect, useState } from "react"
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Activity,
  LogIn,
  LogOut,
  Plus,
  UserPlus,
  Calendar,
  Edit,
  Trash2,
  Share2,
  Clock,
  User,
  Search,
  Shield,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import type { ActivityLog } from "@/types/activity-log"

const activityIcons: Record<string, any> = {
  user_login: LogIn,
  user_logout: LogOut,
  meeting_created: Plus,
  meeting_joined: UserPlus,
  meeting_ended: Clock,
  meeting_scheduled: Calendar,
  meeting_cancelled: Trash2,
  meeting_edited: Edit,
  user_profile_updated: User,
  user_created: UserPlus,
  user_role_changed: Shield,
  meeting_summary_edited: Edit,
  meeting_shared: Share2,
  meeting_deleted: Trash2,
}

const activityColors: Record<string, string> = {
  user_login: "text-green-500",
  user_logout: "text-gray-500",
  meeting_created: "text-blue-500",
  meeting_joined: "text-purple-500",
  meeting_ended: "text-orange-500",
  meeting_scheduled: "text-cyan-500",
  meeting_cancelled: "text-red-500",
  meeting_edited: "text-yellow-500",
  user_profile_updated: "text-indigo-500",
  user_created: "text-emerald-500",
  user_role_changed: "text-pink-500",
  meeting_summary_edited: "text-amber-500",
  meeting_shared: "text-teal-500",
  meeting_deleted: "text-rose-500",
}

export function ActivityLogsPanel() {
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [filteredActivities, setFilteredActivities] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [limitCount, setLimitCount] = useState(50)

  useEffect(() => {
    console.log("[v0] Setting up activity logs listener")

    const q = query(collection(db, "activityLogs"), orderBy("timestamp", "desc"), limit(limitCount))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const activitiesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as ActivityLog[]

        console.log("[v0] Loaded activities:", activitiesData.length)
        setActivities(activitiesData)
        setLoading(false)
      },
      (error) => {
        console.error("[v0] Error loading activities:", error)
        setLoading(false)
      },
    )

    return unsubscribe
  }, [limitCount])

  useEffect(() => {
    let filtered = activities

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (activity) =>
          activity.userName.toLowerCase().includes(query) ||
          activity.userEmail.toLowerCase().includes(query) ||
          activity.description.toLowerCase().includes(query) ||
          activity.metadata?.meetingTitle?.toLowerCase().includes(query),
      )
    }

    // Filter by activity type
    if (filterType !== "all") {
      filtered = filtered.filter((activity) => activity.activityType === filterType)
    }

    setFilteredActivities(filtered)
  }, [activities, searchQuery, filterType])

  const formatTimestamp = (timestamp: number) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
    } catch {
      return "Unknown"
    }
  }

  const getActivityIcon = (type: string) => {
    const Icon = activityIcons[type] || Activity
    return Icon
  }

  const getActivityColor = (type: string) => {
    return activityColors[type] || "text-gray-500"
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mb-2 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
            <p className="text-sm text-muted-foreground">Loading activity logs...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Activity Logs
        </CardTitle>
        <CardDescription>Real-time system activity and audit trail</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by user, email, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Activities</SelectItem>
              <SelectItem value="user_login">User Login</SelectItem>
              <SelectItem value="user_logout">User Logout</SelectItem>
              <SelectItem value="meeting_created">Meeting Created</SelectItem>
              <SelectItem value="meeting_joined">Meeting Joined</SelectItem>
              <SelectItem value="meeting_ended">Meeting Ended</SelectItem>
              <SelectItem value="meeting_scheduled">Meeting Scheduled</SelectItem>
              <SelectItem value="meeting_edited">Meeting Edited</SelectItem>
              <SelectItem value="meeting_deleted">Meeting Deleted</SelectItem>
              <SelectItem value="user_profile_updated">Profile Updated</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-lg border bg-muted/30 p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Showing {filteredActivities.length} of {activities.length} activities
            </span>
            <Select value={limitCount.toString()} onValueChange={(v) => setLimitCount(Number.parseInt(v))}>
              <SelectTrigger className="w-[120px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50">Last 50</SelectItem>
                <SelectItem value="100">Last 100</SelectItem>
                <SelectItem value="200">Last 200</SelectItem>
                <SelectItem value="500">Last 500</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <ScrollArea className="h-[600px]">
          <div className="space-y-2 pr-4">
            {filteredActivities.length === 0 ? (
              <div className="py-12 text-center">
                <Activity className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">No activities found</p>
              </div>
            ) : (
              filteredActivities.map((activity) => {
                const Icon = getActivityIcon(activity.activityType)
                const colorClass = getActivityColor(activity.activityType)

                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 rounded-lg border bg-card p-3 hover:bg-accent/5 transition-colors"
                  >
                    <div className={`mt-0.5 rounded-full p-2 bg-muted ${colorClass}`}>
                      <Icon className="h-4 w-4" />
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">{activity.description}</p>
                        <Badge variant="outline" className="text-xs">
                          {activity.activityType.replace(/_/g, " ")}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {activity.userName}
                        </span>
                        <span>•</span>
                        <span>{activity.userEmail}</span>
                        {activity.metadata?.meetingTitle && (
                          <>
                            <span>•</span>
                            <span className="font-medium">{activity.metadata.meetingTitle}</span>
                          </>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground">{formatTimestamp(activity.timestamp)}</p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
