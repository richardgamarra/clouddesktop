const TABS = [
  { id: 'apps',      icon: '🗂',  label: 'Apps'      },
  { id: 'bookmarks', icon: '🔖',  label: 'Bookmarks' },
  { id: 'news',      icon: '📰',  label: 'News'      },
  { id: 'notes',     icon: '📝',  label: 'Notes'     },
  { id: 'settings',  icon: '⚙️', label: 'Settings'  },
]

export default function BottomTabBar({ activeTab, onChange }) {
  return (
    <nav className="m-tabbar">
      {TABS.map(tab => (
        <button
          key={tab.id}
          className={`m-tab-item${activeTab === tab.id ? ' active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          <span className="m-tab-icon">{tab.icon}</span>
          <span>{tab.label}</span>
          {activeTab === tab.id && <span className="m-tab-dot" />}
        </button>
      ))}
    </nav>
  )
}
