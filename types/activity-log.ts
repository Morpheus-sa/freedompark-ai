export type ActivityType =
  | "user_login"
  | "user_logout"
  | "meeting_created"
  | "meeting_joined"
  | "meeting_ended"
  | "meeting_scheduled"
  | "meeting_cancelled"
  | "meeting_edited"
  | "user_profile_updated"
  | "user_created"
  | "user_role_changed"
  | "meeting_summary_edited"
  | "meeting_shared"
  | "meeting_deleted"

export interface ActivityLog {
  id: string
  userId: string
  userEmail: string
  userName: string
  activityType: ActivityType
  description: string
  metadata?: {
    meetingId?: string
    meetingTitle?: string
    targetUserId?: string
    targetUserEmail?: string
    changes?: Record<string, any>
  }
  timestamp: number
  ipAddress?: string
}
