import { useEffect, useRef, useState } from 'react'

export default function ContextMenu({ ctx, groups, onClose, onOpen, onEdit, onDelete, onMoveToGroup, onNewGroup }) {
  const ref = useRef(null)
  const [showMove, setShowMove] = useState(false)

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    function keyHandler(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', keyHandler)
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('keydown', keyHandler) }
  }, [onClose])

  useEffect(() => {
    if (!ref.current) return
    const r = ref.current.getBoundingClientRect()
    if (r.right > window.innerWidth) ref.current.style.left = (window.innerWidth - r.width - 8) + 'px'
    if (r.bottom > window.innerHeight) ref.current.style.top = (window.innerHeight - r.height - 8) + 'px'
  })

  if (!ctx) return null
  const { x, y, appId, appName, isOpen: appIsOpen } = ctx

  if (showMove) {
    return (
      <div ref={ref} className="ctx-menu" style={{ left: x, top: y }}>
        <div className="ctx-header">Move to group</div>
        {groups.map(g => (
          <div key={g.id} className="ctx-item" onClick={() => { onMoveToGroup(appId, g.id); onClose() }}>
            <span className="ctx-ico" style={{ color: g.color }}>●</span>{g.name}
          </div>
        ))}
        <div className="ctx-sep" />
        <div className="ctx-item" onClick={() => { onNewGroup(appId); onClose() }}>
          <span className="ctx-ico">+</span>New group…
        </div>
      </div>
    )
  }

  return (
    <div ref={ref} className="ctx-menu" style={{ left: x, top: y }}>
      <div className="ctx-header">{appName}</div>
      <div className="ctx-item" onClick={() => { onOpen(appId); onClose() }}>
        <span className="ctx-ico">{appIsOpen ? '↗' : '🚀'}</span>{appIsOpen ? 'Focus tab' : 'Open app'}
      </div>
      <div className="ctx-sep" />
      <div className="ctx-item" onClick={() => { onEdit(appId); onClose() }}>
        <span className="ctx-ico">✎</span>Edit app
      </div>
      <div className="ctx-item" onClick={() => { onEdit(appId, 'icon'); onClose() }}>
        <span className="ctx-ico">🎨</span>Change icon
      </div>
      <div className="ctx-item" onClick={() => { onEdit(appId, 'shortcut'); onClose() }}>
        <span className="ctx-ico">⌨</span>Set shortcut
      </div>
      <div className="ctx-sep" />
      <div className="ctx-item" onClick={() => setShowMove(true)}>
        <span className="ctx-ico">⊞</span>Move to group
      </div>
      <div className="ctx-sep" />
      <div className="ctx-item danger" onClick={() => { onDelete(appId); onClose() }}>
        <span className="ctx-ico">🗑</span>Delete app
      </div>
    </div>
  )
}
