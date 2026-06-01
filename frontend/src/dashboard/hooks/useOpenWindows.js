import { useRef, useState, useCallback, useEffect } from 'react'

export function useOpenWindows() {
  const winRefs = useRef({})
  const [openIds, setOpenIds] = useState(new Set())

  useEffect(() => {
    const timer = setInterval(() => {
      const refs = winRefs.current
      let changed = false
      Object.keys(refs).forEach(id => {
        if (refs[id]?.win?.closed) { delete refs[id]; changed = true }
      })
      if (changed) setOpenIds(new Set(Object.keys(winRefs.current)))
    }, 1500)
    return () => clearInterval(timer)
  }, [])

  const openApp = useCallback((app) => {
    const ref = winRefs.current[app.id]
    if (ref?.win && !ref.win.closed) {
      try { ref.win.focus() } catch {}
      setOpenIds(prev => new Set([...prev, app.id]))
      return
    }
    const win = window.open(app.url, 'wshub_' + app.id)
    if (win) {
      winRefs.current[app.id] = { win }
      try { win.focus() } catch {}
      setOpenIds(prev => new Set([...prev, app.id]))
    } else {
      if (confirm(`Popup blocked for "${app.name}". Allow popups then retry.\n\nOpen directly?`)) {
        window.open(app.url, 'wshub_' + app.id)
      }
    }
  }, [])

  const isOpen = useCallback((id) => openIds.has(id), [openIds])

  return { openApp, isOpen }
}
