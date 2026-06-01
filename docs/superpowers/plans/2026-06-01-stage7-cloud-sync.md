# Stage 7: Encrypted Cloud Sync — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a user logs in, their workspace settings load automatically from the server — encrypted in the browser, opaque to the server — so their personalized dashboard follows them to any device.

**Architecture:** On login, the browser derives an AES-256-GCM key from the user's password + userId using PBKDF2 (WebCrypto API). It fetches the encrypted blob from the server, decrypts it, and hydrates localStorage before the dashboard mounts. On every settings change a 2-second debounced effect re-encrypts and uploads. The key is stored in sessionStorage (survives page refresh, cleared on browser close) and never sent to the server. The `encrypted_settings` DB table already exists.

**Tech Stack:** WebCrypto API (browser-native, no library), React, Express/PostgreSQL

---

## File Map

```
backend/
├── routes/
│   └── settings.js                  ← NEW: GET /api/settings, PUT /api/settings/sync
└── server.js                        ← MODIFY: mount /api/settings router

frontend/src/
├── lib/
│   └── crypto.js                    ← NEW: deriveKey, encrypt, decrypt, exportKey, importKey, hydrate, export
├── context/
│   └── AuthContext.jsx              ← MODIFY: add cryptoKey, sync, syncReady; extend login/logout/refresh
├── pages/
│   ├── LoginPage.jsx                ← MODIFY: pass password to login()
│   ├── LandingPage.jsx              ← MODIFY: HeroLoginCard passes password to login()
│   └── DashboardPage.jsx            ← MODIFY: debounced sync + import/export UI
```

---

## Task 1: Backend settings routes

**Files:**
- Create: `backend/routes/settings.js`
- Modify: `backend/server.js`

- [ ] **Step 1.1: Create `backend/routes/settings.js`**

```js
const express     = require('express')
const pool        = require('../db/pool')
const requireAuth = require('../middleware/auth')

const router = express.Router()
router.use(requireAuth)

// GET /api/settings — returns {encrypted_blob, iv} or {encrypted_blob: null, iv: null}
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT encrypted_blob, iv FROM encrypted_settings WHERE user_id = $1',
      [req.user.id]
    )
    if (!result.rows.length) return res.json({ encrypted_blob: null, iv: null })
    res.json(result.rows[0])
  } catch (err) {
    console.error('settings GET error:', err.message)
    res.status(500).json({ error: 'Server error' })
  }
})

// PUT /api/settings/sync — upserts encrypted blob
router.put('/sync', async (req, res) => {
  const { encrypted_blob, iv } = req.body || {}
  if (!encrypted_blob || !iv) {
    return res.status(400).json({ error: 'Missing encrypted_blob or iv' })
  }
  try {
    await pool.query(
      `INSERT INTO encrypted_settings (user_id, encrypted_blob, iv, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id) DO UPDATE
       SET encrypted_blob = $2, iv = $3, updated_at = NOW()`,
      [req.user.id, encrypted_blob, iv]
    )
    res.json({ ok: true })
  } catch (err) {
    console.error('settings PUT error:', err.message)
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
```

- [ ] **Step 1.2: Add settings router to `backend/server.js`**

Add after the existing `app.use('/api/news', newsRouter)` line:

```js
const settingsRouter = require('./routes/settings')
app.use('/api/settings', settingsRouter)
```

- [ ] **Step 1.3: Verify the endpoint exists**

Start the backend locally (`cd backend && npm run dev`), then:

```bash
curl -s http://localhost:4010/api/settings
```

Expected: `{"error":"Missing authorization token"}` (401 — route is mounted and guarded)

- [ ] **Step 1.4: Commit**

```bash
git add backend/routes/settings.js backend/server.js
git commit -m "feat: add encrypted settings API (GET /api/settings, PUT /api/settings/sync)"
```

---

## Task 2: Frontend crypto library

**Files:**
- Create: `frontend/src/lib/crypto.js`

- [ ] **Step 2.1: Create `frontend/src/lib/crypto.js`**

```js
// The localStorage keys that get synced to the cloud
export const SYNC_KEYS = ['wsh_groups', 'wsh_apps', 'wsh_news_sources', 'wsh_custom_tabs']

// SessionStorage key for the exported CryptoKey (survives page refresh, cleared on browser close)
export const SESSION_KEY = 'cw_sync_key'

// ── Key derivation ────────────────────────────────────────────────────────────

export async function deriveKey(password, userId) {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: enc.encode(userId), iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,            // extractable so we can store in sessionStorage
    ['encrypt', 'decrypt']
  )
}

// ── Key export/import (for sessionStorage persistence) ────────────────────────

export async function exportCryptoKey(key) {
  const raw = await crypto.subtle.exportKey('raw', key)
  return btoa(String.fromCharCode(...new Uint8Array(raw)))
}

export async function importCryptoKey(base64) {
  const raw = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt'])
}

// ── Encrypt/decrypt settings ──────────────────────────────────────────────────

export async function encryptSettings(key) {
  const settings = {}
  for (const k of SYNC_KEYS) {
    const val = localStorage.getItem(k)
    if (val) { try { settings[k] = JSON.parse(val) } catch {} }
  }
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const enc = new TextEncoder()
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(JSON.stringify(settings))
  )
  return {
    encrypted_blob: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    iv:             btoa(String.fromCharCode(...iv)),
  }
}

export async function decryptSettings(key, encryptedBlob, ivBase64) {
  const encrypted = Uint8Array.from(atob(encryptedBlob), c => c.charCodeAt(0))
  const iv        = Uint8Array.from(atob(ivBase64),      c => c.charCodeAt(0))
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encrypted)
  return JSON.parse(new TextDecoder().decode(decrypted))
}

// ── LocalStorage hydration ────────────────────────────────────────────────────

export function hydrateLocalStorage(settings) {
  for (const [k, v] of Object.entries(settings)) {
    if (SYNC_KEYS.includes(k)) localStorage.setItem(k, JSON.stringify(v))
  }
}

// ── Import/export as plain JSON (for backup) ──────────────────────────────────

export function getSettingsJson() {
  const out = {}
  for (const k of SYNC_KEYS) {
    const val = localStorage.getItem(k)
    if (val) { try { out[k] = JSON.parse(val) } catch {} }
  }
  return out
}

export function loadSettingsJson(json) {
  for (const [k, v] of Object.entries(json)) {
    if (SYNC_KEYS.includes(k)) localStorage.setItem(k, JSON.stringify(v))
  }
}
```

- [ ] **Step 2.2: Commit**

```bash
git add frontend/src/lib/crypto.js
git commit -m "feat: add WebCrypto helpers for settings encryption"
```

---

## Task 3: Extend AuthContext

**Files:**
- Modify: `frontend/src/context/AuthContext.jsx`

- [ ] **Step 3.1: Replace `frontend/src/context/AuthContext.jsx`**

```jsx
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
  const cryptoKeyRef = useRef(null)   // CryptoKey in memory — never sent to server

  // ── Fetch + decrypt cloud settings ───────────────────────────────────────────
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
        // First login — upload current localStorage as initial sync
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

  // ── login (called after successful /api/auth/login) ──────────────────────────
  // password is optional — if provided, derives key and syncs settings
  const login = useCallback(async (token, userData, password) => {
    setAccessToken(token)
    setUser(userData)

    if (password) {
      try {
        const key = await deriveKey(password, userData.id)
        cryptoKeyRef.current = key
        const exported = await exportCryptoKey(key)
        sessionStorage.setItem(SESSION_KEY, exported)
        // Fetch cloud settings and hydrate localStorage BEFORE dashboard mounts
        await fetchAndHydrate(key, token)
        setSyncReady(true)
      } catch (err) {
        console.error('login sync init failed:', err.message)
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── logout ────────────────────────────────────────────────────────────────────
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

  // ── refresh (auto-login on page load via refresh token cookie) ────────────────
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

      // Restore crypto key from sessionStorage (survives page refresh)
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

  // ── sync — encrypt current localStorage and upload ────────────────────────────
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
```

- [ ] **Step 3.2: Commit**

```bash
git add frontend/src/context/AuthContext.jsx
git commit -m "feat: extend AuthContext with crypto key, sync, and cloud settings hydration"
```

---

## Task 4: Update login callers to pass password

**Files:**
- Modify: `frontend/src/pages/LoginPage.jsx`
- Modify: `frontend/src/pages/LandingPage.jsx` (HeroLoginCard)

- [ ] **Step 4.1: Update `frontend/src/pages/LoginPage.jsx`**

Find the `handleSubmit` function and change:
```jsx
login(data.accessToken, data.user)
navigate('/dashboard')
```
to:
```jsx
await login(data.accessToken, data.user, password)
navigate('/dashboard')
```

The full updated `handleSubmit`:
```jsx
  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Login failed')
        return
      }
      await login(data.accessToken, data.user, password)
      navigate('/dashboard')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }
```

- [ ] **Step 4.2: Update HeroLoginCard in `frontend/src/pages/LandingPage.jsx`**

Find the `handleSubmit` inside `HeroLoginCard` and change:
```jsx
login(data.accessToken, data.user)
navigate('/dashboard')
```
to:
```jsx
await login(data.accessToken, data.user, password)
navigate('/dashboard')
```

The full updated `handleSubmit` inside `HeroLoginCard`:
```jsx
  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include', body: JSON.stringify({ email, password }) })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Login failed'); return }
      await login(data.accessToken, data.user, password)
      navigate('/dashboard')
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }
```

- [ ] **Step 4.3: Commit**

```bash
git add frontend/src/pages/LoginPage.jsx frontend/src/pages/LandingPage.jsx
git commit -m "feat: pass password to login() for cloud sync key derivation"
```

---

## Task 5: DashboardPage sync + import/export UI

**Files:**
- Modify: `frontend/src/pages/DashboardPage.jsx`

- [ ] **Step 5.1: Add sync imports to DashboardPage.jsx**

Add at the top of the file (after existing imports):
```jsx
import { getSettingsJson, loadSettingsJson } from '../lib/crypto'
```

- [ ] **Step 5.2: Add sync effect and import/export handlers to DashboardPage**

Add these inside the `DashboardPage` function, after the existing `useEffect` hooks:

```jsx
  // ── Cloud sync — debounced 2s after any settings change ──────────────────────
  useEffect(() => {
    if (!syncReady) return
    const timer = setTimeout(() => sync(accessToken), 2000)
    return () => clearTimeout(timer)
  }, [hub.groups, hub.apps, sources, customTabs.tabs, syncReady, sync, accessToken])

  // ── Export settings as JSON file ──────────────────────────────────────────────
  function handleExport() {
    const data = getSettingsJson()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = 'clouddesktop-settings.json'; a.click()
    URL.revokeObjectURL(url)
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
        // Sync to cloud immediately after import
        if (syncReady) await sync(accessToken)
        window.location.reload() // Reload so React re-reads localStorage
      } catch {
        alert('Invalid settings file.')
      }
    }
    reader.readAsText(file)
    e.target.value = '' // Reset input
  }
```

- [ ] **Step 5.3: Add sync indicator and export/import buttons to tab bar**

Find the `<div className="tab-actions">` section in the DashboardPage JSX and add before the Log out button:

```jsx
            {/* Sync status + export/import */}
            {syncReady && (
              <span style={{ fontSize:10, fontFamily:"'DM Mono',monospace", color:'var(--green)', marginRight:4 }} title="Settings synced to cloud">☁ synced</span>
            )}
            <button className="tb-btn" onClick={handleExport} title="Export settings as JSON">↓ Export</button>
            <label className="tb-btn" style={{ cursor:'pointer', marginLeft:0 }} title="Import settings from JSON">
              ↑ Import
              <input type="file" accept=".json" style={{ display:'none' }} onChange={handleImport} />
            </label>
```

- [ ] **Step 5.4: Add `syncReady` to the destructured useAuth() call**

Find:
```jsx
  const { logout } = useAuth()
```
Replace with:
```jsx
  const { logout, sync, syncReady } = useAuth()
```

- [ ] **Step 5.5: Build to verify no errors**

```bash
cd frontend && npm run build
```

Expected: Build succeeds, 68+ modules, no errors.

- [ ] **Step 5.6: Commit and push**

```bash
cd ..
git add frontend/src/pages/DashboardPage.jsx frontend/src/lib/crypto.js
git commit -m "feat: debounced cloud sync on settings change + export/import UI"
git push origin main
```

---

## Task 6: Production deploy + end-to-end test

- [ ] **Step 6.1: Deploy to server**

```bash
ssh -p 2222 root@clouddesktop.infoplay.com
cd /var/www/clouddesktop && git stash || true && git pull origin main
cd frontend && npm install && npm run build
cd ../backend && npm install --production && pm2 restart clouddesktop-api --update-env
```

- [ ] **Step 6.2: End-to-end test — settings follow login**

**Browser 1 (Chrome):**
1. Go to `https://clouddesktop.infoplay.com/login`
2. Log in with `richardgamarra@gmail.com`
3. In Apps tab — add a new app (e.g. "Test App" → `https://example.com`)
4. Wait 3 seconds for sync debounce
5. Check tab bar shows "☁ synced"

**Browser 2 (Firefox or incognito):**
1. Go to `https://clouddesktop.infoplay.com/login`
2. Log in with the same account
3. Verify "Test App" appears in the Apps tab without any manual setup

- [ ] **Step 6.3: Test import/export**
1. Click "↓ Export" — downloads `clouddesktop-settings.json`
2. Open the file — verify it contains your apps, groups, sources, tabs in plain JSON
3. In a fresh browser, log in, click "↑ Import", select the file
4. Settings restore and sync to cloud

- [ ] **Step 6.4: Verify server cannot read the data**

```bash
ssh -p 2222 root@clouddesktop.infoplay.com
psql -h 127.0.0.1 -U clouddesktop_user -d clouddesktop -c "SELECT user_id, LEFT(encrypted_blob, 60) AS blob_preview, iv FROM encrypted_settings;" -W <<< 'CloudDesktop2026!'
```

Expected: `blob_preview` shows random base64 characters — the server stores only ciphertext.

---

## Stage 7 Complete

Settings now follow the user on login to any device:

- **Login** → key derived from password → cloud settings fetched → decrypted → localStorage hydrated → dashboard loads with your workspace
- **Page refresh** → key restored from sessionStorage → cloud settings fetched → hydrated
- **Settings change** → 2s debounce → encrypt → upload
- **Export** → downloads unencrypted JSON backup
- **Import** → restores from JSON + syncs to cloud

The server stores only an encrypted blob it cannot read. The encryption key never leaves the browser.
