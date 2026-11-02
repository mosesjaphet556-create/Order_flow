import { useContext } from 'react'
import { AppContext } from './appContextObject.js'

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
