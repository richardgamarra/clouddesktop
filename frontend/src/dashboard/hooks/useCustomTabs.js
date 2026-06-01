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
