"use client";

import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import type { Meeting } from "@/types/meeting";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Calendar,
  Clock,
  Users,
  TrendingUp,
  Sparkles,
  History,
  CalendarCheck,
  MessageSquare,
  Award,
} from "lucide-react";

export function UserDashboard() {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    console.log(" Setting up user dashboard listener");

    const q = query(
      collection(db, "meetings"),
      where("participants", "array-contains", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const meetingsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Meeting[];

        console.log(" Loaded user meetings:", meetingsData.length);
        setMeetings(meetingsData);
        setLoading(false);
      },
      (error) => {
        console.error(" Error loading user meetings:", error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user]);

  if (!user) return null;

  // Calculate statistics
  const stats = {
    totalMeetings: meetings.length,
    activeMeetings: meetings.filter((m) => m.isActive).length,
    scheduledMeetings: meetings.filter((m) => m.isScheduled && !m.isActive)
      .length,
    completedMeetings: meetings.filter((m) => !m.isActive && !m.isScheduled)
      .length,
    totalTranscripts: meetings.reduce(
      (sum, m) => sum + (m.transcript?.length || 0),
      0
    ),
    recentMeetings: meetings.filter(
      (m) => Date.now() - m.createdAt < 7 * 24 * 60 * 60 * 1000
    ).length,
    avgParticipants:
      meetings.length > 0
        ? (
            meetings.reduce((sum, m) => sum + m.participants.length, 0) /
            meetings.length
          ).toFixed(1)
        : "0",
  };

  // Get recent activity
  const recentMeetings = meetings
    .filter((m) => !m.isActive && !m.isScheduled)
    .slice(0, 3);

  const upcomingMeetings = meetings
    .filter((m) => m.isScheduled && !m.isActive)
    .slice(0, 3);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getActivityLevel = () => {
    if (stats.recentMeetings >= 5)
      return { label: "Very Active", color: "text-green-500", progress: 100 };
    if (stats.recentMeetings >= 3)
      return { label: "Active", color: "text-blue-500", progress: 75 };
    if (stats.recentMeetings >= 1)
      return { label: "Moderate", color: "text-yellow-500", progress: 50 };
    return { label: "Low Activity", color: "text-gray-500", progress: 25 };
  };

  const activityLevel = getActivityLevel();

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mb-2 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
            <p className="text-sm text-muted-foreground">
              Loading your dashboard...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10">
        <CardHeader>
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 border-2 border-primary/20">
              <AvatarFallback className="bg-primary/20 text-primary font-bold text-lg">
                {getInitials(user.displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-2xl mb-1">
                Welcome back, {user.displayName}!
              </CardTitle>
              <CardDescription className="text-base">
                {user.jobTitle && user.company
                  ? `${user.jobTitle} at ${user.company}`
                  : "Your personal meeting insights and analytics"}
              </CardDescription>
            </div>
            <Badge
              variant="secondary"
              className={`gap-1 ${activityLevel.color}`}
            >
              <TrendingUp className="h-3 w-3" />
              {activityLevel.label}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Statistics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Meetings
            </CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats.totalMeetings}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.completedMeetings} completed
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <CalendarCheck className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats.recentMeetings}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              meetings in last 7 days
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <Clock className="h-4 w-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats.scheduledMeetings}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              scheduled meetings
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collaboration</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats.avgParticipants}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              avg participants
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Activity Level Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Your Activity Level
          </CardTitle>
          <CardDescription>
            Based on your meeting participation in the last 7 days
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className={`text-sm font-medium ${activityLevel.color}`}>
              {activityLevel.label}
            </span>
            <span className="text-sm text-muted-foreground">
              {stats.recentMeetings} meetings this week
            </span>
          </div>
          <Progress value={activityLevel.progress} className="h-2" />
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Upcoming Meetings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Upcoming Meetings
            </CardTitle>
            <CardDescription>Your scheduled meetings</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingMeetings.length === 0 ? (
              <div className="py-8 text-center">
                <CalendarCheck className="mx-auto mb-3 h-10 w-10 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">
                  No upcoming meetings scheduled
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingMeetings.map((meeting) => (
                  <div
                    key={meeting.id}
                    className="rounded-lg border bg-card p-3 hover:bg-accent/5 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-foreground">
                        {meeting.title}
                      </h4>
                      <Badge variant="secondary" className="text-xs">
                        Scheduled
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {meeting.scheduledFor
                        ? new Date(meeting.scheduledFor).toLocaleString(
                            "en-ZA",
                            {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )
                        : "No date set"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Your latest meetings</CardDescription>
          </CardHeader>
          <CardContent>
            {recentMeetings.length === 0 ? (
              <div className="py-8 text-center">
                <History className="mx-auto mb-3 h-10 w-10 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">
                  No recent meetings
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentMeetings.map((meeting) => (
                  <div
                    key={meeting.id}
                    className="rounded-lg border bg-card p-3 hover:bg-accent/5 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-foreground">
                        {meeting.title}
                      </h4>
                      {meeting.summary && (
                        <Badge variant="outline" className="gap-1 text-xs">
                          <Sparkles className="h-3 w-3" />
                          AI Summary
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>
                        {new Date(meeting.createdAt).toLocaleDateString(
                          "en-ZA"
                        )}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {meeting.participants.length}
                      </span>
                      {meeting.transcript && meeting.transcript.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {meeting.transcript.length}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Summary */}
      {stats.totalTranscripts > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Your Impact
            </CardTitle>
            <CardDescription>
              Total contributions across all meetings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <p className="text-2xl font-bold text-foreground">
                  {stats.totalTranscripts}
                </p>
                <p className="text-xs text-muted-foreground">
                  Total transcript segments
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-foreground">
                  {stats.completedMeetings}
                </p>
                <p className="text-xs text-muted-foreground">
                  Completed meetings
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-foreground">
                  {stats.avgParticipants}
                </p>
                <p className="text-xs text-muted-foreground">
                  Average team size
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
