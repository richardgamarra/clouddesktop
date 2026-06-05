import { createContext, useContext, useState, useCallback } from 'react'
import { collectSettings, hydrateLocalStorage, SYNC_KEYS } from '../lib/crypto'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(null)
  const [user, setUser]               = useState(null)
  const [syncReady, setSyncReady]     = useState(false)
  const [syncStatus, setSyncStatus]   = useState('idle')

  const login = useCallback((token, userData) => {
    setAccessToken(token)
    setUser(userData)
  }, [])

  // Fetch cloud settings and hydrate localStorage immediately — no prompt, no crypto
  const initSync = useCallback(async (token) => {
    setSyncStatus('syncing')
    try {
      const res = await fetch('/api/settings', { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) { setSyncReady(true); setSyncStatus('synced'); return null }
      const { settings } = await res.json()
      if (settings && typeof settings === 'object' && Object.keys(settings).length > 0) {
        hydrateLocalStorage(settings)
        setSyncReady(true)
        setSyncStatus('synced')
        return settings
      }
      setSyncReady(true)
      setSyncStatus('synced')
      return null
    } catch (err) {
      console.error('initSync error:', err.message)
      setSyncReady(true)
      setSyncStatus('error')
      return null
    }
  }, [])

  // Upload current localStorage to cloud as plain JSON
  const sync = useCallback(async (token) => {
    if (!token) return
    setSyncStatus('syncing')
    try {
      const settings = collectSettings()
      const res = await fetch('/api/settings/sync', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ settings }),
      })
      if (!res.ok) {
        const body = await res.text().catch(() => '')
        throw new Error(`sync failed ${res.status}: ${body}`)
      }
      setSyncStatus('synced')
    } catch (err) {
      console.error('sync error:', err.message)
      setSyncStatus('error')
      throw err  // re-throw so callers (handleManualSave) can show error
    }
  }, [])

  const logout = useCallback(async (token) => {
    // Final sync before logout
    if (token) {
      try {
        const settings = collectSettings()
        await fetch('/api/settings/sync', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ settings }),
        })
      } catch (err) {
        console.error('pre-logout sync failed:', err.message)
      }
    }
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    } catch {}
    sessionStorage.removeItem('cw_synced')
    // Clear workspace localStorage on logout
    SYNC_KEYS.forEach(k => localStorage.removeItem(k))
    Object.keys(localStorage).filter(k => k.startsWith('wsh_notes_')).forEach(k => localStorage.removeItem(k))
    Object.keys(localStorage).filter(k => k.startsWith('wsh_') && k !== 'wsh_last_user_id' && k !== 'wsh_theme').forEach(k => localStorage.removeItem(k))
    setSyncReady(false)
    setSyncStatus('idle')
    setAccessToken(null)
    setUser(null)
  }, [])

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' })
      if (!res.ok) return false
      const data = await res.json()
      const meRes = await fetch('/api/user/me', {
        headers: { Authorization: `Bearer ${data.accessToken}` },
        credentials: 'include',
      })
      if (!meRes.ok) return false
      const meData = await meRes.json()
      setAccessToken(data.accessToken)
      setUser(meData.user)
      return true
    } catch {
      return false
    }
  }, [])

  return (
    <AuthContext.Provider value={{
      accessToken, user, login, logout, refresh, sync, syncReady, syncStatus, initSync,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
