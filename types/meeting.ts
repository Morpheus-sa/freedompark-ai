export interface Speaker {
  id: string
  name: string
  color: string
}

export interface TranscriptSegment {
  id: string
  speakerId: string
  speakerName: string
  text: string
  timestamp: number
  isMuted?: boolean
}

export interface Meeting {
  id: string
  shareCode?: string
  title: string
  description?: string
  createdAt: number
  createdBy: string
  participants: string[]
  invitedParticipants?: string[]
  transcript: TranscriptSegment[]
  isActive: boolean
  isScheduled?: boolean
  scheduledFor?: number
  mutedParticipants?: string[]
  language?: string
  isDeleted?: boolean
  deletedAt?: number
  deletedBy?: string
  summary?: {
    overview: string
    keyPoints: string[]
    actionItems: string[]
    decisions: string[]
    speakerContributions: Array<{
      speaker: string
      contribution: string
    }>
  }
}

export interface User {
  uid: string
  email: string
  displayName: string
  photoURL?: string
  isAdmin?: boolean
  createdAt?: number
  fullName?: string
  company?: string
  jobTitle?: string
  department?: string
  preferredLanguage?: string
}
