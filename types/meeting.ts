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
}

export interface Meeting {
  id: string
  title: string
  createdAt: number
  createdBy: string
  participants: string[]
  transcript: TranscriptSegment[]
  isActive: boolean
  summary?: {
    overview: string
    keyPoints: string[]
    actionItems: string[]
    decisions: string[]
    speakerContributions: Record<string, string>
  }
}

export interface User {
  uid: string
  email: string
  displayName: string
  photoURL?: string
}
