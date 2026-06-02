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

  // ── initSync: fetch + decrypt cloud settings WITHOUT applying them
  // Returns the decrypted settings object for the caller to decide what to do,
  // or null if no cloud data exists.
  const initSync = useCallback(async (token) => {
    let key = null

    // Case 1: fresh login with password
    if (pendingPassword.current) {
      const { password, userId } = pendingPassword.current
      pendingPassword.current = null
      setSyncStatus('syncing')
      try {
        key = await deriveKey(password, userId)
        cryptoKeyRef.current = key
        sessionStorage.setItem(SESSION_KEY, await exportCryptoKey(key))
      } catch (err) {
        console.error('initSync key derivation error:', err.message)
        setSyncStatus('error')
        return null
      }
    }

    // Case 2: page refresh — restore key from sessionStorage
    if (!key) {
      const stored = sessionStorage.getItem(SESSION_KEY)
      if (!stored) return null
      setSyncStatus('syncing')
      try {
        key = await importCryptoKey(stored)
        cryptoKeyRef.current = key
      } catch (err) {
        console.error('initSync key import error:', err.message)
        setSyncStatus('error')
        return null
      }
    }

    // Fetch + decrypt — return settings WITHOUT hydrating (caller decides)
    try {
      const res = await fetch('/api/settings', { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) { setSyncReady(true); setSyncStatus('synced'); return null }
      const { encrypted_blob, iv } = await res.json()
      if (!encrypted_blob || !iv) { setSyncReady(true); setSyncStatus('synced'); return null }
      const settings = await decryptSettings(key, encrypted_blob, iv)
      setSyncReady(true)
      setSyncStatus('synced')
      return settings // caller calls hydrateLocalStorage() + reload
    } catch (err) {
      console.error('initSync fetch/decrypt error:', err.message)
      setSyncStatus('error')
      return null
    }
  }, [])

  // ── logout: auto-sync before logging out so latest changes are saved ──────────
  const logout = useCallback(async (token) => {
    // Final sync before logout to capture any unsaved changes (icons, tab order, etc.)
    if (cryptoKeyRef.current && token) {
      try {
        const { encryptSettings } = await import('../lib/crypto')
        const blob = await encryptSettings(cryptoKeyRef.current)
        await fetch('/api/settings/sync', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(blob),
        })
      } catch (err) {
        console.error('pre-logout sync failed:', err.message)
      }
    }
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    } catch {}
    cryptoKeyRef.current = null
    pendingPassword.current = null
    sessionStorage.removeItem(SESSION_KEY)
    sessionStorage.removeItem('cw_synced')
    // Clear workspace localStorage — keep wsh_last_user_id so next login knows who was here
    const { SYNC_KEYS } = await import('../lib/crypto')
    SYNC_KEYS.forEach(k => localStorage.removeItem(k))
    Object.keys(localStorage).filter(k => k.startsWith('wsh_notes_')).forEach(k => localStorage.removeItem(k))
    // Clear wsh_ keys EXCEPT wsh_last_user_id and wsh_theme (theme persists between users)
    Object.keys(localStorage).filter(k => k.startsWith('wsh_') && k !== 'wsh_last_user_id' && k !== 'wsh_theme').forEach(k => localStorage.removeItem(k))
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
