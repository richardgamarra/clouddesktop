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

  // Apply stored theme to DOM on mount (in case MobileDashboard loads without prior toggle)
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
  }, [theme])

  return (
    <div>
      {/* Account */}
      <div className="m-settings-section">
        <div className="m-settings-row">
          <span className="m-settings-label">Account</span>
          <span className="m-settings-value">{user?.email}</span>
        </div>
        <div className="m-settings-row">
          <span className="m-settings-label">Role</span>
          <span className="m-settings-badge">{user?.role || 'free'}</span>
        </div>
      </div>

      {/* Theme */}
      <div className="m-settings-section">
        <div className="m-settings-row">
          <span className="m-settings-label">Theme</span>
          <div className="m-theme-toggle">
            <button
              className={`m-theme-btn${theme === 'dark' ? ' active' : ''}`}
              onClick={() => toggleTheme('dark')}
            >
              🌙 Dark
            </button>
            <button
              className={`m-theme-btn${theme === 'light' ? ' active' : ''}`}
              onClick={() => toggleTheme('light')}
            >
              ☀️ Light
            </button>
          </div>
        </div>
      </div>

      {/* Actions */}
      <button className="m-logout-full-btn" onClick={onLogout}>
        Log out
      </button>

      <button className="m-desktop-link" onClick={() => navigate('/dashboard')}>
        Switch to Desktop version →
      </button>
    </div>
  )
}
