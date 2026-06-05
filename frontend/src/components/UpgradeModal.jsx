import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function UpgradeModal({ onClose, reason }) {
  const { accessToken } = useAuth()
  const [loading, setLoading] = useState(null)
  const [error, setError]     = useState('')

  async function startCheckout(plan) {
    setLoading(plan)
    setError('')
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to start checkout')
      window.location.href = data.url
    } catch (err) {
      setError(err.message)
      setLoading(null)
    }
  }

  const overlay = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', zIndex: 1000,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
  }
  const card = {
    background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 16,
    padding: '32px 28px', maxWidth: 460, width: '100%', position: 'relative',
  }
  const planCard = (accent) => ({
    background: 'var(--s2)', border: `1.5px solid ${accent ? 'var(--accent)' : 'var(--border)'}`,
    borderRadius: 12, padding: '20px 20px 16px', flex: 1, position: 'relative',
  })
  const btn = (accent) => ({
    width: '100%', marginTop: 14, padding: '10px 0', borderRadius: 8, border: 'none',
    cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 13,
    background: accent ? 'var(--accent)' : 'var(--s4)',
    color: accent ? '#fff' : 'var(--text)',
    opacity: loading ? 0.7 : 1,
  })

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={card}>
        <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 16, background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text3)' }}>×</button>

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⚡</div>
          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Upgrade to Pro</div>
          {reason && (
            <div style={{ fontSize: 12, color: 'var(--text3)', fontFamily: "'DM Mono',monospace" }}>{reason}</div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          {/* Monthly */}
          <div style={planCard(false)}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', fontFamily: "'DM Mono',monospace", marginBottom: 6, textTransform: 'uppercase' }}>Monthly</div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>$15<span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text2)' }}>/mo</span></div>
            <button style={btn(false)} onClick={() => startCheckout('monthly')} disabled={!!loading}>
              {loading === 'monthly' ? 'Redirecting…' : 'Choose Monthly'}
            </button>
          </div>

          {/* Yearly */}
          <div style={planCard(true)}>
            <div style={{ position: 'absolute', top: -10, right: 12, background: 'var(--accent)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, fontFamily: "'DM Mono',monospace" }}>SAVE $20</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', fontFamily: "'DM Mono',monospace", marginBottom: 6, textTransform: 'uppercase' }}>Yearly</div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>$160<span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text2)' }}>/yr</span></div>
            <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: "'DM Mono',monospace" }}>~$13.33/mo</div>
            <button style={btn(true)} onClick={() => startCheckout('yearly')} disabled={!!loading}>
              {loading === 'yearly' ? 'Redirecting…' : 'Choose Yearly'}
            </button>
          </div>
        </div>

        {error && <div style={{ fontSize: 11, color: 'var(--red)', fontFamily: "'DM Mono',monospace", marginBottom: 12, textAlign: 'center' }}>{error}</div>}

        <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: "'DM Mono',monospace" }}>
          <div style={{ fontWeight: 700, marginBottom: 6, color: 'var(--text2)' }}>Pro includes:</div>
          {['All widgets (no limits)', 'Unlimited custom tabs', 'Cloud sync across devices', 'SnapVault & NotesVault'].map(f => (
            <div key={f} style={{ display: 'flex', gap: 8, marginBottom: 3 }}>
              <span style={{ color: 'var(--green)' }}>✓</span> {f}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
