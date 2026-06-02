import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getSettingsJson, loadSettingsJson, decryptSettings, hydrateLocalStorage, encryptSettings, deriveKey } from '../lib/crypto'

function formatDate(iso) {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

import PasswordModal from '../components/PasswordModal'

export default function SettingsPage() {
  const { accessToken, user } = useAuth()
  const navigate = useNavigate()
  const [backups, setBackups] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [saving, setSaving] = useState(false)
  const [restoring, setRestoring] = useState(null)
  const [pwdModal, setPwdModal] = useState(null) // {action, backupId}
  const [baking, setBaking] = useState(false)
  const [bakeProgress, setBakeProgress] = useState('')

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

  // ── Fix icons: replace CDN URLs with official product icons ─────────────────
  function handleFixGoogleIcons() {
    const G = 'https://www.gstatic.com/images/branding/product/2x/'
    const M = 'https://static2.sharepointonline.com/files/fabric/assets/brand-icons/product/png/'
    const ICON_MAP = {
      // Google — gstatic official
      'mail.google.com':     G + 'gmail_48dp.png',
      'docs.google.com':     G + 'docs_48dp.png',
      'sheets.google.com':   G + 'sheets_48dp.png',
      'slides.google.com':   G + 'slides_48dp.png',
      'drive.google.com':    G + 'drive_48dp.png',
      'calendar.google.com': G + 'calendar_48dp.png',
      'keep.google.com':     G + 'keep_48dp.png',
      'meet.google.com':     G + 'meet_48dp.png',
      'maps.google.com':     G + 'maps_48dp.png',
      'youtube.com':         G + 'youtube_48dp.png',
      // Microsoft — Fluent UI CDN
      'outlook.live.com':    M + 'outlook_96x1.png',
      'outlook.office.com':  M + 'outlook_96x1.png',
      'microsoft365.com':    M + 'office_96x1.png',
      'office.com':          M + 'office_96x1.png',
      'onedrive.live.com':   M + 'onedrive_96x1.png',
      'onedrive.com':        M + 'onedrive_96x1.png',
      'teams.microsoft.com': M + 'teams_96x1.png',
      'sharepoint.com':      M + 'sharepoint_96x1.png',
      'powerbi.com':         M + 'powerbi_96x1.png',
      'powerapps.com':       M + 'powerapps_96x1.png',
      'make.powerautomate.com': M + 'powerautomate_96x1.png',
    }
    try {
      const apps = JSON.parse(localStorage.getItem('wsh_apps') || '[]')
      let fixed = 0
      const updated = apps.map(app => {
        if (app.emoji) return app
        for (const [domain, icon] of Object.entries(ICON_MAP)) {
          if ((app.favicon && app.favicon.includes(domain)) || (app.url && app.url.includes(domain))) {
            fixed++
            return { ...app, favicon: icon }
          }
        }
        return app
      })
      localStorage.setItem('wsh_apps', JSON.stringify(updated))
      setStatus(`✓ Fixed ${fixed} app icons (Google + Microsoft) — reloading…`)
      setTimeout(() => window.location.reload(), 900)
    } catch {
      setStatus('✗ Failed to fix icons')
      setTimeout(() => setStatus(''), 3000)
    }
  }

  // ── Bake icons: fetch all app favicons and store as base64 data URLs ──────────
  async function handleBakeIcons() {
    setBaking(true)
    setBakeProgress('Reading apps…')
    setStatus('')
    try {
      const apps = JSON.parse(localStorage.getItem('wsh_apps') || '[]')
      const overrides = JSON.parse(localStorage.getItem('hub_icon_overrides') || '{}')
      let updated = 0, failed = 0

      for (let i = 0; i < apps.length; i++) {
        const app = apps[i]
        if (app.emoji) continue // already has emoji, skip
        if (app.favicon && app.favicon.startsWith('data:')) continue // already base64

        setBakeProgress(`Fetching icon ${i + 1}/${apps.length}: ${app.name}…`)

        let hostname = ''
        try { hostname = new URL(app.url).hostname } catch {}

        // Build candidate URLs — try direct favicon.ico first, then fallback to Google CDN
        const candidates = [
          app.favicon && !app.favicon.includes('s2/favicons') ? app.favicon : null,
          hostname ? `https://${hostname}/favicon.ico` : null,
          hostname ? `https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(hostname)}` : null,
        ].filter(Boolean)

        let baked = false
        for (const url of candidates) {
          try {
            const res = await fetch(`/api/icons/fetch?url=${encodeURIComponent(url)}`)
            if (res.ok) {
              const { dataUrl } = await res.json()
              if (dataUrl && dataUrl.startsWith('data:') && dataUrl.length > 200) {
                apps[i] = { ...app, favicon: dataUrl }
                if (overrides[app.id]) overrides[app.id] = dataUrl
                updated++
                baked = true
                break
              }
            }
          } catch {}
          await new Promise(r => setTimeout(r, 50))
        }
        if (!baked) failed++
        await new Promise(r => setTimeout(r, 100))
      }

      localStorage.setItem('wsh_apps', JSON.stringify(apps))
      if (Object.keys(overrides).length) localStorage.setItem('hub_icon_overrides', JSON.stringify(overrides))
      setBakeProgress('')
      setStatus(`✓ Icons baked: ${updated} embedded permanently${failed ? `, ${failed} failed` : ''}. Reload the page to see them.`)
      setTimeout(() => setStatus(''), 6000)
    } catch (err) {
      setStatus('✗ Failed to bake icons: ' + err.message)
      setTimeout(() => setStatus(''), 5000)
    } finally {
      setBaking(false)
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

        {/* ── Bake Icons ────────────────────────────────────────── */}
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:24 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
            <h2 style={{ fontSize:15, fontWeight:700 }}>🖼 Fix & Bake Icons</h2>
            <button onClick={handleFixGoogleIcons}
              style={{ background:'rgba(61,220,170,.13)', border:'1px solid rgba(61,220,170,.3)', borderRadius:8, color:'var(--green)', fontSize:12, fontWeight:700, padding:'6px 14px', cursor:'pointer' }}>
              🔧 Fix Google & Microsoft Icons
            </button>
          </div>
          <div style={{ fontSize:11, color:'var(--text3)', fontFamily:"'DM Mono',monospace", marginBottom:16 }}>
            Click <strong style={{ color:'var(--green)' }}>Fix Google & Microsoft Icons</strong> to instantly replace generic icons with the correct Gmail, Drive, Calendar, Outlook, Teams, Word, Excel, PowerPoint and more.
          </div>
          <p style={{ fontSize:12, color:'var(--text3)', fontFamily:"'DM Mono',monospace", marginBottom:16, lineHeight:1.6 }}>
            Fetches every app icon from the web and stores it as a permanent base64 image in your settings.
            Icons will show correctly everywhere — even offline — and are included in backups.
          </p>
          {bakeProgress && (
            <div style={{ fontSize:11, fontFamily:"'DM Mono',monospace", color:'var(--accent2)', marginBottom:12 }}>{bakeProgress}</div>
          )}
          <button onClick={handleBakeIcons} disabled={baking}
            style={{ background:'rgba(167,139,250,.13)', border:'1px solid rgba(167,139,250,.3)', borderRadius:8, color:'var(--purple)', fontSize:13, fontWeight:700, padding:'10px 18px', cursor:'pointer', opacity:baking?.6:1 }}>
            {baking ? 'Baking…' : '🖼 Bake All Icons Now'}
          </button>
          <div style={{ fontSize:11, color:'var(--text3)', fontFamily:"'DM Mono',monospace", marginTop:8 }}>
            After baking, click <strong>💾 Save to Cloud Now</strong> to persist permanently.
          </div>
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
