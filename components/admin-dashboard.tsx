"use client"

import { useEffect, useState } from "react"
import { collection, query, onSnapshot, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { User, Meeting } from "@/types/meeting"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, Users, Calendar, Clock, ActivityIcon, UserCog, TrendingUp } from "lucide-react"
import { UserMeetingRecordsDialog } from "./user-meeting-records-dialog"
import { UserManagementPanel } from "./user-management-panel"
import { ActivityLogsPanel } from "./activity-logs-panel"

export function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([])
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showRecordsDialog, setShowRecordsDialog] = useState(false)

  useEffect(() => {
    console.log("Admin Dashboard: Setting up real-time listeners")

    const usersQuery = query(collection(db, "users"), orderBy("createdAt", "desc"))
    const unsubscribeUsers = onSnapshot(
      usersQuery,
      (snapshot) => {
        const usersData = snapshot.docs.map((doc) => ({
          ...doc.data(),
          uid: doc.id,
        })) as User[]
        console.log("Admin Dashboard: Loaded users:", usersData.length)
        setUsers(usersData)
        setLoading(false)
      },
      (error) => {
        console.error("Admin Dashboard: Error loading users:", error)
        setLoading(false)
      },
    )

    const meetingsQuery = query(collection(db, "meetings"), orderBy("createdAt", "desc"))
    const unsubscribeMeetings = onSnapshot(
      meetingsQuery,
      (snapshot) => {
        const meetingsData = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        })) as Meeting[]
        console.log("Admin Dashboard: Loaded meetings:", meetingsData.length)
        setMeetings(meetingsData)
      },
      (error) => {
        console.error("Admin Dashboard: Error loading meetings:", error)
      },
    )

    return () => {
      unsubscribeUsers()
      unsubscribeMeetings()
    }
  }, [])

  const stats = {
    totalUsers: users.length,
    adminUsers: users.filter((u) => u.isAdmin).length,
    totalMeetings: meetings.length,
    activeMeetings: meetings.filter((m) => m.isActive).length,
    scheduledMeetings: meetings.filter((m) => m.isScheduled && !m.isActive).length,
    recentActivity: meetings.filter((m) => Date.now() - m.createdAt < 24 * 60 * 60 * 1000).length,
    totalTranscripts: meetings.reduce((sum, m) => sum + (m.transcript?.length || 0), 0),
    avgParticipants:
      meetings.length > 0
        ? (meetings.reduce((sum, m) => sum + m.participants.length, 0) / meetings.length).toFixed(1)
        : "0",
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mb-2 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
            <p className="text-sm text-muted-foreground">Loading admin dashboard...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-cyan-500/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-6 w-6 text-purple-500" />
                <CardTitle className="text-2xl">Admin Dashboard</CardTitle>
              </div>
              <CardDescription>Comprehensive system management and insights</CardDescription>
            </div>
            <Badge variant="secondary" className="gap-1 text-sm px-3 py-1">
              <ActivityIcon className="h-4 w-4" />
              Live Updates
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.adminUsers} admin{stats.adminUsers !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Meetings</CardTitle>
            <Calendar className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.totalMeetings}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.activeMeetings} active • {stats.scheduledMeetings} scheduled
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <Clock className="h-4 w-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.recentActivity}</div>
            <p className="text-xs text-muted-foreground mt-1">meetings in last 24h</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.avgParticipants}</div>
            <p className="text-xs text-muted-foreground mt-1">avg participants per meeting</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users" className="gap-2">
            <UserCog className="h-4 w-4" />
            User Management
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <ActivityIcon className="h-4 w-4" />
            Activity Logs
          </TabsTrigger>
          <TabsTrigger value="meetings" className="gap-2">
            <Calendar className="h-4 w-4" />
            All Meetings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UserManagementPanel />
        </TabsContent>

        <TabsContent value="activity">
          <ActivityLogsPanel />
        </TabsContent>

        <TabsContent value="meetings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Meeting Overview
              </CardTitle>
              <CardDescription>All meetings across the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Active Meetings Section */}
                {stats.activeMeetings > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-3">Active Meetings</h3>
                    <div className="space-y-2">
                      {meetings
                        .filter((m) => m.isActive)
                        .map((meeting) => (
                          <Card key={meeting.id} className="border-green-500/20 bg-green-500/5">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-medium text-foreground">{meeting.title}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {meeting.participants.length} participant
                                    {meeting.participants.length !== 1 ? "s" : ""}
                                  </p>
                                </div>
                                <Badge variant="default" className="bg-green-500">
                                  Live
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  </div>
                )}

                {/* Scheduled Meetings Section */}
                {stats.scheduledMeetings > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-3">Scheduled Meetings</h3>
                    <div className="space-y-2">
                      {meetings
                        .filter((m) => m.isScheduled && !m.isActive)
                        .slice(0, 5)
                        .map((meeting) => (
                          <Card key={meeting.id} className="border-blue-500/20 bg-blue-500/5">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-medium text-foreground">{meeting.title}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {meeting.scheduledFor
                                      ? new Date(meeting.scheduledFor).toLocaleString("en-ZA")
                                      : "No date set"}
                                  </p>
                                </div>
                                <Badge variant="secondary">Scheduled</Badge>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  </div>
                )}

                {/* Recent Completed Meetings */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Recent Completed Meetings</h3>
                  <div className="space-y-2">
                    {meetings
                      .filter((m) => !m.isActive && !m.isScheduled)
                      .slice(0, 5)
                      .map((meeting) => (
                        <Card key={meeting.id}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-foreground">{meeting.title}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(meeting.createdAt).toLocaleDateString("en-ZA")} •{" "}
                                  {meeting.participants.length} participants
                                </p>
                              </div>
                              <Badge variant="outline">Ended</Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedUser && (
        <UserMeetingRecordsDialog
          user={selectedUser}
          meetings={meetings.filter((m) => m.participants.includes(selectedUser.uid) && !m.isActive)}
          open={showRecordsDialog}
          onOpenChange={setShowRecordsDialog}
        />
      )}
    </div>
  )
}
