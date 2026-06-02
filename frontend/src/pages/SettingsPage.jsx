import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getSettingsJson, loadSettingsJson, decryptSettings, hydrateLocalStorage, encryptSettings, deriveKey } from '../lib/crypto'

function formatDate(iso) {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ── Password modal component ──────────────────────────────────────────────────
function PasswordModal({ onConfirm, onCancel, title, sub }) {
  const [pwd, setPwd] = useState('')
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.75)', backdropFilter:'blur(5px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}>
      <div style={{ background:'var(--surface)', border:'1px solid var(--border2)', borderRadius:14, padding:28, width:380, boxShadow:'0 28px 72px rgba(0,0,0,.7)' }}>
        <div style={{ fontSize:17, fontWeight:800, marginBottom:4 }}>{title}</div>
        <div style={{ fontSize:12, color:'var(--text3)', fontFamily:"'DM Mono',monospace", marginBottom:20 }}>{sub}</div>
        <div className="field">
          <label>Your password</label>
          <input type="password" value={pwd} onChange={e => setPwd(e.target.value)} placeholder="••••••••" autoFocus
            onKeyDown={e => { if (e.key === 'Enter' && pwd) onConfirm(pwd) }} />
        </div>
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:8 }}>
          <button className="btn-cancel" onClick={onCancel}>Cancel</button>
          <button className="btn-primary" style={{ width:'auto' }} disabled={!pwd} onClick={() => onConfirm(pwd)}>Continue →</button>
        </div>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const { accessToken, user } = useAuth()
  const navigate = useNavigate()
  const [backups, setBackups] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [saving, setSaving] = useState(false)
  const [restoring, setRestoring] = useState(null)
  const [pwdModal, setPwdModal] = useState(null) // {action, backupId}

  useEffect(() => {
    if (!accessToken) return
    fetch('/api/settings/backups', { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.json())
      .then(d => { setBackups(d.backups || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [accessToken])

  // ── Save current settings to cloud (asks for password, derives key independently) ──
  async function doSaveToCloud(pwd) {
    setPwdModal(null)
    if (!user?.id) { setStatus('✗ Not logged in — please log in again'); return }
    setSaving(true); setStatus('')
    try {
      const key = await deriveKey(pwd, user.id)
      const blob = await encryptSettings(key)
      const res = await fetch('/api/settings/sync', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(blob),
      })
      if (!res.ok) { setStatus('✗ Failed to save — server error'); return }
      // Refresh backup list
      const br = await fetch('/api/settings/backups', { headers: { Authorization: `Bearer ${accessToken}` } })
      const bd = await br.json()
      setBackups(bd.backups || [])
      setStatus('✓ Settings saved to cloud successfully')
    } catch {
      setStatus('✗ Wrong password or connection error')
    } finally {
      setSaving(false)
      setTimeout(() => setStatus(''), 5000)
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
  async function doRestore(backupId, pwd) {
    setPwdModal(null)
    if (!user?.id) { setStatus('✗ Not logged in — please log in again'); return }
    setRestoring(backupId); setStatus('')
    try {
      const res = await fetch(`/api/settings/backups/${backupId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      if (!res.ok) { setStatus('✗ Could not fetch backup from server'); setRestoring(null); return }
      const { encrypted_blob, iv } = await res.json()
      const key = await deriveKey(pwd, user.id)
      const settings = await decryptSettings(key, encrypted_blob, iv)
      hydrateLocalStorage(settings)
      setStatus('✓ Backup restored — reloading…')
      sessionStorage.removeItem('cw_synced')
      setTimeout(() => window.location.reload(), 900)
    } catch {
      setStatus('✗ Wrong password or corrupted backup — try again')
      setTimeout(() => setStatus(''), 5000)
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
        <button onClick={() => setPwdModal({ action:'save' })} disabled={saving}
          style={{ background:'var(--accent)', border:'none', borderRadius:10, color:'#fff', fontSize:14, fontWeight:700, padding:'12px 24px', cursor:'pointer', opacity:saving?.6:1, whiteSpace:'nowrap', flexShrink:0 }}>
          {saving ? 'Saving…' : '💾 Save to Cloud Now'}
        </button>
      </div>

      {status && (
        <div style={{ background: status.startsWith('✓') ? 'rgba(61,220,170,.1)' : 'rgba(255,91,110,.1)', border:`1px solid ${status.startsWith('✓') ? 'rgba(61,220,170,.3)' : 'rgba(255,91,110,.3)'}`, borderRadius:8, padding:'10px 16px', fontSize:13, fontFamily:"'DM Mono',monospace", color: status.startsWith('✓') ? 'var(--green)' : 'var(--red)', marginBottom:24 }}>
          {status}
        </div>
      )}

      <div style={{ maxWidth:900, display:'flex', flexDirection:'column', gap:20 }}>

        {/* ── Cloud Restore ────────────────────────────────────── */}
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:24 }}>
          <h2 style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>☁ Restore from Cloud</h2>
          <p style={{ fontSize:12, color:'var(--text3)', fontFamily:"'DM Mono',monospace", marginBottom:20, lineHeight:1.6 }}>
            Restore your workspace from a saved backup. Requires your password to decrypt.
            Restoring will replace your current local settings.
          </p>

          {loading && <div style={{ color:'var(--text3)', fontFamily:"'DM Mono',monospace", fontSize:12 }}>Loading backups…</div>}

          {!loading && backups.length === 0 && (
            <div style={{ background:'var(--s2)', border:'1px solid var(--border)', borderRadius:8, padding:'14px 16px', fontSize:12, color:'var(--text3)', fontFamily:"'DM Mono',monospace" }}>
              No server backups yet. Click <strong style={{ color:'var(--text2)' }}>💾 Save to Cloud Now</strong> above to create your first backup.
            </div>
          )}

          {!loading && backups.length > 0 && (
            <>
              {/* Quick restore latest */}
              <button onClick={() => setPwdModal({ action:'restore', backupId: backups[0].id })} disabled={!!restoring}
                style={{ background:'rgba(61,220,170,.13)', border:'1px solid rgba(61,220,170,.3)', borderRadius:10, color:'var(--green)', fontSize:14, fontWeight:700, padding:'12px 20px', cursor:'pointer', width:'100%', marginBottom:16, opacity: restoring ? .5 : 1, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                {restoring === backups[0].id ? 'Restoring…' : '↩ Restore Latest Backup'}
                <span style={{ fontSize:11, fontWeight:400, fontFamily:"'DM Mono',monospace", opacity:.7 }}>{formatDate(backups[0].created_at)}</span>
              </button>

              {/* All 5 backups */}
              <div style={{ fontSize:11, fontFamily:"'DM Mono',monospace", color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:8 }}>
                All saved backups ({backups.length})
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {backups.map((b, i) => (
                  <div key={b.id} style={{ display:'flex', alignItems:'center', gap:10, background:'var(--s2)', border:`1px solid ${i === 0 ? 'rgba(61,220,170,.2)' : 'var(--border)'}`, borderRadius:8, padding:'10px 14px' }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, fontWeight:700, display:'flex', alignItems:'center', gap:6 }}>
                        {b.label || `Backup ${backups.length - i}`}
                        {i === 0 && <span style={{ fontSize:9, background:'rgba(61,220,170,.13)', color:'var(--green)', borderRadius:20, padding:'1px 8px', fontFamily:"'DM Mono',monospace" }}>Latest</span>}
                      </div>
                      <div style={{ fontSize:10, color:'var(--text3)', fontFamily:"'DM Mono',monospace", marginTop:2 }}>{formatDate(b.created_at)}</div>
                    </div>
                    <button onClick={() => setPwdModal({ action:'restore', backupId: b.id })} disabled={!!restoring}
                      style={{ background:'var(--s3)', border:'1px solid var(--border2)', borderRadius:6, color:'var(--text2)', fontSize:11, fontFamily:"'DM Mono',monospace", padding:'5px 12px', cursor:'pointer', opacity: restoring ? .5 : 1, whiteSpace:'nowrap' }}>
                      {restoring === b.id ? '…' : '↩ Restore'}
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── Export / Import (local JSON) ──────────────────────── */}
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:24 }}>
          <h2 style={{ fontSize:15, fontWeight:700, marginBottom:6 }}>📦 Local Export / Import</h2>
          <p style={{ fontSize:12, color:'var(--text3)', fontFamily:"'DM Mono',monospace", marginBottom:16, lineHeight:1.6 }}>
            Export as a plain JSON file to your device, or import from a previously exported file.
            No password required — the file is unencrypted.
          </p>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={handleExport}
              style={{ background:'var(--accent)', border:'none', borderRadius:8, color:'#fff', fontSize:13, fontWeight:700, padding:'10px 18px', cursor:'pointer' }}>
              ↓ Export JSON
            </button>
            <label style={{ background:'var(--s2)', border:'1px solid var(--border2)', borderRadius:8, color:'var(--text2)', fontSize:13, fontWeight:600, padding:'10px 18px', cursor:'pointer' }}>
              ↑ Import JSON
              <input type="file" accept=".json" style={{ display:'none' }} onChange={handleImport} />
            </label>
          </div>
        </div>

        <div style={{ padding:14, background:'rgba(245,166,35,.08)', border:'1px solid rgba(245,166,35,.3)', borderRadius:10, fontSize:12, color:'var(--yellow)', fontFamily:"'DM Mono',monospace", lineHeight:1.6 }}>
          ⚠ Server backups are encrypted with your password. The server cannot read your data. Restoring requires you to enter your password to decrypt.
        </div>
      </div>

      {/* Password modal */}
      {pwdModal && (
        <PasswordModal
          title={pwdModal.action === 'save' ? '💾 Save to Cloud' : '↩ Restore Backup'}
          sub={pwdModal.action === 'save'
            ? 'Enter your password to encrypt and save your current settings to the server.'
            : 'Enter your password to decrypt and restore this backup to your device.'}
          onConfirm={pwd => {
            if (pwdModal.action === 'save') doSaveToCloud(pwd)
            else doRestore(pwdModal.backupId, pwd)
          }}
          onCancel={() => setPwdModal(null)}
        />
      )}
    </div>
  )
}
