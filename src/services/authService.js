/**
 * Order Flow — Auth Service (Firebase)
 *
 * Wraps Firebase Authentication. When Firebase is not configured,
 * all functions return demo-mode responses.
 */

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { firebaseAuth, firestore, isFirebaseConfigured } from '../lib/firebaseClient.js'

// ─── Sign In ──────────────────────────────────────────────────────────────────

export async function signInWithEmail(email, password) {
  if (!isFirebaseConfigured) {
    return { user: null, error: new Error('Firebase is not configured. Using demo mode.') }
  }
  try {
    const cred = await signInWithEmailAndPassword(firebaseAuth, email, password)
    return { user: cred.user, error: null }
  } catch (e) {
    return { user: null, error: e }
  }
}

// ─── Sign Up ──────────────────────────────────────────────────────────────────

export async function signUp(email, password, displayName) {
  if (!isFirebaseConfigured) {
    return { user: null, error: new Error('Firebase is not configured. Using demo mode.') }
  }
  try {
    const cred = await createUserWithEmailAndPassword(firebaseAuth, email, password)
    if (displayName) await updateProfile(cred.user, { displayName })
    return { user: cred.user, error: null }
  } catch (e) {
    return { user: null, error: e }
  }
}

// ─── Sign Out ─────────────────────────────────────────────────────────────────

export async function signOut() {
  if (!isFirebaseConfigured) return { error: null }
  try {
    await firebaseSignOut(firebaseAuth)
    return { error: null }
  } catch (e) {
    return { error: e }
  }
}

// ─── Auth State Listener ──────────────────────────────────────────────────────

/**
 * Subscribe to auth state changes.
 * Callback receives the Firebase User object or null.
 * Returns an unsubscribe function.
 */
export function onAuthStateChange(callback) {
  if (!isFirebaseConfigured) return () => {}
  return onAuthStateChanged(firebaseAuth, callback)
}

// ─── Password Reset ───────────────────────────────────────────────────────────

export async function sendPasswordReset(email) {
  if (!isFirebaseConfigured) {
    return { error: new Error('Firebase is not configured.') }
  }
  try {
    await sendPasswordResetEmail(firebaseAuth, email)
    return { error: null }
  } catch (e) {
    return { error: e }
  }
}

// ─── Get current user ─────────────────────────────────────────────────────────

export function getCurrentUser() {
  if (!isFirebaseConfigured) return null
  return firebaseAuth.currentUser ?? null
}

// ─── Get org membership ───────────────────────────────────────────────────────

/**
 * Fetch the org membership record for a user.
 * Stored at: organizations/{orgId}/members/{userId}
 *
 * Because a user may belong to one org in this version, we look up the
 * user's profile document first to get their orgId.
 *
 * User profile stored at: users/{userId}  → { orgId, role, displayName }
 *
 * Returns { orgId, role } or null.
 */
export async function getCurrentOrgMembership(userId) {
  if (!isFirebaseConfigured || !userId) return null
  try {
    const profileSnap = await getDoc(doc(firestore, 'users', userId))
    if (!profileSnap.exists()) return null
    const { orgId, role } = profileSnap.data()
    if (!orgId || !role) return null
    return { orgId, role }
  } catch (e) {
    console.error('[authService] getCurrentOrgMembership:', e)
    return null
  }
}
