import { useState, useEffect, useRef } from 'react'

export default function NotesTab({ tab }) {
  const key = 'wsh_notes_' + tab.id
  const [content, setContent] = useState(() => localStorage.getItem(key) || '')
  const [saveStatus, setSaveStatus] = useState('')
  const timer = useRef(null)

  function handleChange(e) {
    const val = e.target.value
    setContent(val)
    setSaveStatus('Saving…')
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      localStorage.setItem(key, val)
      setSaveStatus('Saved')
      setTimeout(() => setSaveStatus(''), 1500)
    }, 600)
  }

  useEffect(() => () => clearTimeout(timer.current), [])

  return (
    <div className="tab-panel" style={{ position: 'relative', overflow: 'hidden' }}>
      <textarea
        className="notes-textarea"
        value={content}
        onChange={handleChange}
        placeholder="Start typing your notes…"
        spellCheck
      />
      {saveStatus && <div className="notes-status">{saveStatus}</div>}
    </div>
  )
}
