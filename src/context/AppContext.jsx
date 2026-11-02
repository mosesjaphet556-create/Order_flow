/**
 * Order Flow — App Provider (Firebase)
 *
 * When Firebase is configured: uses onAuthStateChanged for real auth.
 * When not configured: demo role selector (original behaviour).
 */
import { useState, useEffect, useCallback } from 'react'
import { AppContext } from './appContextObject.js'
import { isFirebaseConfigured } from '../lib/firebaseClient.js'
import { onAuthStateChange, getCurrentOrgMembership, signOut as authSignOut } from '../services/authService.js'
import { getAllDeliveries, getDeliveryStats, subscribeToDeliveries } from '../services/deliveryService.js'
import { DEMO_USERS } from '../data/demoData.js'

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [orgId, setOrgId]             = useState(null)
  const [deliveries, setDeliveries]   = useState([])
  const [stats, setStats]             = useState(null)
  const [authLoading, setAuthLoading] = useState(isFirebaseConfigured)

  const refresh = useCallback(async (oid) => {
    const resolvedOrgId = oid ?? orgId
    const [list, s] = await Promise.all([
      getAllDeliveries(),
      getDeliveryStats(resolvedOrgId),
    ])
    setDeliveries(list)
    setStats(s)
  }, [orgId])

  // Subscribe to demo pub/sub notifications
  useEffect(() => {
    refresh()
    return subscribeToDeliveries(() => refresh())
  }, [refresh])

  // Firebase auth state listener
  useEffect(() => {
    if (!isFirebaseConfigured) { setAuthLoading(false); return }

    const unsub = onAuthStateChange(async (firebaseUser) => {
      if (!firebaseUser) {
        setCurrentUser(null)
        setOrgId(null)
        setAuthLoading(false)
        return
      }
      const membership = await getCurrentOrgMembership(firebaseUser.uid)
      const oid = membership?.orgId ?? null
      setOrgId(oid)
      setCurrentUser({
        id:     firebaseUser.uid,
        name:   firebaseUser.displayName || firebaseUser.email,
        email:  firebaseUser.email,
        role:   membership?.role ?? 'dispatcher',
        avatar: (firebaseUser.displayName || firebaseUser.email || '?').slice(0, 2).toUpperCase(),
        isDemo: false,
      })
      setAuthLoading(false)
      refresh(oid)
    })
    return unsub
  }, []) // eslint-disable-line

  const signIn = useCallback((roleKey) => {
    if (isFirebaseConfigured) return
    const user = DEMO_USERS[roleKey]
    if (user) setCurrentUser(user)
  }, [])

  const signOut = useCallback(async () => {
    if (isFirebaseConfigured) await authSignOut()
    setCurrentUser(null)
    setOrgId(null)
  }, [])

  return (
    <AppContext.Provider value={{ currentUser, orgId, deliveries, stats, refresh, signIn, signOut, authLoading, isLive: isFirebaseConfigured }}>
      {children}
    </AppContext.Provider>
  )
}
