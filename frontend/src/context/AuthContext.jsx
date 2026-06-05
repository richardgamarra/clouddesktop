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

  // Fetch cloud settings and hydrate localStorage immediately
  const initSync = useCallback(async (token) => {
    setSyncStatus('syncing')
    const doFetch = async (t) => fetch('/api/settings', { headers: { Authorization: `Bearer ${t}` } })
    try {
      let res = await doFetch(token)
      if (res.status === 401) {
        const newToken = await refresh()
        if (!newToken) { setSyncReady(true); setSyncStatus('error'); return null }
        res = await doFetch(newToken)
      }
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
  }, [refresh])

  // Upload current localStorage to cloud as plain JSON
  // Auto-refreshes the access token once if it has expired (401)
  const sync = useCallback(async (token) => {
    if (!token) return
    setSyncStatus('syncing')
    const doUpload = async (t) => {
      const settings = collectSettings()
      return fetch('/api/settings/sync', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
        body: JSON.stringify({ settings }),
      })
    }
    try {
      let res = await doUpload(token)
      if (res.status === 401) {
        const newToken = await refresh()
        if (!newToken) throw new Error('session expired — please log in again')
        res = await doUpload(newToken)
      }
      if (!res.ok) {
        const body = await res.text().catch(() => '')
        throw new Error(`sync failed ${res.status}: ${body}`)
      }
      setSyncStatus('synced')
    } catch (err) {
      console.error('sync error:', err.message)
      setSyncStatus('error')
      throw err
    }
  }, [refresh])

  const logout = useCallback(async (token) => {
    // Final sync before logout — retry once with refreshed token if expired
    if (token) {
      try {
        const settings = collectSettings()
        const upload = (t) => fetch('/api/settings/sync', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
          body: JSON.stringify({ settings }),
        })
        let res = await upload(token)
        if (res.status === 401) {
          const newToken = await refresh()
          if (newToken) await upload(newToken)
        }
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

  // Returns new access token string on success, null on failure
  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' })
      if (!res.ok) return null
      const data = await res.json()
      const meRes = await fetch('/api/user/me', {
        headers: { Authorization: `Bearer ${data.accessToken}` },
        credentials: 'include',
      })
      if (!meRes.ok) return null
      const meData = await meRes.json()
      setAccessToken(data.accessToken)
      setUser(meData.user)
      return data.accessToken
    } catch {
      return null
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
