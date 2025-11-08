export type NotificationType =
  | "meeting_invitation"
  | "meeting_started"
  | "meeting_ended"
  | "participant_added"
  | "meeting_scheduled"
  | "meeting_reminder"
  | "meeting_updated"

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  meetingId?: string
  meetingTitle?: string
  meetingCode?: string
  createdAt: number
  read: boolean
  actionUrl?: string
}
