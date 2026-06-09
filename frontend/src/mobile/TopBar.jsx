import { useState, useRef, useEffect } from 'react'

const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)

export default function TopBar({ user, onLogout }) {
  const initial = (user?.email || user?.role || 'U')[0].toUpperCase()
  const [open, setOpen]               = useState(false)
  const [installPrompt, setInstallPrompt] = useState(null)
  const [isStandalone, setIsStandalone]   = useState(false)
  const [showInstallTip, setShowInstallTip] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    setIsStandalone(
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    )
  }, [])

  useEffect(() => {
    function handler(e) { e.preventDefault(); setInstallPrompt(e) }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleInstall() {
    if (installPrompt) {
      installPrompt.prompt()
      await installPrompt.userChoice
      setInstallPrompt(null)
      setOpen(false)
    } else {
      // No prompt available — show manual instructions
      setOpen(false)
      setShowInstallTip(true)
    }
  }

  useEffect(() => {
    if (!open) return
    function onOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    document.addEventListener('touchstart', onOutside)
    return () => {
      document.removeEventListener('mousedown', onOutside)
      document.removeEventListener('touchstart', onOutside)
    }
  }, [open])

  return (
    <>
      <div className="m-topbar">
        <div className="m-topbar-logo">
          <span>☁</span>CloudDesktop
        </div>

        <div className="m-topbar-menu" ref={menuRef}>
          <button className="m-avatar-btn" onClick={() => setOpen(v => !v)} aria-label="Account menu">
            {initial}
          </button>

          {open && (
            <div className="m-topbar-dropdown">
              <div className="m-topbar-email">{user?.email || '—'}</div>
              <hr className="m-topbar-sep" />

              {/* Always show install option when not already installed as PWA */}
              {!isStandalone && (
                <button className="m-topbar-dd-item" onClick={handleInstall}>
                  📲 Install App
                </button>
              )}

              <button className="m-topbar-dd-item" onClick={() => { setOpen(false); onLogout() }}>
                🚪 Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Install instructions overlay */}
      {showInstallTip && (
        <div className="m-install-overlay" onClick={() => setShowInstallTip(false)}>
          <div className="m-install-card" onClick={e => e.stopPropagation()}>
            <div className="m-install-icon">📲</div>
            <div className="m-install-title">Install CloudDesktop</div>
            {isIOS ? (
              <div className="m-install-steps">
                <div className="m-install-step">1. Tap the <strong>Share</strong> button <span style={{fontSize:18}}>⬆</span> in Safari</div>
                <div className="m-install-step">2. Scroll down and tap <strong>"Add to Home Screen"</strong></div>
                <div className="m-install-step">3. Tap <strong>Add</strong> — done!</div>
              </div>
            ) : (
              <div className="m-install-steps">
                <div className="m-install-step">1. Tap the <strong>⋮ menu</strong> in Chrome (top right)</div>
                <div className="m-install-step">2. Tap <strong>"Add to Home screen"</strong></div>
                <div className="m-install-step">3. Tap <strong>Add</strong> — done!</div>
              </div>
            )}
            <button className="m-install-close" onClick={() => setShowInstallTip(false)}>Got it</button>
          </div>
        </div>
      )}
    </>
  )
}
