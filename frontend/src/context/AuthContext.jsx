import { createContext, useContext, useState, useCallback } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(null)
  const [user, setUser] = useState(null)

  const login = useCallback((token, userData) => {
    setAccessToken(token)
    setUser(userData)
  }, [])

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    } catch { /* ignore network errors on logout */ }
    setAccessToken(null)
    setUser(null)
  }, [])

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        const meRes = await fetch('/api/user/me', {
          headers: { Authorization: `Bearer ${data.accessToken}` },
          credentials: 'include',
        })
        if (meRes.ok) {
          const meData = await meRes.json()
          setAccessToken(data.accessToken)
          setUser(meData.user)
          return true
        }
      }
    } catch { /* no valid refresh token */ }
    return false
  }, [])

  return (
    <AuthContext.Provider value={{ accessToken, user, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
