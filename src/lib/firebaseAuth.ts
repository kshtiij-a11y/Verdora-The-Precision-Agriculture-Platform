
"use client";

import { getAuth, signInAnonymously } from "firebase/auth";
import { app } from "./firebase";

/**
 * Ensures that the user is authenticated, signing them in anonymously if necessary.
 * This function should be called before any Firestore operation that requires authentication.
 */
export async function ensureAuth() {
  const auth = getAuth(app);
  if (!auth.currentUser) {
    try {
      await signInAnonymously(auth);
      console.log("User signed in anonymously.");
    } catch (error) {
      console.error("Anonymous sign-in failed:", error);
      throw new Error("Firebase anonymous sign-in failed. Enable Anonymous sign-in in Firebase Authentication and check authorized domains.");
    }
  }
}
