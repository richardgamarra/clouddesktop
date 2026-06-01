# Stage 5: Custom Tabs — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a + button to the dashboard tab bar that lets users create unlimited custom tabs (Web Page, Bookmarks, Notes, World Clock, Weather), each closeable with ×, persisted in localStorage.

**Architecture:** Custom tabs are stored as an array in localStorage (`wsh_custom_tabs`). A `useCustomTabs` hook manages CRUD. `DashboardPage.jsx` adds the custom tabs to the tab bar between the fixed Apps tab and the + button. Each tab type is a focused component in `dashboard/tabs/`. `AddTabModal` handles type selection and per-type configuration.

**Tech Stack:** React 18 hooks, Open-Meteo free API (no key), Intl.DateTimeFormat for clocks, localStorage for notes, pure CSS

---

## Tab data model

```js
// Stored in localStorage as wsh_custom_tabs (array)
{
  id: 'tab_1234567890',   // unique id
  type: 'webpage' | 'bookmarks' | 'notes' | 'worldclock' | 'weather',
  name: string,           // display name in tab bar
  icon: string,           // emoji icon
  config: {
    // webpage:    { url: string }
    // bookmarks:  { items: [{ id, name, url }] }
    // notes:      {}  (content saved separately in localStorage as 'wsh_notes_{id}')
    // worldclock: { cities: [{ name: string, tz: string }] }
    // weather:    { city: string, lat: number, lon: number }
  }
}
```

---

## File Map

```
frontend/src/
├── pages/
│   └── DashboardPage.jsx          ← MODIFY: add custom tabs to tab bar and panels
├── dashboard/
│   ├── dashboard.css              ← MODIFY: add scrollable tab bar + tab-close styles
│   ├── AddTabModal.jsx            ← NEW: type picker + config forms
│   └── hooks/
│       └── useCustomTabs.js       ← NEW: custom tabs state + localStorage
│   └── tabs/
│       ├── WebPageTab.jsx         ← NEW: iframe with blocked-embed fallback
│       ├── BookmarksTab.jsx       ← NEW: bookmark grid with add/remove
│       ├── NotesTab.jsx           ← NEW: auto-saving textarea
│       ├── WorldClockTab.jsx      ← NEW: multi-timezone clocks
│       └── WeatherTab.jsx         ← NEW: Open-Meteo city weather
```

---

## Task 1: useCustomTabs hook + CSS additions

**Files:**
- Create: `frontend/src/dashboard/hooks/useCustomTabs.js`
- Modify: `frontend/src/dashboard/dashboard.css`

- [ ] **Step 1.1: Create `frontend/src/dashboard/hooks/useCustomTabs.js`**

```js
import { useState, useCallback } from 'react'

function load() {
  try { return JSON.parse(localStorage.getItem('wsh_custom_tabs')) || [] }
  catch { return [] }
}

function save(tabs) {
  localStorage.setItem('wsh_custom_tabs', JSON.stringify(tabs))
}

export function useCustomTabs() {
  const [tabs, setTabs] = useState(load)

  const addTab = useCallback((tab) => {
    const newTab = { id: 'tab_' + Date.now(), ...tab }
    setTabs(prev => { const next = [...prev, newTab]; save(next); return next })
    return newTab.id
  }, [])

  const removeTab = useCallback((id) => {
    setTabs(prev => { const next = prev.filter(t => t.id !== id); save(next); return next })
    // Clean up notes content if it was a notes tab
    localStorage.removeItem('wsh_notes_' + id)
  }, [])

  const updateTab = useCallback((id, patch) => {
    setTabs(prev => {
      const next = prev.map(t => t.id === id ? { ...t, ...patch } : t)
      save(next); return next
    })
  }, [])

  const reorderTabs = useCallback((newOrder) => {
    setTabs(prev => {
      const next = newOrder.map(id => prev.find(t => t.id === id)).filter(Boolean)
      save(next); return next
    })
  }, [])

  return { tabs, addTab, removeTab, updateTab, reorderTabs }
}
```

- [ ] **Step 1.2: Add CSS for scrollable tab bar and custom tab styles to `frontend/src/dashboard/dashboard.css`**

Append these rules at the end of the file:

```css
/* ═══ CUSTOM TABS ═══ */
#tabs-bar {
  overflow-x: auto;
  scrollbar-width: none;
}
#tabs-bar::-webkit-scrollbar { display: none; }

.tab-btn-custom {
  display: flex; align-items: center; gap: 6px; padding: 0 14px 0 16px;
  background: transparent; border: none; border-bottom: 2px solid transparent;
  color: var(--text3); font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; font-weight: 700;
  cursor: pointer; transition: color var(--t), border-color var(--t), background var(--t);
  white-space: nowrap; flex-shrink: 0; position: relative;
}
.tab-btn-custom:hover { color: var(--text2); background: var(--s2); }
.tab-btn-custom.active { color: var(--text); border-bottom-color: var(--accent); }

.tab-close-btn {
  width: 16px; height: 16px; border-radius: 50%; border: none;
  background: transparent; color: var(--text3); font-size: 12px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all var(--t); flex-shrink: 0; line-height: 1;
  margin-left: 2px;
}
.tab-close-btn:hover { background: var(--s4); color: var(--red); }

.tab-add-btn {
  width: 36px; height: 100%; border: none; background: transparent;
  color: var(--text3); font-size: 18px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all var(--t); flex-shrink: 0;
}
.tab-add-btn:hover { color: var(--accent); background: var(--s2); }

/* ═══ TAB CONTENT AREAS ═══ */
.custom-tab-panel {
  flex: 1; overflow-y: auto; padding: 28px 32px;
  scrollbar-width: thin; scrollbar-color: var(--border2) transparent;
}

/* ═══ WEBPAGE TAB ═══ */
.webpage-frame { width: 100%; height: 100%; border: none; display: block; }
.webpage-blocked {
  flex: 1; display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 16px; padding: 40px;
}
.webpage-blocked h2 { font-size: 18px; font-weight: 800; color: var(--text); }
.webpage-blocked p { font-size: 13px; color: var(--text2); font-family: 'DM Mono', monospace; text-align: center; max-width: 400px; line-height: 1.6; }

/* ═══ BOOKMARKS TAB ═══ */
.bookmarks-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px;
  padding: 28px 32px;
}
.bookmark-card {
  background: var(--s2); border: 1px solid var(--border); border-radius: var(--r);
  padding: 14px 12px; cursor: pointer; display: flex; flex-direction: column;
  align-items: center; gap: 8px; text-decoration: none;
  transition: background var(--t), border-color var(--t), transform var(--t);
  position: relative;
}
.bookmark-card:hover { background: var(--s3); border-color: var(--border2); transform: translateY(-2px); }
.bookmark-card img { width: 24px; height: 24px; border-radius: 5px; }
.bookmark-card-name { font-size: 12px; font-weight: 700; color: var(--text); text-align: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; width: 100%; }
.bookmark-card-url { font-size: 10px; color: var(--text3); font-family: 'DM Mono', monospace; }
.bookmark-remove {
  position: absolute; top: 4px; right: 4px; width: 16px; height: 16px;
  border-radius: 50%; background: var(--reddim, rgba(255,91,110,.13)); color: var(--red);
  font-size: 10px; display: none; align-items: center; justify-content: center;
  cursor: pointer; border: none;
}
.bookmark-card:hover .bookmark-remove { display: flex; }
.bookmark-add-card {
  background: transparent; border: 1.5px dashed var(--border2); border-radius: var(--r);
  padding: 14px 12px; cursor: pointer; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 6px; min-height: 90px;
  color: var(--text3); font-size: 11px; font-family: 'DM Mono', monospace;
  transition: all var(--t);
}
.bookmark-add-card:hover { border-color: var(--accent); color: var(--accent); background: rgba(91,127,255,.08); }

/* ═══ NOTES TAB ═══ */
.notes-textarea {
  width: 100%; height: 100%; padding: 28px 32px; background: var(--bg);
  color: var(--text); font-family: 'DM Mono', monospace; font-size: 14px;
  line-height: 1.7; border: none; outline: none; resize: none;
  scrollbar-width: thin; scrollbar-color: var(--border2) transparent;
}
.notes-status {
  position: absolute; bottom: 12px; right: 16px;
  font-size: 10px; font-family: 'DM Mono', monospace; color: var(--text3);
  pointer-events: none;
}

/* ═══ WORLD CLOCK TAB ═══ */
.worldclock-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px; padding: 28px 32px;
}
.clock-card {
  background: var(--s2); border: 1px solid var(--border); border-radius: var(--r);
  padding: 20px; display: flex; flex-direction: column; gap: 6px; position: relative;
}
.clock-tz { font-size: 10px; font-family: 'DM Mono', monospace; color: var(--text3); text-transform: uppercase; letter-spacing: .08em; }
.clock-city { font-size: 14px; font-weight: 700; color: var(--text); }
.clock-time { font-size: 32px; font-weight: 800; letter-spacing: -1px; color: var(--accent2); font-family: 'DM Mono', monospace; }
.clock-date { font-size: 11px; font-family: 'DM Mono', monospace; color: var(--text2); }
.clock-remove {
  position: absolute; top: 8px; right: 8px; width: 18px; height: 18px;
  border-radius: 50%; background: transparent; color: var(--text3); font-size: 12px;
  display: none; align-items: center; justify-content: center; cursor: pointer; border: none;
}
.clock-card:hover .clock-remove { display: flex; }
.clock-remove:hover { color: var(--red); background: rgba(255,91,110,.13); }

/* ═══ WEATHER TAB ═══ */
.weather-panel { padding: 28px 32px; max-width: 600px; }
.weather-city-name { font-size: 28px; font-weight: 800; letter-spacing: -1px; margin-bottom: 4px; }
.weather-current { display: flex; align-items: center; gap: 20px; margin: 16px 0; }
.weather-temp { font-size: 56px; font-weight: 800; letter-spacing: -3px; color: var(--accent2); font-family: 'DM Mono', monospace; }
.weather-desc { font-size: 14px; color: var(--text2); font-family: 'DM Mono', monospace; }
.weather-detail { font-size: 12px; color: var(--text3); font-family: 'DM Mono', monospace; margin-top: 4px; }
.weather-daily { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; margin-top: 24px; }
.weather-day { background: var(--s2); border: 1px solid var(--border); border-radius: 8px; padding: 10px 8px; text-align: center; }
.weather-day-name { font-size: 10px; font-family: 'DM Mono', monospace; color: var(--text3); text-transform: uppercase; margin-bottom: 6px; }
.weather-day-icon { font-size: 20px; margin-bottom: 4px; }
.weather-day-temp { font-size: 11px; font-family: 'DM Mono', monospace; color: var(--text2); }
.weather-search { display: flex; gap: 8px; margin-bottom: 20px; }
.weather-search input { flex: 1; }
```

- [ ] **Step 1.3: Commit**

```bash
git add frontend/src/dashboard/hooks/useCustomTabs.js frontend/src/dashboard/dashboard.css
git commit -m "feat: add useCustomTabs hook and custom tab CSS"
```

---

## Task 2: AddTabModal

**Files:**
- Create: `frontend/src/dashboard/AddTabModal.jsx`

- [ ] **Step 2.1: Create `frontend/src/dashboard/AddTabModal.jsx`**

```jsx
import { useState } from 'react'

const TAB_TYPES = [
  { type: 'webpage',    icon: '🌐', name: 'Web Page',    desc: 'Embed any public URL in a panel' },
  { type: 'bookmarks', icon: '🔖', name: 'Bookmarks',   desc: 'Quick-launch link grid' },
  { type: 'notes',     icon: '📝', name: 'Notes',       desc: 'Persistent scratch pad, auto-saves' },
  { type: 'worldclock',icon: '🕐', name: 'World Clock', desc: 'Multiple timezone clocks' },
  { type: 'weather',   icon: '🌦️', name: 'Weather',     desc: 'Live city forecast' },
]

const COMMON_TIMEZONES = [
  { name: 'New York',    tz: 'America/New_York' },
  { name: 'Los Angeles', tz: 'America/Los_Angeles' },
  { name: 'London',      tz: 'Europe/London' },
  { name: 'Paris',       tz: 'Europe/Paris' },
  { name: 'Dubai',       tz: 'Asia/Dubai' },
  { name: 'Tokyo',       tz: 'Asia/Tokyo' },
  { name: 'Sydney',      tz: 'Australia/Sydney' },
  { name: 'São Paulo',   tz: 'America/Sao_Paulo' },
]

export default function AddTabModal({ onAdd, onClose }) {
  const [step, setStep]   = useState('pick')   // 'pick' | 'config'
  const [chosen, setChosen] = useState(null)
  // Config fields
  const [tabName, setTabName] = useState('')
  const [webUrl, setWebUrl]   = useState('')
  const [weatherCity, setWeatherCity] = useState('')
  const [weatherSearching, setWeatherSearching] = useState(false)
  const [weatherResult, setWeatherResult] = useState(null)
  const [weatherError, setWeatherError] = useState('')
  const [clockCities, setClockCities] = useState([{ name: 'New York', tz: 'America/New_York' }])

  function pick(t) {
    setChosen(t)
    setTabName(t.name)
    setStep('config')
  }

  async function searchWeatherCity() {
    if (!weatherCity.trim()) return
    setWeatherSearching(true)
    setWeatherError('')
    setWeatherResult(null)
    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(weatherCity.trim())}&count=1&language=en&format=json`)
      const d = await res.json()
      if (d.results?.length) {
        setWeatherResult(d.results[0])
      } else {
        setWeatherError('City not found. Try a different spelling.')
      }
    } catch {
      setWeatherError('Search failed. Check your connection.')
    } finally {
      setWeatherSearching(false)
    }
  }

  function addClockCity(tz) {
    const def = COMMON_TIMEZONES.find(c => c.tz === tz)
    if (!clockCities.find(c => c.tz === tz)) {
      setClockCities(prev => [...prev, def || { name: tz, tz }])
    }
  }

  function removeClockCity(tz) {
    setClockCities(prev => prev.filter(c => c.tz !== tz))
  }

  function handleAdd() {
    const name = tabName.trim() || chosen.name
    let config = {}
    if (chosen.type === 'webpage')    config = { url: webUrl.trim() }
    if (chosen.type === 'bookmarks')  config = { items: [] }
    if (chosen.type === 'notes')      config = {}
    if (chosen.type === 'worldclock') config = { cities: clockCities }
    if (chosen.type === 'weather') {
      if (!weatherResult) return
      config = { city: weatherResult.name, lat: weatherResult.latitude, lon: weatherResult.longitude }
    }
    onAdd({ type: chosen.type, name, icon: chosen.icon, config })
    onClose()
  }

  function canAdd() {
    if (!chosen) return false
    if (chosen.type === 'webpage' && !webUrl.trim()) return false
    if (chosen.type === 'weather' && !weatherResult) return false
    return true
  }

  return (
    <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-box" style={{ width: 480 }}>
        {step === 'pick' && (
          <>
            <div className="modal-title">Add a New Tab</div>
            <div className="modal-sub">Choose what this tab shows</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              {TAB_TYPES.map(t => (
                <div key={t.type} onClick={() => pick(t)}
                  style={{ background: 'var(--s2)', border: '1.5px solid var(--border)', borderRadius: 10, padding: '14px 12px', cursor: 'pointer', transition: 'all var(--t)' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'rgba(91,127,255,.08)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--s2)' }}
                >
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{t.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: "'DM Mono',monospace", lineHeight: 1.5 }}>{t.desc}</div>
                </div>
              ))}
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={onClose}>Cancel</button>
            </div>
          </>
        )}

        {step === 'config' && chosen && (
          <>
            <div className="modal-title">{chosen.icon} {chosen.name}</div>
            <div className="modal-sub">Configure your new tab</div>

            <div className="field">
              <label>Tab Name</label>
              <input type="text" value={tabName} onChange={e => setTabName(e.target.value)} placeholder={chosen.name} maxLength={30} autoFocus />
            </div>

            {chosen.type === 'webpage' && (
              <div className="field">
                <label>URL</label>
                <input type="url" value={webUrl} onChange={e => setWebUrl(e.target.value)} placeholder="https://example.com" />
              </div>
            )}

            {chosen.type === 'weather' && (
              <div>
                <div className="weather-search">
                  <input type="text" className="field" value={weatherCity} onChange={e => setWeatherCity(e.target.value)}
                    placeholder="Search city…" style={{ margin: 0 }}
                    onKeyDown={e => { if (e.key === 'Enter') searchWeatherCity() }} />
                  <button className="btn-primary" style={{ width: 'auto', padding: '9px 14px', fontSize: 12 }} onClick={searchWeatherCity} disabled={weatherSearching}>
                    {weatherSearching ? '…' : 'Search'}
                  </button>
                </div>
                {weatherError && <div className="auth-error" style={{ marginBottom: 12 }}>{weatherError}</div>}
                {weatherResult && (
                  <div style={{ background: 'var(--s2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', marginBottom: 12 }}>
                    <div style={{ fontWeight: 700 }}>{weatherResult.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: "'DM Mono',monospace" }}>
                      {weatherResult.country} · {weatherResult.latitude.toFixed(2)}, {weatherResult.longitude.toFixed(2)}
                    </div>
                  </div>
                )}
              </div>
            )}

            {chosen.type === 'worldclock' && (
              <div>
                <div className="field">
                  <label>Add city</label>
                  <select onChange={e => { if (e.target.value) addClockCity(e.target.value); e.target.value = '' }}
                    style={{ background: 'var(--s2)', border: '1px solid var(--border2)', borderRadius: 8, color: 'var(--text)', fontFamily: "'DM Mono',monospace", fontSize: 13, padding: '9px 12px', cursor: 'pointer', appearance: 'none' }}>
                    <option value="">— Pick a timezone —</option>
                    {COMMON_TIMEZONES.map(c => <option key={c.tz} value={c.tz}>{c.name} ({c.tz})</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                  {clockCities.map(c => (
                    <div key={c.tz} style={{ background: 'var(--s3)', border: '1px solid var(--border2)', borderRadius: 20, padding: '3px 10px 3px 12px', fontSize: 11, fontFamily: "'DM Mono',monospace", color: 'var(--text2)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {c.name}
                      <button onClick={() => removeClockCity(c.tz)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 12, lineHeight: 1, padding: 0 }}>×</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(chosen.type === 'notes' || chosen.type === 'bookmarks') && (
              <div style={{ background: 'var(--s2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 12, color: 'var(--text2)', fontFamily: "'DM Mono',monospace" }}>
                {chosen.type === 'notes' ? 'Your notes auto-save as you type and persist across sessions.' : 'Add bookmarks after creating the tab by clicking the + card.'}
              </div>
            )}

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setStep('pick')}>← Back</button>
              <button className="btn-primary" style={{ width: 'auto' }} onClick={handleAdd} disabled={!canAdd()}>Add Tab →</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2.2: Commit**

```bash
git add frontend/src/dashboard/AddTabModal.jsx
git commit -m "feat: add AddTabModal with type picker and config forms"
```

---

## Task 3: WebPageTab + BookmarksTab

**Files:**
- Create: `frontend/src/dashboard/tabs/WebPageTab.jsx`
- Create: `frontend/src/dashboard/tabs/BookmarksTab.jsx`

- [ ] **Step 3.1: Create `frontend/src/dashboard/tabs/WebPageTab.jsx`**

```jsx
import { useState } from 'react'

function tryHost(u) { try { return new URL(u).hostname } catch { return u } }

export default function WebPageTab({ tab }) {
  const { url } = tab.config
  const [blocked, setBlocked] = useState(false)

  if (!url) return (
    <div className="webpage-blocked tab-panel">
      <h2>No URL configured</h2>
      <p>Edit this tab to set a URL.</p>
    </div>
  )

  if (blocked) return (
    <div className="webpage-blocked tab-panel" style={{ display: 'flex' }}>
      <div style={{ fontSize: 48, marginBottom: 8 }}>🔒</div>
      <h2>Cannot embed this page</h2>
      <p>
        <strong>{tryHost(url)}</strong> blocks embedding in iframes (X-Frame-Options or CSP).
        Open it in a new tab instead.
      </p>
      <a href={url} target="_blank" rel="noopener noreferrer">
        <button className="btn-primary" style={{ width: 'auto', marginTop: 8 }}>Open in new tab ↗</button>
      </a>
    </div>
  )

  return (
    <div className="tab-panel" style={{ overflow: 'hidden' }}>
      <iframe
        className="webpage-frame"
        src={url}
        title={tab.name}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
        onError={() => setBlocked(true)}
        onLoad={e => {
          // Detect blocked frames: contentDocument is null when blocked
          try {
            const doc = e.target.contentDocument
            if (!doc) setBlocked(true)
          } catch {
            setBlocked(true)
          }
        }}
      />
    </div>
  )
}
```

- [ ] **Step 3.2: Create `frontend/src/dashboard/tabs/BookmarksTab.jsx`**

```jsx
import { useState } from 'react'

function tryHost(u) { try { return new URL(u).hostname } catch { return u } }
function faviconUrl(url) {
  try { return `https://www.google.com/s2/favicons?sz=32&domain=${encodeURIComponent(new URL(url).hostname)}` }
  catch { return '' }
}

export default function BookmarksTab({ tab, onUpdateTab }) {
  const items = tab.config.items || []
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newUrl, setNewUrl]   = useState('')

  function addItem() {
    if (!newName.trim() || !newUrl.trim()) return
    const updated = [...items, { id: 'bm_' + Date.now(), name: newName.trim(), url: newUrl.trim() }]
    onUpdateTab(tab.id, { config: { ...tab.config, items: updated } })
    setNewName(''); setNewUrl(''); setShowAdd(false)
  }

  function removeItem(id) {
    onUpdateTab(tab.id, { config: { ...tab.config, items: items.filter(i => i.id !== id) } })
  }

  return (
    <div className="bookmarks-grid">
      {items.map(item => (
        <a key={item.id} className="bookmark-card" href={item.url} target="_blank" rel="noopener noreferrer">
          <img src={faviconUrl(item.url)} alt="" onError={e => { e.target.style.display = 'none' }} />
          <div className="bookmark-card-name">{item.name}</div>
          <div className="bookmark-card-url">{tryHost(item.url)}</div>
          <button className="bookmark-remove" onClick={e => { e.preventDefault(); removeItem(item.id) }}>×</button>
        </a>
      ))}

      {showAdd ? (
        <div style={{ background: 'var(--s2)', border: '1px solid var(--border2)', borderRadius: 'var(--r)', padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input type="text" className="field" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Name" autoFocus style={{ margin: 0 }} />
          <input type="url" value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="https://…" style={{ background: 'var(--s2)', border: '1px solid var(--border2)', borderRadius: 8, color: 'var(--text)', fontFamily: "'DM Mono',monospace", fontSize: 13, padding: '8px 10px', outline: 'none', width: '100%' }}
            onKeyDown={e => { if (e.key === 'Enter') addItem() }} />
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn-primary" style={{ fontSize: 12, padding: '6px 12px' }} onClick={addItem}>Add</button>
            <button className="btn-cancel" style={{ fontSize: 12, padding: '6px 10px' }} onClick={() => setShowAdd(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <div className="bookmark-add-card" onClick={() => setShowAdd(true)}>
          <span style={{ fontSize: 22 }}>+</span>
          <span>Add bookmark</span>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3.3: Commit**

```bash
git add frontend/src/dashboard/tabs/
git commit -m "feat: add WebPageTab and BookmarksTab components"
```

---

## Task 4: NotesTab + WorldClockTab

**Files:**
- Create: `frontend/src/dashboard/tabs/NotesTab.jsx`
- Create: `frontend/src/dashboard/tabs/WorldClockTab.jsx`

- [ ] **Step 4.1: Create `frontend/src/dashboard/tabs/NotesTab.jsx`**

```jsx
import { useState, useEffect, useRef } from 'react'

export default function NotesTab({ tab }) {
  const key = 'wsh_notes_' + tab.id
  const [content, setContent] = useState(() => localStorage.getItem(key) || '')
  const [saveStatus, setSaveStatus] = useState('')
  const timer = useRef(null)

  function handleChange(e) {
    const val = e.target.value
    setContent(val)
    setSaveStatus('Saving…')
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      localStorage.setItem(key, val)
      setSaveStatus('Saved')
      setTimeout(() => setSaveStatus(''), 1500)
    }, 600)
  }

  useEffect(() => () => clearTimeout(timer.current), [])

  return (
    <div className="tab-panel" style={{ position: 'relative', overflow: 'hidden' }}>
      <textarea
        className="notes-textarea"
        value={content}
        onChange={handleChange}
        placeholder="Start typing your notes…"
        spellCheck
      />
      {saveStatus && <div className="notes-status">{saveStatus}</div>}
    </div>
  )
}
```

- [ ] **Step 4.2: Create `frontend/src/dashboard/tabs/WorldClockTab.jsx`**

```jsx
import { useState, useEffect } from 'react'

const COMMON_TIMEZONES = [
  { name: 'New York',    tz: 'America/New_York' },
  { name: 'Los Angeles', tz: 'America/Los_Angeles' },
  { name: 'Chicago',     tz: 'America/Chicago' },
  { name: 'London',      tz: 'Europe/London' },
  { name: 'Paris',       tz: 'Europe/Paris' },
  { name: 'Berlin',      tz: 'Europe/Berlin' },
  { name: 'Dubai',       tz: 'Asia/Dubai' },
  { name: 'Mumbai',      tz: 'Asia/Kolkata' },
  { name: 'Singapore',   tz: 'Asia/Singapore' },
  { name: 'Tokyo',       tz: 'Asia/Tokyo' },
  { name: 'Sydney',      tz: 'Australia/Sydney' },
  { name: 'São Paulo',   tz: 'America/Sao_Paulo' },
]

function getTime(tz) {
  const now = new Date()
  return {
    time: new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(now),
    date: new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short', month: 'short', day: 'numeric' }).format(now),
  }
}

function ClockCard({ city, onRemove }) {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setTick(v => v + 1), 1000)
    return () => clearInterval(t)
  }, [])
  const { time, date } = getTime(city.tz)
  return (
    <div className="clock-card">
      <div className="clock-tz">{city.tz}</div>
      <div className="clock-city">{city.name}</div>
      <div className="clock-time">{time}</div>
      <div className="clock-date">{date}</div>
      <button className="clock-remove" onClick={onRemove}>×</button>
    </div>
  )
}

export default function WorldClockTab({ tab, onUpdateTab }) {
  const cities = tab.config.cities || []

  function addCity(tz) {
    if (cities.find(c => c.tz === tz)) return
    const def = COMMON_TIMEZONES.find(c => c.tz === tz)
    const updated = [...cities, def || { name: tz, tz }]
    onUpdateTab(tab.id, { config: { ...tab.config, cities: updated } })
  }

  function removeCity(tz) {
    onUpdateTab(tab.id, { config: { ...tab.config, cities: cities.filter(c => c.tz !== tz) } })
  }

  const available = COMMON_TIMEZONES.filter(c => !cities.find(e => e.tz === c.tz))

  return (
    <div style={{ padding: '28px 32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800 }}>🕐 World Clock</h2>
        {available.length > 0 && (
          <select onChange={e => { if (e.target.value) addCity(e.target.value); e.target.value = '' }}
            style={{ background: 'var(--s2)', border: '1px solid var(--border2)', borderRadius: 8, color: 'var(--text)', fontFamily: "'DM Mono',monospace", fontSize: 12, padding: '5px 10px', cursor: 'pointer', appearance: 'none' }}>
            <option value="">+ Add city…</option>
            {available.map(c => <option key={c.tz} value={c.tz}>{c.name}</option>)}
          </select>
        )}
      </div>
      {cities.length === 0 && (
        <div style={{ color: 'var(--text3)', fontFamily: "'DM Mono',monospace", fontSize: 12 }}>No cities added. Use the dropdown above to add one.</div>
      )}
      <div className="worldclock-grid">
        {cities.map(city => <ClockCard key={city.tz} city={city} onRemove={() => removeCity(city.tz)} />)}
      </div>
    </div>
  )
}
```

- [ ] **Step 4.3: Commit**

```bash
git add frontend/src/dashboard/tabs/NotesTab.jsx frontend/src/dashboard/tabs/WorldClockTab.jsx
git commit -m "feat: add NotesTab with autosave and WorldClockTab"
```

---

## Task 5: WeatherTab

**Files:**
- Create: `frontend/src/dashboard/tabs/WeatherTab.jsx`

- [ ] **Step 5.1: Create `frontend/src/dashboard/tabs/WeatherTab.jsx`**

```jsx
import { useState, useEffect } from 'react'

// WMO weather code descriptions and emoji
const WMO = {
  0:'Clear sky☀️', 1:'Mainly clear🌤️', 2:'Partly cloudy⛅', 3:'Overcast☁️',
  45:'Foggy🌫️', 48:'Icy fog🌫️', 51:'Light drizzle🌦️', 53:'Drizzle🌦️', 55:'Heavy drizzle🌧️',
  61:'Light rain🌧️', 63:'Rain🌧️', 65:'Heavy rain🌧️',
  71:'Light snow❄️', 73:'Snow❄️', 75:'Heavy snow❄️',
  77:'Snow grains🌨️', 80:'Light showers🌦️', 81:'Showers🌦️', 82:'Heavy showers⛈️',
  85:'Snow showers🌨️', 86:'Heavy snow showers🌨️',
  95:'Thunderstorm⛈️', 96:'Thunderstorm with hail⛈️', 99:'Heavy thunderstorm⛈️',
}

function wmoInfo(code) {
  const full = WMO[code] || 'Unknown'
  const emoji = full.match(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]/u)?.[0] || '🌡️'
  const desc  = full.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]/gu, '').trim()
  return { emoji, desc }
}

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

export default function WeatherTab({ tab }) {
  const { city, lat, lon } = tab.config
  const [weather, setWeather] = useState(null)
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!lat || !lon) { setLoading(false); return }
    setLoading(true)
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto&forecast_days=7`)
      .then(r => r.json())
      .then(d => {
        setWeather(d)
        setLoading(false)
      })
      .catch(() => { setError('Failed to load weather. Check your connection.'); setLoading(false) })
  }, [lat, lon])

  if (!city) return (
    <div className="custom-tab-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'var(--text3)', fontFamily: "'DM Mono',monospace", fontSize: 12 }}>No city configured.</div>
    </div>
  )

  if (loading) return (
    <div className="custom-tab-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'var(--text3)', fontFamily: "'DM Mono',monospace", fontSize: 12 }}>Loading weather for {city}…</div>
    </div>
  )

  if (error) return (
    <div className="custom-tab-panel">
      <div className="auth-error">{error}</div>
    </div>
  )

  const cw    = weather.current_weather
  const daily = weather.daily
  const { emoji: currentEmoji, desc: currentDesc } = wmoInfo(cw.weathercode)

  return (
    <div className="custom-tab-panel">
      <div className="weather-panel">
        <div className="weather-city-name">{city}</div>
        <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: "'DM Mono',monospace", marginBottom: 8 }}>
          {lat.toFixed(2)}, {lon.toFixed(2)}
        </div>
        <div className="weather-current">
          <div style={{ fontSize: 56 }}>{currentEmoji}</div>
          <div>
            <div className="weather-temp">{Math.round(cw.temperature)}°C</div>
            <div className="weather-desc">{currentDesc}</div>
            <div className="weather-detail">Wind: {Math.round(cw.windspeed)} km/h</div>
          </div>
        </div>
        {daily && (
          <div className="weather-daily">
            {daily.time.map((date, i) => {
              const { emoji } = wmoInfo(daily.weathercode[i])
              const d = new Date(date)
              return (
                <div key={date} className="weather-day">
                  <div className="weather-day-name">{DAYS[d.getDay()]}</div>
                  <div className="weather-day-icon">{emoji}</div>
                  <div className="weather-day-temp">
                    {Math.round(daily.temperature_2m_max[i])}° / {Math.round(daily.temperature_2m_min[i])}°
                  </div>
                </div>
              )
            })}
          </div>
        )}
        <div style={{ marginTop: 20, fontSize: 10, color: 'var(--text3)', fontFamily: "'DM Mono',monospace" }}>
          Weather data from Open-Meteo.com · Free, no API key
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 5.2: Commit**

```bash
git add frontend/src/dashboard/tabs/WeatherTab.jsx
git commit -m "feat: add WeatherTab with Open-Meteo free API"
```

---

## Task 6: Wire custom tabs into DashboardPage

**Files:**
- Modify: `frontend/src/pages/DashboardPage.jsx`

- [ ] **Step 6.1: Replace `frontend/src/pages/DashboardPage.jsx`**

```jsx
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useHubState } from '../dashboard/hooks/useHubState'
import { useOpenWindows } from '../dashboard/hooks/useOpenWindows'
import { useCustomTabs } from '../dashboard/hooks/useCustomTabs'
import { DEFAULT_NEWS_SOURCES } from '../dashboard/constants'
import Sidebar from '../dashboard/Sidebar'
import AppsTab from '../dashboard/AppsTab'
import NewsTab from '../dashboard/NewsTab'
import ContextMenu from '../dashboard/ContextMenu'
import AppModal from '../dashboard/AppModal'
import GroupModal from '../dashboard/GroupModal'
import ManageGroupsModal from '../dashboard/ManageGroupsModal'
import SourceModal from '../dashboard/SourceModal'
import AddTabModal from '../dashboard/AddTabModal'
import WebPageTab from '../dashboard/tabs/WebPageTab'
import BookmarksTab from '../dashboard/tabs/BookmarksTab'
import NotesTab from '../dashboard/tabs/NotesTab'
import WorldClockTab from '../dashboard/tabs/WorldClockTab'
import WeatherTab from '../dashboard/tabs/WeatherTab'
import '../dashboard/dashboard.css'

function loadNewsSources() {
  try { return JSON.parse(localStorage.getItem('wsh_news_sources')) || JSON.parse(JSON.stringify(DEFAULT_NEWS_SOURCES)) }
  catch { return JSON.parse(JSON.stringify(DEFAULT_NEWS_SOURCES)) }
}

function CustomTabPanel({ tab, onUpdateTab }) {
  if (tab.type === 'webpage')    return <WebPageTab tab={tab} />
  if (tab.type === 'bookmarks')  return <BookmarksTab tab={tab} onUpdateTab={onUpdateTab} />
  if (tab.type === 'notes')      return <NotesTab tab={tab} />
  if (tab.type === 'worldclock') return <WorldClockTab tab={tab} onUpdateTab={onUpdateTab} />
  if (tab.type === 'weather')    return <WeatherTab tab={tab} />
  return null
}

export default function DashboardPage() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const hub = useHubState()
  const { openApp, isOpen } = useOpenWindows()
  const customTabs = useCustomTabs()

  const [activeTab, setActiveTab] = useState('news')
  const [sources, setSources] = useState(loadNewsSources)
  const [ctx, setCtx] = useState(null)
  const [appModal, setAppModal] = useState(null)
  const [groupModal, setGroupModal] = useState(null)
  const [showManage, setShowManage] = useState(false)
  const [showSourceModal, setShowSourceModal] = useState(false)
  const [showAddTab, setShowAddTab] = useState(false)

  // Drag state for tab reordering
  const dragTabId = useRef(null)

  useEffect(() => { localStorage.setItem('wsh_news_sources', JSON.stringify(sources)) }, [sources])

  useEffect(() => {
    function handler(e) {
      if (appModal || groupModal || showManage || showAddTab) return
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); openAddApp(); return }
      if (e.key === 'Escape') { setCtx(null); return }
      const parts = []
      if (e.ctrlKey) parts.push('Ctrl'); if (e.metaKey) parts.push('Cmd')
      if (e.altKey) parts.push('Alt'); if (e.shiftKey) parts.push('Shift')
      parts.push(e.key.length === 1 ? e.key.toUpperCase() : e.key)
      const sc = parts.join('+')
      const match = hub.apps.find(a => a.shortcut === sc)
      if (match) { e.preventDefault(); openApp(match) }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [hub.apps, appModal, groupModal, showManage, showAddTab, openApp])

  function handleContextMenu(e, appId) {
    const app = hub.getApp(appId)
    if (!app) return
    setCtx({ x: e.clientX + 4, y: e.clientY + 4, appId, appName: app.name, isOpen: isOpen(appId) })
  }
  function handleCtxMoveToGroup(appId, groupId) { hub.moveApp(appId, groupId); setCtx(null) }
  function handleCtxNewGroup(appId) { setGroupModal({ id: null, _pendingAppId: appId }) }

  function openAddApp(defaultGroupId) {
    setAppModal({ app: { id: '__new__', name: '', url: '', groupId: defaultGroupId || hub.groups[0]?.id || '', emoji: null, favicon: '', shortcut: '' } })
  }
  function openEditApp(appId, focusField) {
    const app = hub.getApp(appId)
    if (app) setAppModal({ app: { ...app }, focusField })
  }
  function handleSaveApp(data) { hub.saveApp(data); setAppModal(null) }
  function handleDeleteApp(id) { hub.deleteApp(id); setAppModal(null) }

  function handleSaveGroup(data) {
    const pendingAppId = groupModal?._pendingAppId
    const newId = data.id || ('g_' + Date.now())
    hub.saveGroup({ ...data, id: newId })
    if (pendingAppId && !data.id) hub.moveApp(pendingAppId, newId)
    setGroupModal(null); setShowManage(false)
  }
  function handleDeleteGroup(id) { hub.deleteGroup(id); setGroupModal(null); setShowManage(false) }

  function handleAddCustomTab(tabData) {
    const id = customTabs.addTab(tabData)
    setActiveTab(id)
  }

  function handleCloseCustomTab(e, id) {
    e.stopPropagation()
    if (activeTab === id) setActiveTab('news')
    customTabs.removeTab(id)
  }

  // Tab drag-to-reorder
  function handleTabDragStart(e, id) { dragTabId.current = id; e.dataTransfer.effectAllowed = 'move' }
  function handleTabDrop(e, targetId) {
    e.preventDefault()
    const sourceId = dragTabId.current
    if (!sourceId || sourceId === targetId) return
    const ids = customTabs.tabs.map(t => t.id)
    const si = ids.indexOf(sourceId), ti = ids.indexOf(targetId)
    if (si < 0 || ti < 0) return
    const newOrder = [...ids]; newOrder.splice(si, 1); newOrder.splice(ti, 0, sourceId)
    customTabs.reorderTabs(newOrder)
  }

  async function handleLogout() { await logout(); navigate('/') }

  const activeCustomTab = customTabs.tabs.find(t => t.id === activeTab)

  return (
    <div id="dashboard-root">
      <Sidebar
        groups={hub.groups}
        apps={hub.apps}
        openApp={openApp}
        isOpen={isOpen}
        onAddApp={() => openAddApp()}
        onContextMenu={handleContextMenu}
      />

      <div id="db-main">
        {/* TAB BAR */}
        <div id="tabs-bar">
          {/* Fixed tabs */}
          <button className={`tab-btn${activeTab === 'news' ? ' active' : ''}`} onClick={() => setActiveTab('news')}>
            <span>📰</span>News
          </button>
          <div className="tab-divider" />
          <button className={`tab-btn${activeTab === 'hub' ? ' active' : ''}`} onClick={() => setActiveTab('hub')}>
            <span>⚡</span>Apps
          </button>
          <div className="tab-divider" />

          {/* Custom tabs */}
          {customTabs.tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-btn-custom${activeTab === tab.id ? ' active' : ''}`}
              draggable
              onDragStart={e => handleTabDragStart(e, tab.id)}
              onDragOver={e => e.preventDefault()}
              onDrop={e => handleTabDrop(e, tab.id)}
              onClick={() => setActiveTab(tab.id)}
            >
              <span>{tab.icon}</span>
              {tab.name}
              <button
                className="tab-close-btn"
                onClick={e => handleCloseCustomTab(e, tab.id)}
                title="Close tab"
              >×</button>
            </button>
          ))}

          {/* Add tab button */}
          <button className="tab-add-btn" onClick={() => setShowAddTab(true)} title="Add new tab">+</button>

          <div className="tab-spacer" />

          {/* Tab-specific actions */}
          <div className="tab-actions">
            {activeTab === 'news' && (
              <button className="news-add-source-btn" onClick={() => setShowSourceModal(true)}>+ Source</button>
            )}
            {activeTab === 'hub' && (
              <>
                <button className="tb-btn" onClick={() => setShowManage(true)}>⊞ Groups</button>
                <button className="tb-btn" onClick={() => openAddApp()}>+ Add App</button>
                <button className="open-all-btn" onClick={() => hub.apps.forEach((app, i) => setTimeout(() => openApp(app), i * 100))}>⚡ Open All</button>
              </>
            )}
            <button className="tb-btn" onClick={handleLogout} style={{ marginLeft: 8 }}>Log out</button>
          </div>
        </div>

        {/* TAB PANELS */}
        {activeTab === 'news' && (
          <div className="tab-panel">
            <NewsTab sources={sources} onSourcesChange={setSources} onAddSource={() => setShowSourceModal(true)} />
          </div>
        )}
        {activeTab === 'hub' && (
          <div className="tab-panel">
            <AppsTab
              groups={hub.groups} apps={hub.apps} isOpen={isOpen} openApp={openApp}
              onContextMenu={handleContextMenu} onAddApp={openAddApp}
              onEditGroup={(id) => setGroupModal(hub.getGroup(id))}
              onReorder={hub.reorderApps}
            />
          </div>
        )}
        {activeCustomTab && (
          <div className="tab-panel">
            <CustomTabPanel tab={activeCustomTab} onUpdateTab={customTabs.updateTab} />
          </div>
        )}
      </div>

      {/* MODALS + OVERLAYS */}
      {ctx && (
        <ContextMenu ctx={ctx} groups={hub.groups} onClose={() => setCtx(null)}
          onOpen={(id) => openApp(hub.getApp(id))} onEdit={openEditApp}
          onDelete={handleDeleteApp} onMoveToGroup={handleCtxMoveToGroup} onNewGroup={handleCtxNewGroup} />
      )}
      {appModal && (
        <AppModal app={appModal.app} groups={hub.groups} onSave={handleSaveApp}
          onDelete={handleDeleteApp} onClose={() => setAppModal(null)} />
      )}
      {groupModal && (
        <GroupModal group={groupModal.id ? groupModal : null} onSave={handleSaveGroup}
          onDelete={handleDeleteGroup} onClose={() => setGroupModal(null)} />
      )}
      {showManage && (
        <ManageGroupsModal groups={hub.groups} apps={hub.apps}
          onEdit={(id) => { setShowManage(false); setGroupModal(hub.getGroup(id)) }}
          onNew={() => { setShowManage(false); setGroupModal({}) }}
          onMoveUp={hub.moveGroupUp} onMoveDown={hub.moveGroupDown}
          onClose={() => setShowManage(false)} />
      )}
      {showSourceModal && (
        <SourceModal
          onSave={(src) => { setSources(prev => [...prev, src]); setShowSourceModal(false) }}
          onClose={() => setShowSourceModal(false)} />
      )}
      {showAddTab && (
        <AddTabModal onAdd={handleAddCustomTab} onClose={() => setShowAddTab(false)} />
      )}
    </div>
  )
}
```

- [ ] **Step 6.2: Build to verify no errors**

```bash
cd frontend && npm run build
```

Expected: Build succeeds, 60+ modules. No import or syntax errors.

- [ ] **Step 6.3: Commit and push**

```bash
cd ..
git add frontend/src/pages/DashboardPage.jsx
git commit -m "feat: wire custom tabs into DashboardPage with drag-to-reorder"
git push origin main
```

---

## Task 7: Production deploy + smoke test

- [ ] **Step 7.1: Deploy to production via SSH**

```bash
ssh -p 2222 root@clouddesktop.infoplay.com
cd /var/www/clouddesktop && git stash || true && git pull origin main
cd frontend && npm install && npm run build
cd ../backend && pm2 restart clouddesktop-api --update-env
```

- [ ] **Step 7.2: Smoke test at https://clouddesktop.infoplay.com/dashboard**

- [ ] + button appears in tab bar after Apps tab
- [ ] Clicking + opens AddTabModal with 5 type cards
- [ ] Adding a **Web Page** tab (e.g. wikipedia.org) shows iframe or blocked fallback
- [ ] Adding a **Bookmarks** tab shows empty grid + add card, can add/remove links
- [ ] Adding a **Notes** tab shows textarea, typing auto-saves, content persists on refresh
- [ ] Adding a **World Clock** tab shows clock cards, dropdown adds cities, × removes them
- [ ] Adding a **Weather** tab with city search shows 7-day forecast
- [ ] Custom tabs show in tab bar with × close button
- [ ] Dragging custom tabs reorders them
- [ ] Closing a tab with × removes it and returns to News tab
- [ ] Custom tabs persist in localStorage across page refresh (wsh_custom_tabs key)

---

## Stage 5 Complete

Users can now create unlimited custom tabs of 5 types. All tab state persists in `wsh_custom_tabs` localStorage. Notes content persists per-tab in `wsh_notes_{id}`. Weather uses Open-Meteo free API with no key required.

Next: **Stage 6 — Stripe billing** (pricing page, checkout, webhooks, premium plan enforcement)
