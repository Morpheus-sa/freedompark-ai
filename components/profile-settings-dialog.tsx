"use client"

import { useState, useEffect } from "react"
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
import { User, AlertCircle, CheckCircle2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ProfileSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProfileSettingsDialog({ open, onOpenChange }: ProfileSettingsDialogProps) {
  const { user, refreshUserData } = useAuth()
  const { toast } = useToast()
  const [displayName, setDisplayName] = useState("")
  const [fullName, setFullName] = useState("")
  const [company, setCompany] = useState("")
  const [jobTitle, setJobTitle] = useState("")
  const [department, setDepartment] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (user && open) {
      console.log("[v0] Loading profile data into form:", user)
      setDisplayName(user.displayName || "")
      setFullName(user.fullName || "")
      setCompany(user.company || "")
      setJobTitle(user.jobTitle || "")
      setDepartment(user.department || "")
    }
  }, [user, open])

  const isProfileIncomplete = !fullName?.trim() || !company?.trim() || !jobTitle?.trim() || !department?.trim()

  const handleSave = async () => {
    if (!user || !auth.currentUser) return

    const errors: string[] = []
    if (!displayName.trim()) errors.push("Display name is required")
    if (!fullName.trim()) errors.push("Full name is required")
    if (!company.trim()) errors.push("Company name is required")
    if (!jobTitle.trim()) errors.push("Job title is required")
    if (!department.trim()) errors.push("Department is required")

    if (errors.length > 0) {
      toast({
        title: "Missing Information",
        description: errors.join(", "),
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      console.log("[v0] Saving profile updates")

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

      console.log("[v0] Profile updated successfully")

      await refreshUserData()

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      })
      onOpenChange(false)
    } catch (error: any) {
      console.error("[v0] Error updating profile:", error)
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
          <DialogDescription>Update your professional profile information</DialogDescription>
        </DialogHeader>

        {isProfileIncomplete && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Please complete all required fields to fully set up your profile.</AlertDescription>
          </Alert>
        )}

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4 py-4 pr-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                Email
                <CheckCircle2 className="h-3 w-3 text-green-500" />
              </Label>
              <Input id="email" value={user?.email || ""} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName" className="flex items-center gap-1">
                Display Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your display name"
                className={!displayName.trim() ? "border-destructive" : ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName" className="flex items-center gap-1">
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Thabo Mbeki"
                className={!fullName.trim() ? "border-destructive" : ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company" className="flex items-center gap-1">
                Company Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Acme Corp"
                className={!company.trim() ? "border-destructive" : ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="jobTitle" className="flex items-center gap-1">
                Job Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="jobTitle"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Product Manager"
                className={!jobTitle.trim() ? "border-destructive" : ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department" className="flex items-center gap-1">
                Department <span className="text-destructive">*</span>
              </Label>
              <Input
                id="department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Engineering"
                className={!department.trim() ? "border-destructive" : ""}
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
