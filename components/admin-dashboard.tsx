"use client"

import { useEffect, useState } from "react"
import { collection, query, onSnapshot, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { User, Meeting } from "@/types/meeting"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Shield, Users, Calendar, Search, Mail, Clock } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { UserMeetingRecordsDialog } from "./user-meeting-records-dialog"

export function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([])
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showRecordsDialog, setShowRecordsDialog] = useState(false)

  useEffect(() => {
    console.log("[v0] Admin Dashboard: Setting up real-time listeners")

    const usersQuery = query(collection(db, "users"), orderBy("createdAt", "desc"))
    const unsubscribeUsers = onSnapshot(
      usersQuery,
      (snapshot) => {
        const usersData = snapshot.docs.map((doc) => ({
          ...doc.data(),
          uid: doc.id,
        })) as User[]
        console.log("[v0] Admin Dashboard: Loaded users:", usersData.length)
        setUsers(usersData)
        setLoading(false)
      },
      (error) => {
        console.error("[v0] Admin Dashboard: Error loading users:", error)
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
        console.log("[v0] Admin Dashboard: Loaded meetings:", meetingsData.length)
        setMeetings(meetingsData)
      },
      (error) => {
        console.error("[v0] Admin Dashboard: Error loading meetings:", error)
      },
    )

    return () => {
      unsubscribeUsers()
      unsubscribeMeetings()
    }
  }, [])

  const filteredUsers = users.filter(
    (user) =>
      user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getUserMeetings = (userId: string) => {
    return meetings.filter((meeting) => meeting.participants.includes(userId))
  }

  const handleViewMeetingHistory = (user: User) => {
    setSelectedUser(user)
    setShowRecordsDialog(true)
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
      <Card className="border-purple-500/20 bg-gradient-to-r from-purple-500/10 to-blue-500/10">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-purple-500" />
            <CardTitle>Admin Dashboard</CardTitle>
          </div>
          <CardDescription>Manage users and access meeting records</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">
              {users.filter((u) => u.isAdmin).length} admin{users.filter((u) => u.isAdmin).length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Meetings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{meetings.length}</div>
            <p className="text-xs text-muted-foreground">{meetings.filter((m) => m.isActive).length} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {meetings.filter((m) => Date.now() - m.createdAt < 24 * 60 * 60 * 1000).length}
            </div>
            <p className="text-xs text-muted-foreground">meetings in last 24h</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="meetings">All Meetings</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search users by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <ScrollArea className="h-[600px]">
            <div className="space-y-3">
              {filteredUsers.map((user) => {
                const userMeetings = getUserMeetings(user.uid)
                const activeMeetings = userMeetings.filter((m) => m.isActive)
                const pastMeetings = userMeetings.filter((m) => !m.isActive)

                return (
                  <Card key={user.uid}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-base">{user.displayName}</CardTitle>
                            {user.isAdmin && (
                              <Badge variant="secondary" className="gap-1">
                                <Shield className="h-3 w-3" />
                                Admin
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </div>
                          {user.createdAt && (
                            <p className="text-xs text-muted-foreground">
                              Joined {formatDistanceToNow(user.createdAt, { addSuffix: true })}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex gap-4 text-sm">
                          <div>
                            <span className="font-medium">{activeMeetings.length}</span>
                            <span className="text-muted-foreground">
                              {" "}
                              active meeting{activeMeetings.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium">{pastMeetings.length}</span>
                            <span className="text-muted-foreground">
                              {" "}
                              past meeting{pastMeetings.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>

                        {pastMeetings.length > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full bg-transparent"
                            onClick={() => handleViewMeetingHistory(user)}
                          >
                            View Meeting History ({pastMeetings.length})
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}

              {filteredUsers.length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-sm text-muted-foreground">No users found matching your search.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="meetings" className="space-y-4">
          <ScrollArea className="h-[600px]">
            <div className="space-y-3">
              {meetings.map((meeting) => (
                <Card key={meeting.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base">{meeting.title}</CardTitle>
                          {meeting.isActive ? (
                            <Badge variant="default">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Ended</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(meeting.createdAt, { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">{meeting.participants.length}</span>
                        <span className="text-muted-foreground">
                          {" "}
                          participant{meeting.participants.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      {meeting.transcript && (
                        <div>
                          <span className="font-medium">{meeting.transcript.length}</span>
                          <span className="text-muted-foreground">
                            {" "}
                            transcript segment{meeting.transcript.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {meetings.length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-sm text-muted-foreground">No meetings found.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {selectedUser && (
        <UserMeetingRecordsDialog
          user={selectedUser}
          meetings={getUserMeetings(selectedUser.uid).filter((m) => !m.isActive)}
          open={showRecordsDialog}
          onOpenChange={setShowRecordsDialog}
        />
      )}
    </div>
  )
}
