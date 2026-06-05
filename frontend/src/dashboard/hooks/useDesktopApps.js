import { useState, useCallback } from 'react'

export const DESKTOP_KEY = 'wsh_desktop_apps'

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

// Write synchronously inside the setState updater — guarantees localStorage is
// always written before any subsequent code (sync calls, re-renders, etc.)
function makeUpdater(fn) {
  return prev => {
    const next = fn(prev)
    try { localStorage.setItem(DESKTOP_KEY, JSON.stringify(next)) } catch {}
    return next
  }
}

export function useDesktopApps() {
  const [data, setData] = useState(load)

  const saveGroup = useCallback((groupData) => {
    setData(makeUpdater(prev => {
      const id = groupData.id || ('g_' + Date.now())
      const exists = prev.groups.find(g => g.id === id)
      const groups = exists
        ? prev.groups.map(g => g.id === id ? { ...g, ...groupData, id } : g)
        : [...prev.groups, { ...groupData, id }]
      return { ...prev, groups }
    }))
  }, [])

  const deleteGroup = useCallback((id) => {
    setData(makeUpdater(prev => ({
      ...prev,
      groups: prev.groups.filter(g => g.id !== id),
      apps: prev.apps.map(a => a.groupId === id ? { ...a, groupId: null } : a),
    })))
  }, [])

  const moveGroupUp = useCallback((id) => {
    setData(makeUpdater(prev => {
      const i = prev.groups.findIndex(g => g.id === id)
      if (i <= 0) return prev
      const groups = [...prev.groups];
      [groups[i - 1], groups[i]] = [groups[i], groups[i - 1]]
      return { ...prev, groups }
    }))
  }, [])

  const moveGroupDown = useCallback((id) => {
    setData(makeUpdater(prev => {
      const i = prev.groups.findIndex(g => g.id === id)
      if (i < 0 || i >= prev.groups.length - 1) return prev
      const groups = [...prev.groups];
      [groups[i], groups[i + 1]] = [groups[i + 1], groups[i]]
      return { ...prev, groups }
    }))
  }, [])

  const saveApp = useCallback((appData) => {
    setData(makeUpdater(prev => {
      if (!appData.id) return { ...prev, apps: [...prev.apps, { ...appData, id: 'app_' + Date.now() }] }
      const exists = prev.apps.find(a => a.id === appData.id)
      if (exists) return { ...prev, apps: prev.apps.map(a => a.id === appData.id ? { ...a, ...appData } : a) }
      return { ...prev, apps: [...prev.apps, { id: 'app_' + Date.now(), ...appData }] }
    }))
  }, [])

  const deleteApp = useCallback((id) => {
    setData(makeUpdater(prev => ({ ...prev, apps: prev.apps.filter(a => a.id !== id) })))
  }, [])

  const moveApp = useCallback((appId, groupId) => {
    setData(makeUpdater(prev => ({ ...prev, apps: prev.apps.map(a => a.id === appId ? { ...a, groupId } : a) })))
  }, [])

  const reorderApps = useCallback((gid, newOrder) => {
    setData(makeUpdater(prev => {
      const others = prev.apps.filter(a => a.groupId !== gid)
      const reordered = newOrder.map(id => prev.apps.find(a => a.id === id)).filter(Boolean).map(a => ({ ...a, groupId: gid }))
      return { ...prev, apps: [...others.filter(a => !reordered.find(r => r.id === a.id)), ...reordered] }
    }))
  }, [])

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
    getGroup: (id) => data.groups.find(g => g.id === id),
    getApp:   (id) => data.apps.find(a => a.id === id),
    appsInGroup: (gid) => data.apps.filter(a => a.groupId === gid),
  }
}
