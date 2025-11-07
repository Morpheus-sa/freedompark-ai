"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { sendEmailVerification, applyActionCode } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { Mail, AlertCircle } from "lucide-react"

interface EmailVerificationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onVerified?: () => void
}

export function EmailVerificationDialog({ open, onOpenChange, onVerified }: EmailVerificationDialogProps) {
  const [verificationCode, setVerificationCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const { toast } = useToast()

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleSendVerification = async () => {
    if (!auth.currentUser) return

    setLoading(true)
    try {
      await sendEmailVerification(auth.currentUser)
      setEmailSent(true)
      setCountdown(60) // 60 second cooldown
      toast({
        title: "Verification email sent",
        description: "Check your email for the verification code.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send verification email",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await applyActionCode(auth, verificationCode)
      toast({
        title: "Email verified",
        description: "Your email has been successfully verified!",
      })
      onVerified?.()
      onOpenChange(false)
    } catch (error: any) {
      toast({
        title: "Invalid code",
        description: error.message || "The verification code is invalid or expired",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Verify Your Email</DialogTitle>
          <DialogDescription>We need to verify your email address to complete your registration.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!auth.currentUser?.emailVerified && (
            <Alert className="border-yellow-500/50 bg-yellow-500/10">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <AlertDescription className="text-foreground">
                Your email address is not verified. Please verify to access all features.
              </AlertDescription>
            </Alert>
          )}

          {emailSent ? (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="verification-code">Verification Code</Label>
                <Input
                  id="verification-code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Enter code from email"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Verifying..." : "Verify Email"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full bg-transparent"
                onClick={handleSendVerification}
                disabled={countdown > 0}
              >
                {countdown > 0 ? `Resend in ${countdown}s` : "Resend Verification Email"}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg border p-4">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Email Address</p>
                  <p className="text-sm text-muted-foreground">{auth.currentUser?.email}</p>
                </div>
              </div>
              <Button onClick={handleSendVerification} className="w-full" disabled={loading}>
                {loading ? "Sending..." : "Send Verification Email"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
