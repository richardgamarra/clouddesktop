import { useState, useEffect, useCallback } from 'react'
import { DEFAULT_GROUPS, DEFAULT_APPS } from '../constants'

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback }
  catch { return fallback }
}

export function useHubState() {
  const [groups, setGroups] = useState(() => {
    const g = load('wsh_groups', DEFAULT_GROUPS)
    // Seed Tools group if missing
    if (!g.find(x => x.id === 'g_tools')) g.push({ id:'g_tools', name:'Tools', color:'#a78bfa' })
    return g
  })
  const [apps, setApps] = useState(() => {
    const a = load('wsh_apps', DEFAULT_APPS)
    // Fix Google icons to real gstatic URLs for existing users
    const GSTATIC = {
      gmail:  'https://www.gstatic.com/images/branding/product/1x/gmail_48dp.png',
      gdocs:  'https://www.gstatic.com/images/branding/product/1x/docs_48dp.png',
      gdrive: 'https://www.gstatic.com/images/branding/product/1x/drive_48dp.png',
      gkeep:  'https://www.gstatic.com/images/branding/product/1x/keep_48dp.png',
      gcal:   'https://www.gstatic.com/images/branding/product/1x/calendar_48dp.png',
    }
    a.forEach(app => {
      if (GSTATIC[app.id]) { app.favicon = GSTATIC[app.id]; app.emoji = null }
    })
    return a
  })

  useEffect(() => { localStorage.setItem('wsh_groups', JSON.stringify(groups)) }, [groups])
  useEffect(() => { localStorage.setItem('wsh_apps',   JSON.stringify(apps))   }, [apps])

  const getGroup = useCallback((id) => groups.find(g => g.id === id), [groups])
  const getApp   = useCallback((id) => apps.find(a => a.id === id),   [apps])
  const appsInGroup    = useCallback((gid) => apps.filter(a => a.groupId === gid), [apps])
  const ungroupedApps  = useCallback(() => apps.filter(a => !a.groupId || !groups.find(g => g.id === a.groupId)), [apps, groups])

  const saveApp = useCallback((appData) => {
    setApps(prev => {
      const exists = prev.find(a => a.id === appData.id)
      if (exists) return prev.map(a => a.id === appData.id ? { ...a, ...appData } : a)
      return [...prev, { id: 'app_' + Date.now(), ...appData }]
    })
  }, [])

  const deleteApp = useCallback((id) => {
    setApps(prev => prev.filter(a => a.id !== id))
  }, [])

  const moveApp = useCallback((appId, groupId) => {
    setApps(prev => prev.map(a => a.id === appId ? { ...a, groupId } : a))
  }, [])

  const reorderApps = useCallback((gid, newOrder) => {
    setApps(prev => {
      const others = prev.filter(a => a.groupId !== gid)
      const reordered = newOrder.map(id => prev.find(a => a.id === id)).filter(Boolean).map(a => ({ ...a, groupId: gid }))
      return [...others.filter(a => !reordered.find(r => r.id === a.id)), ...reordered]
    })
  }, [])

  const saveGroup = useCallback((groupData) => {
    setGroups(prev => {
      const exists = prev.find(g => g.id === groupData.id)
      if (exists) return prev.map(g => g.id === groupData.id ? { ...g, ...groupData } : g)
      return [...prev, { id: 'g_' + Date.now(), ...groupData }]
    })
  }, [])

  const deleteGroup = useCallback((id) => {
    setGroups(prev => prev.filter(g => g.id !== id))
    setApps(prev => prev.map(a => a.groupId === id ? { ...a, groupId: null } : a))
  }, [])

  const moveGroupUp = useCallback((id) => {
    setGroups(prev => {
      const i = prev.findIndex(g => g.id === id)
      if (i <= 0) return prev
      const next = [...prev]; [next[i - 1], next[i]] = [next[i], next[i - 1]]; return next
    })
  }, [])

  const moveGroupDown = useCallback((id) => {
    setGroups(prev => {
      const i = prev.findIndex(g => g.id === id)
      if (i < 0 || i >= prev.length - 1) return prev
      const next = [...prev]; [next[i], next[i + 1]] = [next[i + 1], next[i]]; return next
    })
  }, [])

  return {
    groups, apps, getGroup, getApp, appsInGroup, ungroupedApps,
    saveApp, deleteApp, moveApp, reorderApps,
    saveGroup, deleteGroup, moveGroupUp, moveGroupDown,
  }
}
