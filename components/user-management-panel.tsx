"use client"

import { useEffect, useState } from "react"
import { collection, query, onSnapshot, orderBy, doc, updateDoc, deleteDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { User } from "@/types/meeting"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { Users, Search, Shield, Trash2, UserCog, Building2, Briefcase, Mail, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { logActivity } from "@/lib/activity-logger"

interface UserStatus {
  active: boolean
  suspended: boolean
  reason?: string
}

export function UserManagementPanel() {
  const [users, setUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const { user: currentUser } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    console.log("[v0] Setting up users listener")

    const q = query(collection(db, "users"), orderBy("createdAt", "desc"))
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const usersData = snapshot.docs.map((doc) => ({
          uid: doc.id,
          ...doc.data(),
        })) as User[]
        console.log("[v0] Loaded users:", usersData.length)
        setUsers(usersData)
      },
      (error) => {
        console.error("[v0] Error loading users:", error)
        toast({
          title: "Error",
          description: "Failed to load users",
          variant: "destructive",
        })
      },
    )

    return unsubscribe
  }, [toast])

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.company?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesRole =
      roleFilter === "all" || (roleFilter === "admin" && user.isAdmin) || (roleFilter === "user" && !user.isAdmin)

    return matchesSearch && matchesRole
  })

  const handleToggleAdmin = async (user: User) => {
    if (!currentUser) return

    setIsSaving(true)
    try {
      const userRef = doc(db, "users", user.uid)
      const newAdminStatus = !user.isAdmin

      await updateDoc(userRef, {
        isAdmin: newAdminStatus,
      })

      await logActivity(
        currentUser.uid,
        currentUser.email,
        currentUser.displayName,
        "user_role_changed",
        `${currentUser.displayName} changed ${user.displayName}'s admin status to ${newAdminStatus}`,
        {
          targetUserId: user.uid,
          targetUserEmail: user.email,
          changes: { isAdmin: newAdminStatus },
        },
      )

      toast({
        title: "Role updated",
        description: `${user.displayName} is now ${newAdminStatus ? "an admin" : "a regular user"}`,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update user role",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser || !currentUser) return

    setIsSaving(true)
    try {
      await deleteDoc(doc(db, "users", selectedUser.uid))

      await logActivity(
        currentUser.uid,
        currentUser.email,
        currentUser.displayName,
        "user_role_changed",
        `${currentUser.displayName} deleted user ${selectedUser.displayName}`,
        {
          targetUserId: selectedUser.uid,
          targetUserEmail: selectedUser.email,
        },
      )

      toast({
        title: "User deleted",
        description: `${selectedUser.displayName} has been removed from the system`,
      })

      setDeleteDialogOpen(false)
      setSelectedUser(null)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const formatTimestamp = (timestamp: number | undefined) => {
    if (!timestamp) return "Unknown"
    try {
      return new Date(timestamp).toLocaleDateString("en-ZA", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    } catch {
      return "Unknown"
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5" />
              User Management
            </CardTitle>
            <CardDescription>Manage user roles, permissions, and accounts</CardDescription>
          </div>
          <Badge variant="outline" className="text-sm">
            {filteredUsers.length} {filteredUsers.length === 1 ? "user" : "users"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search users by name, email, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="admin">Admins Only</SelectItem>
              <SelectItem value="user">Regular Users</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <ScrollArea className="h-[600px]">
          <div className="space-y-3 pr-4">
            {filteredUsers.map((user) => (
              <Card key={user.uid} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12 border-2 border-primary/20">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {getInitials(user.displayName)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 space-y-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground">{user.displayName}</h3>
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
                      </div>

                      {(user.fullName || user.company || user.jobTitle) && (
                        <div className="grid gap-2 text-sm">
                          {user.fullName && (
                            <div className="flex items-center gap-2">
                              <Users className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-foreground">{user.fullName}</span>
                            </div>
                          )}
                          {user.company && (
                            <div className="flex items-center gap-2">
                              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-foreground">{user.company}</span>
                            </div>
                          )}
                          {user.jobTitle && (
                            <div className="flex items-center gap-2">
                              <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-foreground">
                                {user.jobTitle}
                                {user.department && ` • ${user.department}`}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {user.createdAt && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          Joined {formatTimestamp(user.createdAt)}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleAdmin(user)}
                          disabled={isSaving || user.uid === currentUser?.uid}
                          className="gap-1"
                        >
                          <Shield className="h-3 w-3" />
                          {user.isAdmin ? "Remove Admin" : "Make Admin"}
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user)
                            setDeleteDialogOpen(true)
                          }}
                          disabled={isSaving || user.uid === currentUser?.uid}
                          className="gap-1 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredUsers.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-50" />
                  <p className="text-sm text-muted-foreground">No users found matching your search</p>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </CardContent>

      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User Account?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedUser?.displayName}? This action cannot be undone and will remove
              all user data and meeting history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={isSaving}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isSaving ? "Deleting..." : "Delete User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
