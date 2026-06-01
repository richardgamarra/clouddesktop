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
