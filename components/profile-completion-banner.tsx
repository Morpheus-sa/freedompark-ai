"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle, X } from "lucide-react"
import { ProfileSettingsDialog } from "./profile-settings-dialog"

export function ProfileCompletionBanner() {
  const { user } = useAuth()
  const [dismissed, setDismissed] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Check if profile is incomplete
  const isProfileIncomplete =
    user && (!user.fullName?.trim() || !user.company?.trim() || !user.jobTitle?.trim() || !user.department?.trim())

  if (!isProfileIncomplete || dismissed) {
    return null
  }

  return (
    <>
      <Alert variant="destructive" className="relative">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Complete Your Profile</AlertTitle>
        <AlertDescription className="flex items-center justify-between gap-4">
          <span>Please complete your professional profile to get the best experience.</span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setSettingsOpen(true)}>
              Complete Now
            </Button>
            <button
              onClick={() => setDismissed(true)}
              className="text-destructive-foreground/70 hover:text-destructive-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </AlertDescription>
      </Alert>

      <ProfileSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  )
}
