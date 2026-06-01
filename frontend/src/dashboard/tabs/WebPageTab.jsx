import { useState, useRef } from 'react'

function tryHost(u) { try { return new URL(u).hostname } catch { return u } }

// Known sites that block embedding — show fallback immediately
const KNOWN_BLOCKED = [
  'mail.google.com', 'docs.google.com', 'drive.google.com',
  'calendar.google.com', 'keep.google.com',
  'outlook.live.com', 'microsoft365.com', 'onedrive.live.com',
  'notion.so', 'trello.com', 'app.slack.com', 'chat.openai.com',
]

function isKnownBlocked(url) {
  try {
    const host = new URL(url).hostname
    return KNOWN_BLOCKED.some(b => host === b || host.endsWith('.' + b))
  } catch { return false }
}

export default function WebPageTab({ tab }) {
  const { url } = tab.config
  const [blocked, setBlocked] = useState(() => url ? isKnownBlocked(url) : false)
  const loaded = useRef(false)

  if (!url) return (
    <div className="webpage-blocked tab-panel" style={{ display:'flex' }}>
      <h2>No URL configured</h2>
      <p>Edit this tab to set a URL.</p>
    </div>
  )

  if (blocked) return (
    <div className="webpage-blocked tab-panel" style={{ display:'flex' }}>
      <div style={{ fontSize: 48, marginBottom: 8 }}>🔒</div>
      <h2>Cannot embed this page</h2>
      <p><strong>{tryHost(url)}</strong> blocks embedding in iframes. Open it in a new tab instead.</p>
      <a href={url} target="_blank" rel="noopener noreferrer">
        <button className="btn-primary" style={{ width: 'auto', marginTop: 8 }}>Open in new tab ↗</button>
      </a>
    </div>
  )

  return (
    <div className="tab-panel" style={{ overflow: 'hidden' }}>
      <iframe
        className="webpage-frame"
        src={url}
        title={tab.name}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
        onError={() => setBlocked(true)}
        onLoad={() => { loaded.current = true }}
      />
    </div>
  )
}
