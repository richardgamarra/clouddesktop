import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getSettingsJson, loadSettingsJson, decryptSettings, hydrateLocalStorage, encryptSettings } from '../lib/crypto'

function formatDate(iso) {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function SettingsPage() {
  const { accessToken, user, sync } = useAuth()
  const navigate = useNavigate()
  const [backups, setBackups] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [saving, setSaving] = useState(false)
  const [restoring, setRestoring] = useState(null)

  useEffect(() => {
    fetch('/api/settings/backups', { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.json())
      .then(d => { setBackups(d.backups || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [accessToken])

  // ── Save current settings to cloud ───────────────────────────────────────────
  async function handleSaveToCloud() {
    if (!sync || !accessToken) { setStatus('✗ Not connected — please log in again'); return }
    setSaving(true); setStatus('')
    try {
      await sync(accessToken)
      // Refresh backup list
      const res = await fetch('/api/settings/backups', { headers: { Authorization: `Bearer ${accessToken}` } })
      const d = await res.json()
      setBackups(d.backups || [])
      setStatus('✓ Settings saved to cloud successfully')
    } catch {
      setStatus('✗ Failed to save — check your connection')
    } finally {
      setSaving(false)
      setTimeout(() => setStatus(''), 4000)
    }
  }

  // ── Export current settings as JSON ───────────────────────────────────────────
  function handleExport() {
    const data = getSettingsJson()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `clouddesktop-backup-${new Date().toISOString().slice(0,10)}.json`; a.click()
    URL.revokeObjectURL(url)
    setStatus('✓ Settings exported as JSON')
    setTimeout(() => setStatus(''), 3000)
  }

  // ── Import settings from JSON file ────────────────────────────────────────────
  function handleImport(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      try {
        const json = JSON.parse(ev.target.result)
        loadSettingsJson(json)
        setStatus('✓ Settings imported — reloading…')
        sessionStorage.removeItem('cw_synced')
        setTimeout(() => window.location.reload(), 800)
      } catch {
        setStatus('✗ Invalid settings file')
        setTimeout(() => setStatus(''), 3000)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  // ── Restore from server backup ────────────────────────────────────────────────
  async function handleRestore(backupId) {
    const pwd = prompt('Enter your password to restore this backup:')
    if (!pwd) return
    setRestoring(backupId)
    setStatus('')
    try {
      const res = await fetch(`/api/settings/backups/${backupId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      if (!res.ok) { setStatus('✗ Could not fetch backup'); return }
      const { encrypted_blob, iv } = await res.json()

      // Re-derive key from password
      const { deriveKey } = await import('../lib/crypto')
      const key = await deriveKey(pwd, user.id)
      const settings = await decryptSettings(key, encrypted_blob, iv)
      hydrateLocalStorage(settings)
      setStatus('✓ Backup restored — reloading…')
      sessionStorage.removeItem('cw_synced')
      setTimeout(() => window.location.reload(), 800)
    } catch (err) {
      setStatus('✗ Wrong password or corrupted backup')
      setTimeout(() => setStatus(''), 4000)
    } finally {
      setRestoring(null)
    }
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', color:'var(--text)', fontFamily:"'Plus Jakarta Sans',sans-serif", padding:'40px 48px' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:32 }}>
        <button onClick={() => navigate('/dashboard')}
          style={{ background:'var(--s2)', border:'1px solid var(--border2)', borderRadius:8, color:'var(--text2)', fontSize:12, fontFamily:"'DM Mono',monospace", padding:'6px 12px', cursor:'pointer' }}>
          ← Back
        </button>
        <h1 style={{ fontSize:22, fontWeight:800, letterSpacing:'-.5px' }}>🗄 Settings & Backups</h1>
      </div>

      {/* Primary action — save to cloud */}
      <div style={{ background:'rgba(91,127,255,.08)', border:'1px solid rgba(91,127,255,.25)', borderRadius:12, padding:'20px 24px', marginBottom:24, maxWidth:900, display:'flex', alignItems:'center', gap:20 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>☁ Save to Cloud</div>
          <div style={{ fontSize:12, color:'var(--text2)', fontFamily:"'DM Mono',monospace", lineHeight:1.6 }}>
            Manually save your current workspace (apps, groups, news sources, notes, tabs) to the server so you can restore it on any device.
          </div>
        </div>
        <button onClick={handleSaveToCloud} disabled={saving}
          style={{ background:'var(--accent)', border:'none', borderRadius:10, color:'#fff', fontSize:14, fontWeight:700, padding:'12px 24px', cursor:'pointer', opacity:saving?.6:1, whiteSpace:'nowrap', flexShrink:0 }}>
          {saving ? 'Saving…' : '💾 Save to Cloud Now'}
        </button>
      </div>

      {status && (
        <div style={{ background: status.startsWith('✓') ? 'rgba(61,220,170,.1)' : 'rgba(255,91,110,.1)', border:`1px solid ${status.startsWith('✓') ? 'rgba(61,220,170,.3)' : 'rgba(255,91,110,.3)'}`, borderRadius:8, padding:'10px 16px', fontSize:13, fontFamily:"'DM Mono',monospace", color: status.startsWith('✓') ? 'var(--green)' : 'var(--red)', marginBottom:24 }}>
          {status}
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, maxWidth:900 }}>
        {/* Export / Import */}
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:24 }}>
          <h2 style={{ fontSize:15, fontWeight:700, marginBottom:6 }}>📦 Export / Import</h2>
          <p style={{ fontSize:12, color:'var(--text3)', fontFamily:"'DM Mono',monospace", marginBottom:20, lineHeight:1.6 }}>
            Export your settings as plain JSON for backup or migration. Import to restore.
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <button onClick={handleExport}
              style={{ background:'var(--accent)', border:'none', borderRadius:8, color:'#fff', fontSize:13, fontWeight:700, padding:'10px 16px', cursor:'pointer', textAlign:'left' }}>
              ↓ Export settings as JSON
            </button>
            <label style={{ background:'var(--s2)', border:'1px solid var(--border2)', borderRadius:8, color:'var(--text2)', fontSize:13, fontWeight:600, padding:'10px 16px', cursor:'pointer', display:'block' }}>
              ↑ Import settings from JSON
              <input type="file" accept=".json" style={{ display:'none' }} onChange={handleImport} />
            </label>
          </div>
        </div>

        {/* Server Backups */}
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:24 }}>
          <h2 style={{ fontSize:15, fontWeight:700, marginBottom:6 }}>☁ Server Backups</h2>
          <p style={{ fontSize:12, color:'var(--text3)', fontFamily:"'DM Mono',monospace", marginBottom:20, lineHeight:1.6 }}>
            Last 5 encrypted backups saved automatically when you sync. Restoring requires your password.
          </p>
          {loading && <div style={{ color:'var(--text3)', fontFamily:"'DM Mono',monospace", fontSize:12 }}>Loading…</div>}
          {!loading && backups.length === 0 && (
            <div style={{ color:'var(--text3)', fontFamily:"'DM Mono',monospace", fontSize:12 }}>
              No backups yet. Backups are created automatically when your settings sync.
            </div>
          )}
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {backups.map((b, i) => (
              <div key={b.id} style={{ display:'flex', alignItems:'center', gap:10, background:'var(--s2)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 14px' }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, fontWeight:700 }}>
                    {b.label || `Backup ${backups.length - i}`}
                    {i === 0 && <span style={{ marginLeft:8, fontSize:9, background:'rgba(61,220,170,.13)', color:'var(--green)', borderRadius:20, padding:'1px 8px', fontFamily:"'DM Mono',monospace" }}>Latest</span>}
                  </div>
                  <div style={{ fontSize:10, color:'var(--text3)', fontFamily:"'DM Mono',monospace", marginTop:2 }}>{formatDate(b.created_at)}</div>
                </div>
                <button onClick={() => handleRestore(b.id)} disabled={restoring === b.id}
                  style={{ background:'var(--s3)', border:'1px solid var(--border2)', borderRadius:6, color:'var(--text2)', fontSize:11, fontFamily:"'DM Mono',monospace", padding:'4px 10px', cursor:'pointer', opacity: restoring === b.id ? .5 : 1 }}>
                  {restoring === b.id ? '…' : '↩ Restore'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginTop:24, padding:16, background:'rgba(245,166,35,.08)', border:'1px solid rgba(245,166,35,.3)', borderRadius:10, maxWidth:900, fontSize:12, color:'var(--yellow)', fontFamily:"'DM Mono',monospace", lineHeight:1.6 }}>
        ⚠ Your settings are encrypted with your password before being stored on the server. The server cannot read them. Restoring a backup requires your current password.
      </div>
    </div>
  )
}
