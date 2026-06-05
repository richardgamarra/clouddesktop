import { useState, useRef, useCallback } from 'react'

export const DESKTOP_KEY = 'wsh_desktop_apps'
export const ICONS_KEY   = 'wsh_app_icons'

// Icons are stored in their own key — simple { appId: dataUrl } map.
// Keeping them separate means the main apps blob stays small and
// JSON.stringify/parse never touches a large base64 string.
function loadIcons() {
  try { return JSON.parse(localStorage.getItem(ICONS_KEY)) || {} } catch { return {} }
}
function saveIcons(icons) {
  try { localStorage.setItem(ICONS_KEY, JSON.stringify(icons)) } catch {}
}
export function getAppIcon(appId) {
  return loadIcons()[appId] || null
}
function setAppIcon(appId, dataUrl) {
  const icons = loadIcons()
  if (dataUrl) icons[appId] = dataUrl
  else delete icons[appId]
  saveIcons(icons)
  return icons
}

const DEFAULT_DATA = {
  groups: [{ id: 'g_default', name: 'My Apps', color: '#5b7fff' }],
  apps: [],
}

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(DESKTOP_KEY))
    if (saved && saved.groups) return saved
    // Migrate from old wsh_groups + wsh_apps keys
    const oldGroups = JSON.parse(localStorage.getItem('wsh_groups') || 'null')
    const oldApps   = JSON.parse(localStorage.getItem('wsh_apps')   || 'null')
    if (oldGroups || oldApps) {
      const migrated = {
        groups: oldGroups || DEFAULT_DATA.groups,
        apps:   (oldApps || []).filter(a => a.id !== 'terminal' && a.id !== 'guacamole'),
      }
      localStorage.setItem(DESKTOP_KEY, JSON.stringify(migrated))
      return migrated
    }
    return DEFAULT_DATA
  } catch { return DEFAULT_DATA }
}

export function useDesktopApps() {
  const initial = load()
  const ref = useRef(initial)
  const [data, setData] = useState(initial)

  const commit = useCallback((next) => {
    ref.current = next
    try { localStorage.setItem(DESKTOP_KEY, JSON.stringify(next)) } catch {}
    setData(next)
  }, [])

  const saveGroup = useCallback((groupData) => {
    const prev = ref.current
    const id = groupData.id || ('g_' + Date.now())
    const exists = prev.groups.find(g => g.id === id)
    const groups = exists
      ? prev.groups.map(g => g.id === id ? { ...g, ...groupData, id } : g)
      : [...prev.groups, { ...groupData, id }]
    commit({ ...prev, groups })
  }, [commit])

  const deleteGroup = useCallback((id) => {
    const prev = ref.current
    commit({
      ...prev,
      groups: prev.groups.filter(g => g.id !== id),
      apps: prev.apps.map(a => a.groupId === id ? { ...a, groupId: null } : a),
    })
  }, [commit])

  const moveGroupUp = useCallback((id) => {
    const prev = ref.current
    const i = prev.groups.findIndex(g => g.id === id)
    if (i <= 0) return
    const groups = [...prev.groups];
    [groups[i - 1], groups[i]] = [groups[i], groups[i - 1]]
    commit({ ...prev, groups })
  }, [commit])

  const moveGroupDown = useCallback((id) => {
    const prev = ref.current
    const i = prev.groups.findIndex(g => g.id === id)
    if (i < 0 || i >= prev.groups.length - 1) return
    const groups = [...prev.groups];
    [groups[i], groups[i + 1]] = [groups[i + 1], groups[i]]
    commit({ ...prev, groups })
  }, [commit])

  const saveApp = useCallback((appData) => {
    const prev = ref.current
    const appId = appData.id || ('app_' + Date.now())
    // Store customIcon directly in the app entry — same pattern as BookmarksTab.
    // This ensures icon + data travel together as one blob in wsh_desktop_apps
    // and can never get out of sync with a separate key.
    const entry = { ...appData, id: appId }
    let apps
    if (!appData.id) {
      apps = [...prev.apps, entry]
    } else {
      const exists = prev.apps.find(a => a.id === appData.id)
      apps = exists
        ? prev.apps.map(a => a.id === appData.id ? { ...a, ...entry } : a)
        : [...prev.apps, entry]
    }
    commit({ ...prev, apps })
  }, [commit])

  const deleteApp = useCallback((id) => {
    const prev = ref.current
    commit({ ...prev, apps: prev.apps.filter(a => a.id !== id) })
  }, [commit])

  const moveApp = useCallback((appId, groupId) => {
    const prev = ref.current
    commit({ ...prev, apps: prev.apps.map(a => a.id === appId ? { ...a, groupId } : a) })
  }, [commit])

  const reorderApps = useCallback((gid, newOrder) => {
    const prev = ref.current
    const others = prev.apps.filter(a => a.groupId !== gid)
    const reordered = newOrder.map(id => prev.apps.find(a => a.id === id)).filter(Boolean).map(a => ({ ...a, groupId: gid }))
    commit({ ...prev, apps: [...others.filter(a => !reordered.find(r => r.id === a.id)), ...reordered] })
  }, [commit])

  return {
    groups: data.groups,
    apps: data.apps,
    saveGroup,
    deleteGroup,
    moveGroupUp,
    moveGroupDown,
    saveApp,
    deleteApp,
    moveApp,
    reorderApps,
    getGroup: (id) => ref.current.groups.find(g => g.id === id),
    getApp:   (id) => ref.current.apps.find(a => a.id === id),
    appsInGroup: (gid) => ref.current.apps.filter(a => a.groupId === gid),
  }
}
