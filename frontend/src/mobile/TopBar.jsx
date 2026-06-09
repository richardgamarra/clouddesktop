import { useState, useRef, useEffect } from 'react'

export default function TopBar({ user, onLogout }) {
  const initial = (user?.email || '?')[0].toUpperCase()
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)

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
            <button className="m-topbar-dd-item" onClick={() => { setOpen(false); onLogout() }}>
              🚪 Sign out
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
