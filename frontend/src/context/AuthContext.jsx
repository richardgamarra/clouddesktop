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
  const cryptoKeyRef = useRef(null)

  async function fetchAndHydrate(key, token) {
    try {
      const res = await fetch('/api/settings', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const { encrypted_blob, iv } = await res.json()
      if (encrypted_blob && iv) {
        const settings = await decryptSettings(key, encrypted_blob, iv)
        hydrateLocalStorage(settings)
      } else {
        const blob = await encryptSettings(key)
        await fetch('/api/settings/sync', {
          method:  'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body:    JSON.stringify(blob),
        })
      }
    } catch (err) {
      console.error('fetchAndHydrate error:', err.message)
    }
  }

  const login = useCallback(async (token, userData, password) => {
    setAccessToken(token)
    setUser(userData)

    if (password) {
      try {
        const key = await deriveKey(password, userData.id)
        cryptoKeyRef.current = key
        const exported = await exportCryptoKey(key)
        sessionStorage.setItem(SESSION_KEY, exported)
        await fetchAndHydrate(key, token)
        setSyncReady(true)
      } catch (err) {
        console.error('login sync init failed:', err.message)
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    } catch {}
    cryptoKeyRef.current = null
    sessionStorage.removeItem(SESSION_KEY)
    setSyncReady(false)
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

      const stored = sessionStorage.getItem(SESSION_KEY)
      if (stored) {
        try {
          const key = await importCryptoKey(stored)
          cryptoKeyRef.current = key
          await fetchAndHydrate(key, data.accessToken)
          setSyncReady(true)
        } catch (err) {
          console.error('refresh key restore failed:', err.message)
        }
      }

      return true
    } catch {
      return false
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const sync = useCallback(async (token) => {
    if (!cryptoKeyRef.current || !token) return
    try {
      const blob = await encryptSettings(cryptoKeyRef.current)
      await fetch('/api/settings/sync', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify(blob),
      })
    } catch (err) {
      console.error('sync error:', err.message)
    }
  }, [])

  return (
    <AuthContext.Provider value={{
      accessToken, user, login, logout, refresh, sync, syncReady,
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
