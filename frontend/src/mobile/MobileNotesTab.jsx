import { useState, useRef, useEffect } from 'react'

const SNAPVAULT_URL = 'https://notesvault.infoplay.com'

export default function MobileNotesTab() {
  const [status, setStatus] = useState('loading') // 'loading' | 'loaded' | 'blocked'
  const iframeRef = useRef(null)
  const timeoutRef = useRef(null)

  useEffect(() => {
    // If iframe hasn't fired onLoad within 8 s, assume it's blocked
    timeoutRef.current = setTimeout(() => {
      if (status === 'loading') setStatus('blocked')
    }, 8000)
    return () => clearTimeout(timeoutRef.current)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleLoad() {
    clearTimeout(timeoutRef.current)
    // Try to read contentDocument — if X-Frame-Options blocked the load the
    // browser replaces the frame with an error page; we can't distinguish it
    // from a successful cross-origin load via JS, so we just mark it loaded
    // and show the "Can't see it? Open externally" footer as a safety net.
    setStatus('loaded')
  }

  function openExternal() {
    window.open(SNAPVAULT_URL, '_blank', 'noopener,noreferrer')
  }

  if (status === 'blocked') {
    return (
      <div className="m-notes-blocked">
        <div className="m-notes-blocked-icon">📝</div>
        <p className="m-notes-blocked-title">SnapVault can't be embedded</p>
        <p className="m-notes-blocked-sub">The site's security settings prevent it from opening inside this app.</p>
        <button className="m-notes-open-btn" onClick={openExternal}>
          Open SnapVault ↗
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
      {/* Scroll wrapper is required for iOS — iframes don't scroll
          via touch events unless their parent has overflow+momentum scroll */}
      <div className="m-notes-scroll-wrap">
        <iframe
          ref={iframeRef}
          src={SNAPVAULT_URL}
          title="NotesVault"
          className="m-notes-iframe"
          style={{ opacity: status === 'loaded' ? 1 : 0 }}
          onLoad={handleLoad}
          allow="clipboard-read; clipboard-write"
          scrolling="yes"
        />
      </div>
      {status === 'loaded' && (
        <button className="m-notes-ext-btn" onClick={openExternal} title="Open in browser">
          ↗
        </button>
      )}
    </div>
  )
}
