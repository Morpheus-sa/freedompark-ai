import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "./firebase"
import type { ActivityType } from "@/types/activity-log"

export async function logActivity(
  userId: string,
  userEmail: string,
  userName: string,
  activityType: ActivityType,
  description: string,
  metadata?: Record<string, any>,
) {
  try {
    console.log(" Logging activity:", { userId, activityType, description })

    await addDoc(collection(db, "activityLogs"), {
      userId,
      userEmail,
      userName,
      activityType,
      description,
      metadata: metadata || {},
      timestamp: Date.now(),
      createdAt: serverTimestamp(),
    })

    console.log("Activity logged successfully")
  } catch (error) {
    console.error("Error logging activity:", error)
    // Don't throw error to prevent disrupting user flow
  }
}
