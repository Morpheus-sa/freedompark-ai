"use client"

import { useState } from "react"
import { updateProfile } from "firebase/auth"
import { doc, updateDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { User } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ProfileSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProfileSettingsDialog({ open, onOpenChange }: ProfileSettingsDialogProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [displayName, setDisplayName] = useState(user?.displayName || "")
  const [fullName, setFullName] = useState(user?.fullName || "")
  const [company, setCompany] = useState(user?.company || "")
  const [jobTitle, setJobTitle] = useState(user?.jobTitle || "")
  const [department, setDepartment] = useState(user?.department || "")
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (!user || !auth.currentUser) return

    if (!displayName.trim()) {
      toast({
        title: "Error",
        description: "Display name cannot be empty",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      // Update Firebase Auth profile
      await updateProfile(auth.currentUser, {
        displayName: displayName.trim(),
      })

      await updateDoc(doc(db, "users", user.uid), {
        displayName: displayName.trim(),
        fullName: fullName.trim(),
        company: company.trim(),
        jobTitle: jobTitle.trim(),
        department: department.trim(),
      })

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      })
      onOpenChange(false)
    } catch (error: any) {
      console.error("Error updating profile:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Settings
          </DialogTitle>
          <DialogDescription>Update your profile information</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4 py-4 pr-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user?.email || ""} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your display name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder=""
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company Name</Label>
              <Input
                id="company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder=""
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job Title</Label>
              <Input
                id="jobTitle"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Product Manager"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Engineering"
              />
            </div>
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
