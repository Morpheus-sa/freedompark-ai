import { collection, addDoc, Timestamp, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Notification, NotificationType } from "@/types/notification"

export async function sendNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  metadata?: {
    meetingId?: string
    meetingTitle?: string
    meetingCode?: string
    actionUrl?: string
  },
) {
  try {
    const notificationData: any = {
      userId,
      type,
      title,
      message,
      createdAt: Timestamp.now().toMillis(),
      read: false,
    }

    // Add optional metadata fields only if they exist
    if (metadata?.meetingId) notificationData.meetingId = metadata.meetingId
    if (metadata?.meetingTitle) notificationData.meetingTitle = metadata.meetingTitle
    if (metadata?.meetingCode) notificationData.meetingCode = metadata.meetingCode
    if (metadata?.actionUrl) notificationData.actionUrl = metadata.actionUrl

    await addDoc(collection(db, "notifications"), notificationData)
    console.log("Notification sent:", { userId, type, title })
  } catch (error) {
    console.error("Error sending notification:", error)
  }
}

export async function markNotificationAsRead(notificationId: string) {
  try {
    await updateDoc(doc(db, "notifications", notificationId), {
      read: true,
    })
  } catch (error) {
    console.error("Error marking notification as read:", error)
  }
}

export function subscribeToUserNotifications(userId: string, callback: (notifications: Notification[]) => void) {
  const q = query(collection(db, "notifications"), where("userId", "==", userId))

  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Notification[]

    // Sort by creation date, newest first
    notifications.sort((a, b) => b.createdAt - a.createdAt)

    callback(notifications)
  })
}
