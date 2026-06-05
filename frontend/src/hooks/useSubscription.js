import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'

export function useSubscription() {
  const { accessToken, user } = useAuth()
  const [sub, setSub]         = useState(null)
  const [loading, setLoading] = useState(false)

  const isPro = user?.role === 'premium' || user?.role === 'admin'

  const fetch_ = useCallback(async () => {
    if (!accessToken) return
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/status', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) setSub(await res.json())
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  useEffect(() => { fetch_() }, [fetch_])

  async function openBillingPortal() {
    const res = await fetch('/api/stripe/portal', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
  }

  return { sub, loading, isPro, openBillingPortal, refresh: fetch_ }
}
