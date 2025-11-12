"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
  type User as FirebaseUser,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { User } from "@/types/meeting";
import { isAdminEmail } from "@/lib/admin-config";
import { logActivity } from "@/lib/activity-logger";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    displayName: string,
    additionalFields?: {
      fullName?: string;
      company?: string;
      jobTitle?: string;
      department?: string;
    }
  ) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  verifyEmail: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (firebaseUser: FirebaseUser): Promise<User> => {
    console.log("Fetching user data from Firestore for:", firebaseUser.uid);

    try {
      const userRef = doc(db, "users", firebaseUser.uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const firestoreData = userDoc.data();
        console.log(" Firestore data retrieved:", firestoreData);

        // Merge Firestore data with Firebase Auth data
        const completeUserData: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
          displayName:
            firebaseUser.displayName ||
            firestoreData.displayName ||
            "Anonymous",
          ...(firebaseUser.photoURL && { photoURL: firebaseUser.photoURL }),
          isAdmin: firestoreData.isAdmin || false,
          createdAt: firestoreData.createdAt || Date.now(),
          fullName: firestoreData.fullName || "",
          company: firestoreData.company || "",
          jobTitle: firestoreData.jobTitle || "",
          department: firestoreData.department || "",
        };

        console.log("Complete user data assembled:", completeUserData);
        return completeUserData;
      } else {
        console.log("User document doesn't exist, creating new one");
        // Document doesn't exist, create it
        const isAdmin = isAdminEmail(firebaseUser.email || "");
        const newUserData: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
          displayName: firebaseUser.displayName || "Anonymous",
          ...(firebaseUser.photoURL && { photoURL: firebaseUser.photoURL }),
          isAdmin,
          createdAt: Date.now(),
          fullName: "",
          company: "",
          jobTitle: "",
          department: "",
        };

        await setDoc(userRef, newUserData);
        console.log("New user document created");
        return newUserData;
      }
    } catch (error) {
      console.error("Error fetching user data from Firestore:", error);
      // Fallback to basic Firebase Auth data
      const isAdmin = isAdminEmail(firebaseUser.email || "");
      return {
        uid: firebaseUser.uid,
        email: firebaseUser.email || "",
        displayName: firebaseUser.displayName || "Anonymous",
        ...(firebaseUser.photoURL && { photoURL: firebaseUser.photoURL }),
        isAdmin,
        createdAt: Date.now(),
        fullName: "",
        company: "",
        jobTitle: "",
        department: "",
      };
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser: FirebaseUser | null) => {
        console.log("Auth state changed:", firebaseUser?.email || "signed out");

        if (firebaseUser) {
          const completeUserData = await fetchUserData(firebaseUser);
          setUser(completeUserData);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    await logActivity(
      userCredential.user.uid,
      userCredential.user.email || "",
      userCredential.user.displayName || "Anonymous",
      "user_login",
      `${userCredential.user.displayName || "User"} logged in`
    );
  };

  const signUp = async (
    email: string,
    password: string,
    displayName: string,
    additionalFields?: {
      fullName?: string;
      company?: string;
      jobTitle?: string;
      department?: string;
    }
  ) => {
    console.log("Signing up with additional fields:", additionalFields);

    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    await updateProfile(userCredential.user, { displayName });

    const isAdmin = isAdminEmail(userCredential.user.email || "");

    const userData: User = {
      uid: userCredential.user.uid,
      email: userCredential.user.email || "",
      displayName,
      isAdmin,
      createdAt: Date.now(),
      fullName: additionalFields?.fullName || "",
      company: additionalFields?.company || "",
      jobTitle: additionalFields?.jobTitle || "",
      department: additionalFields?.department || "",
    };

    try {
      console.log(
        "Creating user document with complete profile data:",
        userData
      );
      const userRef = doc(db, "users", userCredential.user.uid);
      await setDoc(userRef, userData);
      console.log("User document created successfully");

      await sendEmailVerification(userCredential.user);
      console.log("Verification email sent");

      await logActivity(
        userCredential.user.uid,
        userCredential.user.email || "",
        displayName,
        "user_created",
        `New user ${displayName} created an account`
      );
    } catch (error) {
      console.error(
        "Error creating user document or sending verification:",
        error
      );
      throw error;
    }
  };

  const signOut = async () => {
    if (user) {
      await logActivity(
        user.uid,
        user.email,
        user.displayName,
        "user_logout",
        `${user.displayName} logged out`
      );
    }

    await firebaseSignOut(auth);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const verifyEmail = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
  };

  const refreshUserData = async () => {
    if (auth.currentUser) {
      console.log("Manually refreshing user data");
      const completeUserData = await fetchUserData(auth.currentUser);
      setUser(completeUserData);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        verifyEmail,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
