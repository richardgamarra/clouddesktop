import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AdminRoute({ children }) {
  const { user, accessToken, refresh } = useAuth()
  const [checking, setChecking] = useState(!accessToken)

  useEffect(() => {
    if (!accessToken) {
      refresh().finally(() => setChecking(false))
    }
  }, [accessToken, refresh])

  if (checking) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)' }}>
        <div style={{ color:'var(--text3)', fontFamily:"'DM Mono',monospace", fontSize:13 }}>Loading…</div>
      </div>
    )
  }

  if (!accessToken) return <Navigate to="/login" replace />
  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />
  return children
}
