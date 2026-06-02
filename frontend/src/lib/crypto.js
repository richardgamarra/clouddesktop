// Static keys always synced
export const SYNC_KEYS = [
  'wsh_groups',
  'wsh_apps',            // includes baked base64 icons in .favicon field
  'wsh_news_sources',
  'wsh_custom_tabs',
  'hub_icon_overrides',  // legacy icon overrides per app
  'wsh_tab_overrides',   // custom names/icons for News & Apps tabs
  'wsh_tab_order',       // tab ordering
  'wsh_active_tab',      // last active tab
  'wsh_apps_view',       // cards vs desktop view mode
  'wsh_desktop_layout',  // desktop panel positions & sizes
]

// SessionStorage key for the exported CryptoKey
export const SESSION_KEY = 'cw_sync_key'

// ── Collect ALL keys to backup (static + dynamic notes) ──────────────────────

function getAllSyncKeys() {
  const keys = [...SYNC_KEYS]
  // Include all wsh_notes_{id} keys for Notes tabs
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k && k.startsWith('wsh_notes_')) keys.push(k)
  }
  return keys
}

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
    true,
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
  for (const k of getAllSyncKeys()) {
    const val = localStorage.getItem(k)
    if (val !== null) {
      try { settings[k] = JSON.parse(val) }
      catch { settings[k] = val } // plain string (e.g. notes text)
    }
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
    // Accept static keys + any wsh_notes_* keys
    if (SYNC_KEYS.includes(k) || k.startsWith('wsh_notes_')) {
      try {
        localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v))
      } catch {}
    }
  }
}

// ── Import/export as plain JSON (for backup) ──────────────────────────────────

export function getSettingsJson() {
  const out = {}
  for (const k of getAllSyncKeys()) {
    const val = localStorage.getItem(k)
    if (val !== null) {
      try { out[k] = JSON.parse(val) }
      catch { out[k] = val }
    }
  }
  return out
}

export function loadSettingsJson(json) {
  for (const [k, v] of Object.entries(json)) {
    if (SYNC_KEYS.includes(k) || k.startsWith('wsh_notes_')) {
      try {
        localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v))
      } catch {}
    }
  }
}
