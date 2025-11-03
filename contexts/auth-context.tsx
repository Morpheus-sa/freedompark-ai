"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  type User as FirebaseUser,
} from "firebase/auth"
import { doc, setDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import type { User } from "@/types/meeting"
import { isAdminEmail } from "@/lib/admin-config"

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (
    email: string,
    password: string,
    displayName: string,
    additionalFields?: {
      fullName?: string
      company?: string
      jobTitle?: string
      department?: string
    },
  ) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const isAdmin = isAdminEmail(firebaseUser.email || "")

        const userData: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
          displayName: firebaseUser.displayName || "Anonymous",
          ...(firebaseUser.photoURL && { photoURL: firebaseUser.photoURL }),
          isAdmin,
          createdAt: Date.now(),
        }

        try {
          console.log("[v0] Saving user data to Firestore:", { ...userData, isAdmin })
          const userRef = doc(db, "users", firebaseUser.uid)
          await setDoc(userRef, userData, { merge: true })
          console.log("[v0] User data saved successfully with admin status:", isAdmin)
        } catch (error) {
          console.error("[v0] Error saving user data to Firestore:", error)
        }

        setUser(userData)
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
    // User data will be saved in onAuthStateChanged
  }

  const signUp = async (
    email: string,
    password: string,
    displayName: string,
    additionalFields?: {
      fullName?: string
      company?: string
      jobTitle?: string
      department?: string
    },
  ) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(userCredential.user, { displayName })

    const isAdmin = isAdminEmail(userCredential.user.email || "")

    const userData: User = {
      uid: userCredential.user.uid,
      email: userCredential.user.email || "",
      displayName,
      isAdmin,
      createdAt: Date.now(),
      ...additionalFields,
    }

    try {
      console.log("[v0] Creating new user document in Firestore:", { ...userData, isAdmin })
      const userRef = doc(db, "users", userCredential.user.uid)
      await setDoc(userRef, userData)
      console.log("[v0] New user document created successfully with admin status:", isAdmin)
    } catch (error) {
      console.error("[v0] Error creating user document:", error)
    }
  }

  const signOut = async () => {
    await firebaseSignOut(auth)
  }

  return <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
