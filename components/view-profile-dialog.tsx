"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { User, Mail, Building2, Briefcase, Calendar, Shield, Globe } from "lucide-react"
import type { User as UserType } from "@/types/meeting"
import { SUPPORTED_LANGUAGES } from "@/components/language-selector"

interface ViewProfileDialogProps {
  user: UserType | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ViewProfileDialog({ user, open, onOpenChange }: ViewProfileDialogProps) {
  if (!user) return null

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDate = (timestamp: number | undefined) => {
    if (!timestamp) return "Unknown"
    try {
      return new Date(timestamp).toLocaleDateString("en-ZA", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch {
      return "Unknown"
    }
  }

  const getLanguageName = (code: string | undefined) => {
    if (!code) return "Not set"
    const language = SUPPORTED_LANGUAGES.find((l) => l.code === code)
    return language ? language.name : code
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Profile
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Profile Header */}
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-primary/20">
              <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                {getInitials(user.displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground">{user.displayName}</h3>
              {user.isAdmin && (
                <Badge variant="secondary" className="mt-1 gap-1">
                  <Shield className="h-3 w-3" />
                  Administrator
                </Badge>
              )}
            </div>
          </div>

          <Separator />

          {/* Contact Information */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Contact Information</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">{user.email}</span>
              </div>
              {user.fullName && (
                <div className="flex items-center gap-3 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{user.fullName}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Professional Information */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Professional Information</h4>
            <div className="space-y-2">
              {user.company && (
                <div className="flex items-center gap-3 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-foreground">{user.company}</p>
                    <p className="text-xs text-muted-foreground">Company</p>
                  </div>
                </div>
              )}
              {user.jobTitle && (
                <div className="flex items-center gap-3 text-sm">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-foreground">{user.jobTitle}</p>
                    <p className="text-xs text-muted-foreground">
                      {user.department ? `${user.department} Department` : "Job Title"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Preferences & Account Info */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Preferences & Account</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-foreground">{getLanguageName(user.preferredLanguage)}</p>
                  <p className="text-xs text-muted-foreground">Preferred Language</p>
                </div>
              </div>
              {user.createdAt && (
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-foreground">{formatDate(user.createdAt)}</p>
                    <p className="text-xs text-muted-foreground">Member Since</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
