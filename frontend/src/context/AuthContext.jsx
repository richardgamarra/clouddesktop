import { createContext, useContext, useState, useCallback, useRef } from 'react'
import {
  deriveKey, exportCryptoKey, importCryptoKey,
  encryptSettings, decryptSettings, hydrateLocalStorage,
  SESSION_KEY,
} from '../lib/crypto'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(null)
  const [user, setUser]               = useState(null)
  const [syncReady, setSyncReady]     = useState(false)
  const [syncStatus, setSyncStatus]   = useState('idle') // 'idle'|'syncing'|'synced'|'error'
  const cryptoKeyRef = useRef(null)
  const pendingPassword = useRef(null) // password stored briefly for post-login sync

  // ── login: instant — just sets state, stores password for post-login sync ────
  const login = useCallback((token, userData, password) => {
    setAccessToken(token)
    setUser(userData)
    if (password) pendingPassword.current = { password, userId: userData.id, token }
  }, [])

  // ── initSync: called by DashboardPage after mount ────────────────────────────
  // Returns true if cloud settings were loaded and localStorage was hydrated
  const initSync = useCallback(async (token) => {
    // Case 1: fresh login with password
    if (pendingPassword.current) {
      const { password, userId } = pendingPassword.current
      pendingPassword.current = null
      setSyncStatus('syncing')
      try {
        const key = await deriveKey(password, userId)
        cryptoKeyRef.current = key
        sessionStorage.setItem(SESSION_KEY, await exportCryptoKey(key))

        const res = await fetch('/api/settings', { headers: { Authorization: `Bearer ${token}` } })
        if (res.ok) {
          const { encrypted_blob, iv } = await res.json()
          if (encrypted_blob && iv) {
            // Has cloud data — decrypt, hydrate, reload so React re-reads localStorage
            const settings = await decryptSettings(key, encrypted_blob, iv)
            hydrateLocalStorage(settings)
            setSyncReady(true)
            setSyncStatus('synced')
            return true // caller should reload
          }
          // No cloud data yet — do NOT auto-upload (prevents wiping with empty/default data)
          // User must explicitly sync via the debounced effect after making changes
        }
        setSyncReady(true)
        setSyncStatus('synced')
      } catch (err) {
        console.error('initSync (login) error:', err.message)
        setSyncStatus('error')
      }
      return false
    }

    // Case 2: page refresh — restore key from sessionStorage
    const stored = sessionStorage.getItem(SESSION_KEY)
    if (stored) {
      setSyncStatus('syncing')
      try {
        const key = await importCryptoKey(stored)
        cryptoKeyRef.current = key
        const res = await fetch('/api/settings', { headers: { Authorization: `Bearer ${token}` } })
        if (res.ok) {
          const { encrypted_blob, iv } = await res.json()
          if (encrypted_blob && iv) {
            const settings = await decryptSettings(key, encrypted_blob, iv)
            hydrateLocalStorage(settings)
            setSyncReady(true)
            setSyncStatus('synced')
            return true // caller should reload
          }
        }
        setSyncReady(true)
        setSyncStatus('synced')
        return false
      } catch (err) {
        console.error('initSync (refresh) error:', err.message)
        setSyncStatus('error')
      }
    }
    return false
  }, [])

  // ── logout ────────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    } catch {}
    cryptoKeyRef.current = null
    pendingPassword.current = null
    sessionStorage.removeItem(SESSION_KEY)
    sessionStorage.removeItem('cw_synced')
    setSyncReady(false)
    setSyncStatus('idle')
    setAccessToken(null)
    setUser(null)
  }, [])

  // ── refresh (auto-login via cookie) ──────────────────────────────────────────
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

  // ── sync: encrypt and upload current settings ─────────────────────────────────
  const sync = useCallback(async (token) => {
    if (!cryptoKeyRef.current || !token) return
    try {
      const blob = await encryptSettings(cryptoKeyRef.current)
      await fetch('/api/settings/sync', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(blob),
      })
    } catch (err) {
      console.error('sync error:', err.message)
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
