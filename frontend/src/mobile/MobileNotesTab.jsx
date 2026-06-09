import { useState, useRef, useEffect } from 'react'

const NOTESVAULT_URL = 'https://notesvault.infoplay.com'

export default function MobileNotesTab() {
  const [status, setStatus] = useState('loading') // 'loading' | 'loaded' | 'blocked'
  const [shellH, setShellH] = useState(0)
  const iframeRef = useRef(null)
  const timeoutRef = useRef(null)

  // Calculate the exact visible height so NotesVault renders a normal mobile layout
  useEffect(() => {
    function measure() {
      const topbar  = 52
      const tabbar  = 60
      // env(safe-area-inset-bottom) isn't readable via JS directly; 34px covers iPhone notch
      const safeBot = window.innerHeight > 800 ? 34 : 0
      setShellH(window.innerHeight - topbar - tabbar - safeBot)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      if (status === 'loading') setStatus('blocked')
    }, 8000)
    return () => clearTimeout(timeoutRef.current)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleLoad() {
    clearTimeout(timeoutRef.current)
    setStatus('loaded')
  }

  function openExternal() {
    window.open(NOTESVAULT_URL, '_blank', 'noopener,noreferrer')
  }

  if (status === 'blocked') {
    return (
      <div className="m-notes-blocked">
        <div className="m-notes-blocked-icon">📝</div>
        <p className="m-notes-blocked-title">NotesVault can't be embedded</p>
        <p className="m-notes-blocked-sub">The site's security settings prevent it from opening inside this app.</p>
        <button className="m-notes-open-btn" onClick={openExternal}>
          Open NotesVault ↗
        </button>
      </div>
    )
  }

  return (
    <div className="m-notes-shell">
      {status === 'loading' && (
        <div className="m-notes-loading">
          <div className="m-notes-spinner" />
          <span>Loading NotesVault…</span>
        </div>
      )}
      <iframe
        ref={iframeRef}
        src={NOTESVAULT_URL}
        title="NotesVault"
        className="m-notes-iframe"
        style={{
          opacity: status === 'loaded' ? 1 : 0,
          height: shellH > 0 ? shellH : '100%',
        }}
        onLoad={handleLoad}
        allow="clipboard-read; clipboard-write"
        scrolling="yes"
      />
      {status === 'loaded' && (
        <button className="m-notes-ext-btn" onClick={openExternal} title="Open in browser">
          ↗
        </button>
      )}
    </div>
  )
}
