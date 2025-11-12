"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { AuthDialog } from "@/components/auth-dialog"
import { MeetingRoomList } from "@/components/meeting-room-list"
import { JoinMeetingDialog } from "@/components/join-meeting-dialog"
import { ScheduleMeetingDialog } from "@/components/schedule-meeting-dialog"
import { CollaborativeMeetingRecorder } from "@/components/collaborative-meeting-recorder"
import { PastMeetingsList } from "@/components/past-meetings-list"
import { AdminDashboard } from "@/components/admin-dashboard"
import { ProfileSettingsDialog } from "@/components/profile-settings-dialog"
import { LandingHero } from "@/components/landing-hero"
import { AnimatedBackground } from "@/components/animated-background"
import { NotificationCenter } from "@/components/notification-center"
import { ProfileCompletionBanner } from "@/components/profile-completion-banner"
import { UserDashboard } from "@/components/user-dashboard"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { LogOut, Shield, Settings } from "lucide-react"
import { ScheduledMeetingsList } from "@/components/scheduled-meetings-list"
import { ThemeToggle } from "@/components/theme-toggle"
import Image from "next/image"


export default function Home() {
  const { user, signOut } = useAuth()
  const [authDialogOpen, setAuthDialogOpen] = useState(false)
  const [joinDialogOpen, setJoinDialogOpen] = useState(false)
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false)
  const [profileDialogOpen, setProfileDialogOpen] = useState(false)
  const [activeMeetingId, setActiveMeetingId] = useState<string | null>(null)

  const handleJoinMeeting = (meetingId: string) => {
    setActiveMeetingId(meetingId)
  }

  const handleEndMeeting = () => {
    setActiveMeetingId(null)
  }

  if (!user) {
    return (
      <>
        <LandingHero onGetStarted={() => setAuthDialogOpen(true)} />
        <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
      </>
    )
  }

  return (
    <div className="relative min-h-screen bg-background">
      <AnimatedBackground
        className="fixed inset-0 z-0"
        opacity={0.2}
        particleCount={40}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Image
                src="/freedom-park-logo.png"
                alt="Freedom Park"
                width={120}
                height={80}
                className="h-36 w-auto object-contain"
              />
              <div className="flex-1 text-center">
                <h1 className="mb-3 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                  AI Meeting Notes
                </h1>
                <p className="text-lg text-muted-foreground">
                  Collaborative real-time meeting transcription with AI
                </p>
              </div>
            </div>
            {user && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {user.displayName}
                  </span>
                  {user.isAdmin && (
                    <Badge variant="secondary" className="gap-1">
                      <Shield className="h-3 w-3" />
                      Admin
                    </Badge>
                  )}
                </div>
                <ThemeToggle />
                <NotificationCenter />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setProfileDialogOpen(true)}
                  title="Profile Settings"
                >
                  <Settings className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => signOut()}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </header>

        <div className="mx-auto max-w-4xl mb-6">
          <ProfileCompletionBanner />
        </div>

        {activeMeetingId ? (
          <div className="mx-auto max-w-4xl">
            <CollaborativeMeetingRecorder
              meetingId={activeMeetingId}
              onEndMeeting={handleEndMeeting}
            />
          </div>
        ) : (
          <div className="mx-auto max-w-4xl">
            <Tabs
              defaultValue={user.isAdmin ? "admin" : "dashboard"}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <TabsList>
                  {user.isAdmin && (
                    <TabsTrigger value="admin">Admin Dashboard</TabsTrigger>
                  )}
                  <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                  <TabsTrigger value="active">Active Meetings</TabsTrigger>
                  <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
                  <TabsTrigger value="past">Past Meetings</TabsTrigger>
                </TabsList>
                <Button
                  variant="outline"
                  onClick={() => setJoinDialogOpen(true)}
                >
                  Join with ID
                </Button>
              </div>

              {user.isAdmin && (
                <TabsContent value="admin">
                  <AdminDashboard />
                </TabsContent>
              )}

              <TabsContent value="dashboard">
                <UserDashboard />
              </TabsContent>

              <TabsContent value="active" className="space-y-4">
                <MeetingRoomList onJoinMeeting={handleJoinMeeting} />
              </TabsContent>

              <TabsContent value="scheduled">
                <ScheduledMeetingsList onStartMeeting={handleJoinMeeting} />
              </TabsContent>

              <TabsContent value="past">
                <PastMeetingsList />
              </TabsContent>
            </Tabs>
          </div>
        )}

        <JoinMeetingDialog
          open={joinDialogOpen}
          onOpenChange={setJoinDialogOpen}
          onJoinSuccess={handleJoinMeeting}
        />
        <ScheduleMeetingDialog
          open={scheduleDialogOpen}
          onOpenChange={setScheduleDialogOpen}
        />
        <ProfileSettingsDialog
          open={profileDialogOpen}
          onOpenChange={setProfileDialogOpen}
        />
      </div>
    </div>
  );
}
