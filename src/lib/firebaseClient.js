/**
 * Order Flow — Firebase Client
 *
 * Initializes Firebase using environment variables.
 * If any required variable is missing, all exports are null and the app
 * falls back to demo mode automatically.
 *
 * SECURITY NOTES:
 * - Firebase API keys are publishable — they identify your project but do not
 *   grant access. Security is enforced entirely by Firestore Security Rules
 *   and Storage Security Rules configured in your Firebase project.
 * - Never put a Firebase Admin SDK service account key in this file or
 *   anywhere under src/.
 */

import { initializeApp, getApps } from 'firebase/app'
import { getAuth }                 from 'firebase/auth'
import { getFirestore }            from 'firebase/firestore'
import { getStorage }              from 'firebase/storage'

const {
  VITE_FIREBASE_API_KEY:              apiKey,
  VITE_FIREBASE_AUTH_DOMAIN:          authDomain,
  VITE_FIREBASE_PROJECT_ID:           projectId,
  VITE_FIREBASE_STORAGE_BUCKET:       storageBucket,
  VITE_FIREBASE_MESSAGING_SENDER_ID:  messagingSenderId,
  VITE_FIREBASE_APP_ID:               appId,
} = import.meta.env

const isConfigured = !!(apiKey && authDomain && projectId && storageBucket && messagingSenderId && appId)

let firebaseApp  = null
let firebaseAuth = null
let firestore    = null
let storage      = null

if (isConfigured) {
  // Avoid re-initializing during hot-module reload
  firebaseApp  = getApps().length ? getApps()[0] : initializeApp({ apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId })
  firebaseAuth = getAuth(firebaseApp)
  firestore    = getFirestore(firebaseApp)
  storage      = getStorage(firebaseApp)
} else {
  console.warn(
    '[OrderFlow] Firebase is not configured. ' +
    'Copy .env.example to .env and supply all VITE_FIREBASE_* variables. ' +
    'The app will run in demo mode until credentials are provided.'
  )
}

export { firebaseAuth, firestore, storage }
export const isFirebaseConfigured = isConfigured
