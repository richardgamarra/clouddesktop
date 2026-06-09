export default function TopBar({ user, onLogout }) {
  const initial = (user?.email || '?')[0].toUpperCase()

  return (
    <div className="m-topbar">
      <div className="m-topbar-logo">
        <span>☁</span>
        CloudDesktop
      </div>
      <div className="m-topbar-right">
        <div className="m-avatar" title={user?.email}>{initial}</div>
        <button className="m-logout-btn" onClick={onLogout}>Log out</button>
      </div>
    </div>
  )
}
