import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function MobileSettingsTab({ user, onLogout }) {
  const navigate = useNavigate()
  const [theme, setTheme] = useState(
    () => localStorage.getItem('wsh_theme') || 'dark'
  )

  function toggleTheme(t) {
    setTheme(t)
    localStorage.setItem('wsh_theme', t)
    if (t === 'light') {
      document.documentElement.setAttribute('data-theme', 'light')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
  }

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
  }, [theme])

  return (
    <div className="m-settings-wrap">

      {/* Account bar — email · role · sign out all in one row */}
      <div className="m-settings-account-bar">
        <div className="m-settings-account-info">
          <span className="m-settings-account-email">{user?.email || '—'}</span>
          <span className="m-settings-account-role">{user?.role || 'free'}</span>
        </div>
        <button className="m-settings-signout-btn" onClick={onLogout}>
          Sign out
        </button>
      </div>

      {/* Theme */}
      <div className="m-settings-row-compact">
        <span className="m-settings-label-sm">Theme</span>
        <div className="m-theme-toggle">
          <button
            className={`m-theme-btn${theme === 'dark'  ? ' active' : ''}`}
            onClick={() => toggleTheme('dark')}
          >🌙 Dark</button>
          <button
            className={`m-theme-btn${theme === 'light' ? ' active' : ''}`}
            onClick={() => toggleTheme('light')}
          >☀️ Light</button>
        </div>
      </div>

      <button className="m-desktop-link" onClick={() => navigate('/dashboard')}>
        Switch to Desktop version →
      </button>

    </div>
  )
}
