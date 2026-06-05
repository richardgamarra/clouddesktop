// Keys synced to/from cloud
export const SYNC_KEYS = [
  'wsh_desktop_apps',
  'wsh_app_icons',
  'wsh_groups',
  'wsh_apps',
  'wsh_news_sources',
  'wsh_custom_tabs',
  'hub_icon_overrides',
  'wsh_tab_overrides',
  'wsh_tab_order',
  'wsh_default_tab',
  'wsh_apps_view',
  'wsh_desktop_layout',
  'wsh_bg_dark',
  'wsh_bg_light',
  'wsh_bg_opacity',
  'wsh_news_groups',
  'wsh_news_layout_news',
  'wsh_news_view',
]

function getAllSyncKeys() {
  const keys = [...SYNC_KEYS]
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k && k.startsWith('wsh_notes_')) keys.push(k)
  }
  return keys
}

// Collect all workspace data from localStorage as plain object
export function collectSettings() {
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

// Write cloud settings object back into localStorage
export function hydrateLocalStorage(settings) {
  if (!settings || typeof settings !== 'object') return
  for (const [k, v] of Object.entries(settings)) {
    if (SYNC_KEYS.includes(k) || k.startsWith('wsh_notes_')) {
      try {
        localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v))
      } catch {}
    }
  }
}

// Legacy exports
export function getSettingsJson() { return collectSettings() }
export function loadSettingsJson(json) { hydrateLocalStorage(json) }

// ── Legacy AES decrypt — used only to migrate old encrypted backups ───────────
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

export async function decryptSettings(key, encryptedBlob, ivBase64) {
  const encrypted = Uint8Array.from(atob(encryptedBlob), c => c.charCodeAt(0))
  const iv        = Uint8Array.from(atob(ivBase64),      c => c.charCodeAt(0))
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encrypted)
  return JSON.parse(new TextDecoder().decode(decrypted))
}
