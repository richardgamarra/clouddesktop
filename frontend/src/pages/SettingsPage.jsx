import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getSettingsJson, loadSettingsJson, collectSettings, hydrateLocalStorage, deriveKey, decryptSettings } from '../lib/crypto'

const DARK_PRESETS = [
  { label:'City Night',   url:'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1920&q=80' },
  { label:'Space',        url:'https://images.unsplash.com/photo-1462332420958-a05d1e002413?w=1920&q=80' },
  { label:'Dark Forest',  url:'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920&q=80' },
  { label:'Mountains',    url:'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&q=80' },
  { label:'Aurora',       url:'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1920&q=80' },
  { label:'Dark Ocean',   url:'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=1920&q=80' },
]
const LIGHT_PRESETS = [
  { label:'Mountains',    url:'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80' },
  { label:'Sunrise',      url:'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1920&q=80' },
  { label:'Beach',        url:'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80' },
  { label:'Green Hills',  url:'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1920&q=80' },
  { label:'Lavender',     url:'https://images.unsplash.com/photo-1490750967868-88df5691cc1b?w=1920&q=80' },
  { label:'City Day',     url:'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=1920&q=80' },
]

function BgSettings() {
  const [darkBg,    setDarkBg]    = useState(() => localStorage.getItem('wsh_bg_dark')    || '')
  const [lightBg,   setLightBg]   = useState(() => localStorage.getItem('wsh_bg_light')   || '')
  const [opacity,   setOpacity]   = useState(() => parseFloat(localStorage.getItem('wsh_bg_opacity') || '0.85'))
  const [customD,   setCustomD]   = useState('')
  const [customL,   setCustomL]   = useState('')
  const [mode,      setMode]      = useState(() => localStorage.getItem('wsh_theme') || 'dark')
  const [uploading, setUploading] = useState(false)
  const { accessToken } = useAuth()

  function save(key, val) {
    localStorage.setItem(key, val)
    window.dispatchEvent(new Event('wsh_bg_changed'))
  }
  function pickPreset(url, isDark) {
    if (isDark) { setDarkBg(url);  save('wsh_bg_dark',  url) }
    else        { setLightBg(url); save('wsh_bg_light', url) }
  }
  function clearBg(isDark) {
    if (isDark) { setDarkBg('');  save('wsh_bg_dark',  '') }
    else        { setLightBg(''); save('wsh_bg_light', '') }
  }
  function applyCustom(isDark) {
    const url = isDark ? customD : customL
    if (!url.trim()) return
    pickPreset(url.trim(), isDark)
    if (isDark) setCustomD(''); else setCustomL('')
  }
  function changeOpacity(v) {
    setOpacity(v)
    save('wsh_bg_opacity', String(v))
  }

  async function handleUpload(e, isDark) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('image', file)
      const res = await fetch('/api/upload/background', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: fd,
      })
      const data = await res.json()
      if (data.url) pickPreset(data.url, isDark)
    } catch {}
    setUploading(false)
    e.target.value = ''
  }

  const iStyle = { background:'var(--s2)', border:'1px solid var(--border2)', borderRadius:8, color:'var(--text)', fontFamily:"'DM Mono',monospace", fontSize:12, padding:'7px 10px', outline:'none', flex:1 }

  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:24 }}>
      <h2 style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>🖼 Background Images</h2>
      <p style={{ fontSize:12, color:'var(--text3)', fontFamily:"'DM Mono',monospace", marginBottom:20 }}>Set a background image for dark and light mode. Syncs to cloud.</p>

      {/* Mode tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:20 }}>
        {['dark','light'].map(m => (
          <button key={m} onClick={() => setMode(m)}
            style={{ padding:'6px 16px', borderRadius:8, border:'none', cursor:'pointer', fontSize:12, fontWeight:700, background: mode===m ? 'var(--accent)' : 'var(--s3)', color: mode===m ? '#fff' : 'var(--text3)' }}>
            {m === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'}
          </button>
        ))}
      </div>

      {/* Presets grid */}
      {[DARK_PRESETS, LIGHT_PRESETS].map((presets, pi) => {
        const isDark = pi === 0
        const current = isDark ? darkBg : lightBg
        if ((isDark && mode !== 'dark') || (!isDark && mode !== 'light')) return null
        return (
          <div key={pi}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:10, marginBottom:16 }}>
              {/* Uploaded/custom image — show first if set and not a preset */}
              {current && !presets.find(p => p.url === current) && (
                <div onClick={() => pickPreset(current, isDark)}
                  style={{ borderRadius:10, overflow:'hidden', cursor:'pointer', border:'2px solid var(--accent)', position:'relative', aspectRatio:'16/9' }}>
                  <img src={current} alt="My image" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                  <div style={{ position:'absolute', bottom:0, left:0, right:0, background:'rgba(0,0,0,.65)', padding:'4px 8px', fontSize:10, color:'#fff', fontFamily:"'DM Mono',monospace", display:'flex', alignItems:'center', gap:4 }}>
                    <span>📁</span> My image
                  </div>
                  <div style={{ position:'absolute', top:6, right:6, background:'var(--accent)', borderRadius:'50%', width:18, height:18, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:'#fff' }}>✓</div>
                </div>
              )}
              {presets.map(p => (
                <div key={p.url} onClick={() => pickPreset(p.url, isDark)}
                  style={{ borderRadius:10, overflow:'hidden', cursor:'pointer', border:`2px solid ${current===p.url ? 'var(--accent)' : 'transparent'}`, position:'relative', aspectRatio:'16/9' }}>
                  <img src={p.url.replace('w=1920','w=400')} alt={p.label} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                  <div style={{ position:'absolute', bottom:0, left:0, right:0, background:'rgba(0,0,0,.55)', padding:'4px 8px', fontSize:10, color:'#fff', fontFamily:"'DM Mono',monospace" }}>{p.label}</div>
                  {current===p.url && <div style={{ position:'absolute', top:6, right:6, background:'var(--accent)', borderRadius:'50%', width:18, height:18, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:'#fff' }}>✓</div>}
                </div>
              ))}
            </div>

            {/* Upload own image */}
            <label style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10, cursor:'pointer' }}>
              <span style={{ background:'var(--s3)', border:'1px solid var(--border2)', borderRadius:8, padding:'7px 14px', fontSize:12, fontWeight:700, color:'var(--text2)', cursor:'pointer', whiteSpace:'nowrap' }}>
                {uploading ? '⏳ Uploading…' : '📁 Upload image'}
              </span>
              <span style={{ fontSize:11, color:'var(--text3)', fontFamily:"'DM Mono',monospace" }}>JPG, PNG, WebP — max 10MB</span>
              <input type="file" accept="image/*" style={{ display:'none' }} disabled={uploading}
                onChange={e => handleUpload(e, isDark)} />
            </label>

            {/* Custom URL */}
            <div style={{ display:'flex', gap:8, marginBottom:12 }}>
              <input style={iStyle} type="url" value={isDark ? customD : customL}
                onChange={e => isDark ? setCustomD(e.target.value) : setCustomL(e.target.value)}
                placeholder="Or paste any image URL…"
                onKeyDown={e => e.key === 'Enter' && applyCustom(isDark)} />
              <button onClick={() => applyCustom(isDark)}
                style={{ padding:'7px 14px', borderRadius:8, border:'none', background:'var(--accent)', color:'#fff', fontSize:12, cursor:'pointer', fontWeight:700 }}>Apply</button>
              {current && <button onClick={() => clearBg(isDark)}
                style={{ padding:'7px 12px', borderRadius:8, border:'1px solid var(--border2)', background:'var(--s3)', color:'var(--red)', fontSize:12, cursor:'pointer' }}>✕ Clear</button>}
            </div>

            {/* Current preview */}
            {current && (
              <div style={{ borderRadius:10, overflow:'hidden', marginBottom:16, height:120, position:'relative' }}>
                <img src={current} alt="Current background" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                <div style={{ position:'absolute', inset:0, background:`rgba(0,0,0,${opacity})` }} />
                <div style={{ position:'absolute', bottom:8, left:12, fontSize:11, color:'#fff', fontFamily:"'DM Mono',monospace" }}>Preview with overlay</div>
              </div>
            )}
          </div>
        )
      })}

      {/* Overlay opacity */}
      <div style={{ marginTop:4 }}>
        <div style={{ fontSize:12, fontFamily:"'DM Mono',monospace", color:'var(--text2)', marginBottom:8 }}>
          Overlay darkness: <strong>{Math.round(opacity * 100)}%</strong>
          <span style={{ color:'var(--text3)', marginLeft:8 }}>(higher = darker overlay, better readability)</span>
        </div>
        <input type="range" min="0.3" max="0.97" step="0.05" value={opacity}
          onChange={e => changeOpacity(parseFloat(e.target.value))}
          style={{ width:'100%', accentColor:'var(--accent)' }} />
      </div>
    </div>
  )
}

function formatDate(iso) {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

import PasswordModal from '../components/PasswordModal'
import HelpModal from '../components/HelpModal'

export default function SettingsPage() {
  const { accessToken, user } = useAuth()
  const navigate = useNavigate()
  const [backups, setBackups] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [saving, setSaving] = useState(false)
  const [restoring, setRestoring] = useState(null)
  const [pwdModal, setPwdModal] = useState(null)
  const [migrateModal, setMigrateModal] = useState(false)
  const [baking, setBaking] = useState(false)
  const [bakeProgress, setBakeProgress] = useState('')
  const [showHelp, setShowHelp] = useState(false)

  useEffect(() => {
    if (!accessToken) return
    fetch('/api/settings/backups', { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(r => r.json())
      .then(d => { setBackups(d.backups || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [accessToken])

  // ── Save current settings to cloud ──────────────────────────────────────────
  async function doSaveToCloud() {
    setPwdModal(null)
    setSaving(true); setStatus('')
    try {
      const settings = collectSettings()
      const res = await fetch('/api/settings/sync', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ settings }),
      })
      if (!res.ok) { setStatus('✗ Failed to save — server error'); return }
      const br = await fetch('/api/settings/backups', { headers: { Authorization: `Bearer ${accessToken}` } })
      const bd = await br.json()
      setBackups(bd.backups || [])
      setStatus('✓ Settings saved to cloud successfully')
    } catch {
      setStatus('✗ Connection error')
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
  async function doRestore(backupId) {
    setPwdModal(null)
    setRestoring(backupId); setStatus('')
    try {
      const res = await fetch(`/api/settings/backups/${backupId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      if (!res.ok) { setStatus('✗ Could not fetch backup from server'); setRestoring(null); return }
      const data = await res.json()
      const settings = data.settings_json || null
      if (!settings) { setStatus('✗ Backup has no readable data'); setRestoring(null); return }
      hydrateLocalStorage(settings)
      setStatus('✓ Backup restored — reloading…')
      sessionStorage.removeItem('cw_synced')
      setTimeout(() => window.location.reload(), 900)
    } catch {
      setStatus('✗ Could not restore backup')
      setTimeout(() => setStatus(''), 5000)
    } finally {
      setRestoring(null)
    }
  }

  // ── Migrate old AES-encrypted backup to plain JSON ───────────────────────────
  async function doMigrateEncrypted(pwd) {
    setMigrateModal(false)
    if (!user?.id) { setStatus('✗ Not logged in'); return }
    setStatus('⏳ Decrypting old backup…')
    try {
      const res = await fetch('/api/settings/encrypted', { headers: { Authorization: `Bearer ${accessToken}` } })
      if (!res.ok) { setStatus('✗ Could not fetch encrypted backup'); return }
      const { encrypted_blob, iv } = await res.json()
      if (!encrypted_blob || !iv) { setStatus('✗ No encrypted backup found on server'); return }

      // Try multiple salts — old code may have used userId, email, or lowercase email
      const salts = [user.id, user.email, user.email?.toLowerCase()].filter(Boolean)
      let settings = null
      for (const salt of salts) {
        try {
          const key = await deriveKey(pwd, salt)
          settings = await decryptSettings(key, encrypted_blob, iv)
          console.log('Decrypted with salt:', salt)
          break
        } catch { /* try next */ }
      }

      if (!settings) {
        setStatus('✗ Wrong password — make sure you are entering the exact password used to register. Check using the Show button.')
        setTimeout(() => setStatus(''), 8000)
        return
      }

      const saveRes = await fetch('/api/settings/sync', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ settings }),
      })
      if (!saveRes.ok) { setStatus('✗ Failed to save migrated settings'); return }
      hydrateLocalStorage(settings)
      setStatus('✓ Workspace recovered! Reloading…')
      sessionStorage.removeItem('cw_synced')
      setTimeout(() => window.location.reload(), 1000)
    } catch (err) {
      console.error('migrate error:', err)
      setStatus('✗ Error: ' + err.message)
      setTimeout(() => setStatus(''), 8000)
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
        <button onClick={() => setShowHelp(true)}
          style={{ marginLeft:'auto', background:'var(--s2)', border:'1px solid var(--border2)', borderRadius:8, color:'var(--text2)', fontSize:12, fontFamily:"'DM Mono',monospace", padding:'6px 14px', cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
          📖 Help &amp; Documentation
        </button>
      </div>

      {/* Primary action — save to cloud */}
      <div style={{ background:'rgba(91,127,255,.08)', border:'1px solid rgba(91,127,255,.25)', borderRadius:12, padding:'20px 24px', marginBottom:24, maxWidth:900, display:'flex', alignItems:'center', gap:20 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>☁ Save to Cloud</div>
          <div style={{ fontSize:12, color:'var(--text2)', fontFamily:"'DM Mono',monospace", lineHeight:1.6 }}>
            Manually save your current workspace (apps, groups, news sources, notes, tabs) to the server so you can restore it on any device.
          </div>
        </div>
        <button onClick={() => doSaveToCloud()} disabled={saving}
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
              <button onClick={() => doRestore(backups[0].id)} disabled={!!restoring}
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
                      <div style={{ fontSize:12, fontWeight:700, display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                        {b.label ? (
                          b.label.startsWith('daily-')
                            ? <span>📅 {b.label.replace('daily-', 'Daily ')}</span>
                            : b.label
                        ) : `Backup ${backups.length - i}`}
                        {i === 0 && <span style={{ fontSize:9, background:'rgba(61,220,170,.13)', color:'var(--green)', borderRadius:20, padding:'1px 8px', fontFamily:"'DM Mono',monospace" }}>Latest</span>}
                        {b.label?.startsWith('daily-') && <span style={{ fontSize:9, background:'rgba(245,166,35,.13)', color:'var(--yellow)', borderRadius:20, padding:'1px 8px', fontFamily:"'DM Mono',monospace" }}>Auto</span>}
                      </div>
                      <div style={{ fontSize:10, color:'var(--text3)', fontFamily:"'DM Mono',monospace", marginTop:2 }}>
                        {formatDate(b.created_at)}
                        {b.bytes && <span style={{ marginLeft:8, color:'var(--text3)' }}>· {Math.round(b.bytes/1024*10)/10}KB</span>}
                      </div>
                    </div>
                    <button onClick={() => doRestore(b.id)} disabled={!!restoring}
                      style={{ background:'var(--s3)', border:'1px solid var(--border2)', borderRadius:6, color:'var(--text2)', fontSize:11, fontFamily:"'DM Mono',monospace", padding:'5px 12px', cursor:'pointer', opacity: restoring ? .5 : 1, whiteSpace:'nowrap' }}>
                      {restoring === b.id ? '…' : '↩ Restore'}
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── Background Images ─────────────────────────────────── */}
        <BgSettings />

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

      </div>

      {/* Help modal */}
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}

      {/* Migration password modal */}
      {migrateModal && (
        <PasswordModal
          title="🔑 Recover Workspace"
          sub="Enter your CloudDesktop password to decrypt your saved workspace and restore it."
          onConfirm={pwd => doMigrateEncrypted(pwd)}
          onCancel={() => setMigrateModal(false)}
        />
      )}

    </div>
  )
}
