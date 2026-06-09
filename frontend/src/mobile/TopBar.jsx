import { useState, useRef, useEffect } from 'react'

export default function TopBar({ user, onLogout }) {
  const initial = (user?.email || '?')[0].toUpperCase()
  const [open, setOpen] = useState(false)
  const [installPrompt, setInstallPrompt] = useState(null)
  const [isStandalone, setIsStandalone] = useState(false)
  const menuRef = useRef(null)

  // Detect if already installed as PWA
  useEffect(() => {
    setIsStandalone(
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    )
  }, [])

  // Capture the browser's beforeinstallprompt event (Android Chrome)
  useEffect(() => {
    function handler(e) {
      e.preventDefault()
      setInstallPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleInstall() {
    if (installPrompt) {
      installPrompt.prompt()
      await installPrompt.userChoice
      setInstallPrompt(null)
    }
    setOpen(false)
  }

  // Close on outside tap
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
    <div className="m-topbar">
      <div className="m-topbar-logo">
        <span>☁</span>CloudDesktop
      </div>

      <div className="m-topbar-menu" ref={menuRef}>
        <button
          className="m-avatar-btn"
          onClick={() => setOpen(v => !v)}
          aria-label="Account menu"
        >
          {initial}
        </button>

        {open && (
          <div className="m-topbar-dropdown">
            <div className="m-topbar-email">{user?.email || '—'}</div>
            <hr className="m-topbar-sep" />

            {/* Show Install option only if not already installed and prompt available */}
            {!isStandalone && installPrompt && (
              <button className="m-topbar-dd-item" onClick={handleInstall}>
                📲 Install App
              </button>
            )}

            {/* On iOS there's no beforeinstallprompt — show manual instructions */}
            {!isStandalone && !installPrompt && /iPhone|iPad|iPod/i.test(navigator.userAgent) && (
              <button className="m-topbar-dd-item m-topbar-dd-hint" onClick={() => setOpen(false)}>
                📲 Tap Share → "Add to Home Screen"
              </button>
            )}

            <button className="m-topbar-dd-item" onClick={() => { setOpen(false); onLogout() }}>
              🚪 Sign out
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
