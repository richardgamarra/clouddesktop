import { useState, useEffect, useRef } from 'react'
import { EMOJI_LIST } from './constants'
import ConfirmModal from '../components/ConfirmModal'
import { resizeImage } from '../lib/imageUtils'
import { getAppIcon } from './hooks/useDesktopApps'

// 30+ popular app icons — name + Google favicon CDN URL
const POPULAR_APPS = [
  // Google — using official gstatic.com product branding icons
  { name:'Gmail',            url:'https://www.gstatic.com/images/branding/product/2x/gmail_48dp.png' },
  { name:'Google Docs',      url:'https://www.gstatic.com/images/branding/product/2x/docs_48dp.png' },
  { name:'Google Sheets',    url:'https://www.gstatic.com/images/branding/product/2x/sheets_48dp.png' },
  { name:'Google Slides',    url:'https://www.gstatic.com/images/branding/product/2x/slides_48dp.png' },
  { name:'Google Drive',     url:'https://www.gstatic.com/images/branding/product/2x/drive_48dp.png' },
  { name:'Google Calendar',  url:'https://www.gstatic.com/images/branding/product/2x/calendar_48dp.png' },
  { name:'Google Keep',      url:'https://www.gstatic.com/images/branding/product/2x/keep_48dp.png' },
  { name:'Google Meet',      url:'https://www.gstatic.com/images/branding/product/2x/meet_48dp.png' },
  { name:'Google Maps',      url:'https://www.gstatic.com/images/branding/product/2x/maps_48dp.png' },
  { name:'YouTube',          url:'https://www.gstatic.com/images/branding/product/2x/youtube_48dp.png' },
  { name:'Google Analytics', url:'https://www.gstatic.com/images/branding/product/2x/analytics_48dp.png' },
  // Microsoft Office — confirmed Fluent UI CDN (res-1.cdn.office.net via redirect)
  { name:'Outlook',          url:'https://res-1.cdn.office.net/files/fabric/assets/brand-icons/product/png/outlook_96x1.png' },
  { name:'Word',             url:'https://res-1.cdn.office.net/files/fabric/assets/brand-icons/product/png/word_96x1.png' },
  { name:'Excel',            url:'https://res-1.cdn.office.net/files/fabric/assets/brand-icons/product/png/excel_96x1.png' },
  { name:'PowerPoint',       url:'https://res-1.cdn.office.net/files/fabric/assets/brand-icons/product/png/powerpoint_96x1.png' },
  { name:'OneNote',          url:'https://res-1.cdn.office.net/files/fabric/assets/brand-icons/product/png/onenote_96x1.png' },
  { name:'OneDrive',         url:'https://res-1.cdn.office.net/files/fabric/assets/brand-icons/product/png/onedrive_96x1.png' },
  { name:'Teams',            url:'https://res-1.cdn.office.net/files/fabric/assets/brand-icons/product/png/teams_96x1.png' },
  { name:'SharePoint',       url:'https://res-1.cdn.office.net/files/fabric/assets/brand-icons/product/png/sharepoint_96x1.png' },
  { name:'Microsoft 365',    url:'https://res-1.cdn.office.net/files/fabric/assets/brand-icons/product/png/office_96x1.png' },
  { name:'Access',           url:'https://res-1.cdn.office.net/files/fabric/assets/brand-icons/product/png/access_96x1.png' },
  { name:'Project',          url:'https://res-1.cdn.office.net/files/fabric/assets/brand-icons/product/png/project_96x1.png' },
  { name:'Visio',            url:'https://res-1.cdn.office.net/files/fabric/assets/brand-icons/product/png/visio_96x1.png' },
  // Microsoft Power Platform — favicon CDN (correct product logos)
  { name:'Power BI',         url:'https://www.google.com/s2/favicons?sz=64&domain=powerbi.microsoft.com' },
  { name:'Power Apps',       url:'https://www.google.com/s2/favicons?sz=64&domain=make.powerapps.com' },
  { name:'Power Automate',   url:'https://www.google.com/s2/favicons?sz=64&domain=make.powerautomate.com' },
  { name:'Dynamics 365',     url:'https://www.google.com/s2/favicons?sz=64&domain=dynamics.microsoft.com' },
  { name:'Copilot',          url:'https://www.google.com/s2/favicons?sz=64&domain=copilot.microsoft.com' },
  { name:'Microsoft Loop',   url:'https://www.google.com/s2/favicons?sz=64&domain=loop.microsoft.com' },
  { name:'MS Planner',       url:'https://www.google.com/s2/favicons?sz=64&domain=planner.microsoft.com' },
  { name:'MS Forms',         url:'https://www.google.com/s2/favicons?sz=64&domain=forms.microsoft.com' },
  { name:'MS To Do',         url:'https://www.google.com/s2/favicons?sz=64&domain=todo.microsoft.com' },
  // Microsoft Developer & Cloud
  { name:'Azure',            url:'https://www.google.com/s2/favicons?sz=64&domain=azure.microsoft.com' },
  { name:'Azure DevOps',     url:'https://www.google.com/s2/favicons?sz=64&domain=dev.azure.com' },
  { name:'VS Code',          url:'https://www.google.com/s2/favicons?sz=64&domain=code.visualstudio.com' },
  { name:'GitHub Copilot',   url:'https://www.google.com/s2/favicons?sz=64&domain=github.com' },
  // Productivity
  { name:'Notion',           url:'https://www.google.com/s2/favicons?sz=64&domain=notion.so' },
  { name:'Trello',           url:'https://www.google.com/s2/favicons?sz=64&domain=trello.com' },
  { name:'Asana',            url:'https://www.google.com/s2/favicons?sz=64&domain=asana.com' },
  { name:'Monday.com',       url:'https://www.google.com/s2/favicons?sz=64&domain=monday.com' },
  { name:'Airtable',         url:'https://www.google.com/s2/favicons?sz=64&domain=airtable.com' },
  { name:'ClickUp',          url:'https://www.google.com/s2/favicons?sz=64&domain=clickup.com' },
  { name:'Jira',             url:'https://www.google.com/s2/favicons?sz=64&domain=atlassian.com' },
  { name:'Confluence',       url:'https://www.google.com/s2/favicons?sz=64&domain=confluence.atlassian.com' },
  // Communication
  { name:'Slack',            url:'https://www.google.com/s2/favicons?sz=64&domain=slack.com' },
  { name:'Zoom',             url:'https://www.google.com/s2/favicons?sz=64&domain=zoom.us' },
  { name:'Discord',          url:'https://www.google.com/s2/favicons?sz=64&domain=discord.com' },
  { name:'WhatsApp',         url:'https://www.google.com/s2/favicons?sz=64&domain=web.whatsapp.com' },
  { name:'Telegram',         url:'https://www.google.com/s2/favicons?sz=64&domain=web.telegram.org' },
  // Dev & Design
  { name:'GitHub',           url:'https://www.google.com/s2/favicons?sz=64&domain=github.com' },
  { name:'GitLab',           url:'https://www.google.com/s2/favicons?sz=64&domain=gitlab.com' },
  { name:'Figma',            url:'https://www.google.com/s2/favicons?sz=64&domain=figma.com' },
  { name:'Canva',            url:'https://www.google.com/s2/favicons?sz=64&domain=canva.com' },
  { name:'Linear',           url:'https://www.google.com/s2/favicons?sz=64&domain=linear.app' },
  { name:'Vercel',           url:'https://www.google.com/s2/favicons?sz=64&domain=vercel.com' },
  // AI — Assistants & Chatbots
  { name:'ChatGPT',          url:'https://www.google.com/s2/favicons?sz=64&domain=chat.openai.com' },
  { name:'Claude',           url:'https://www.google.com/s2/favicons?sz=64&domain=claude.ai' },
  { name:'Gemini',           url:'https://www.gstatic.com/images/branding/product/2x/gemini_48dp.png' },
  { name:'Copilot',          url:'https://www.google.com/s2/favicons?sz=64&domain=copilot.microsoft.com' },
  { name:'Grok',             url:'https://www.google.com/s2/favicons?sz=64&domain=x.ai' },
  { name:'Meta AI',          url:'https://www.google.com/s2/favicons?sz=64&domain=meta.ai' },
  { name:'Perplexity',       url:'https://www.google.com/s2/favicons?sz=64&domain=perplexity.ai' },
  { name:'Mistral',          url:'https://www.google.com/s2/favicons?sz=64&domain=mistral.ai' },
  { name:'DeepSeek',         url:'https://www.google.com/s2/favicons?sz=64&domain=deepseek.com' },
  { name:'Poe',              url:'https://www.google.com/s2/favicons?sz=64&domain=poe.com' },
  { name:'Character.ai',     url:'https://www.google.com/s2/favicons?sz=64&domain=character.ai' },
  { name:'You.com',          url:'https://www.google.com/s2/favicons?sz=64&domain=you.com' },
  { name:'Phind',            url:'https://www.google.com/s2/favicons?sz=64&domain=phind.com' },
  { name:'Groq',             url:'https://www.google.com/s2/favicons?sz=64&domain=groq.com' },
  // AI — Image & Video Generation
  { name:'Midjourney',       url:'https://www.google.com/s2/favicons?sz=64&domain=midjourney.com' },
  { name:'DALL-E',           url:'https://www.google.com/s2/favicons?sz=64&domain=openai.com' },
  { name:'Stable Diffusion', url:'https://www.google.com/s2/favicons?sz=64&domain=stability.ai' },
  { name:'Leonardo.ai',      url:'https://www.google.com/s2/favicons?sz=64&domain=leonardo.ai' },
  { name:'Ideogram',         url:'https://www.google.com/s2/favicons?sz=64&domain=ideogram.ai' },
  { name:'Runway',           url:'https://www.google.com/s2/favicons?sz=64&domain=runwayml.com' },
  { name:'Kling AI',         url:'https://www.google.com/s2/favicons?sz=64&domain=klingai.com' },
  { name:'Pika',             url:'https://www.google.com/s2/favicons?sz=64&domain=pika.art' },
  { name:'Suno',             url:'https://www.google.com/s2/favicons?sz=64&domain=suno.ai' },
  { name:'ElevenLabs',       url:'https://www.google.com/s2/favicons?sz=64&domain=elevenlabs.io' },
  // AI — Developer & Research
  { name:'Hugging Face',     url:'https://www.google.com/s2/favicons?sz=64&domain=huggingface.co' },
  { name:'Replicate',        url:'https://www.google.com/s2/favicons?sz=64&domain=replicate.com' },
  { name:'Together AI',      url:'https://www.google.com/s2/favicons?sz=64&domain=together.ai' },
  { name:'Cohere',           url:'https://www.google.com/s2/favicons?sz=64&domain=cohere.com' },
  { name:'Anthropic',        url:'https://www.google.com/s2/favicons?sz=64&domain=anthropic.com' },
  { name:'OpenAI',           url:'https://www.google.com/s2/favicons?sz=64&domain=openai.com' },
  // Storage & Cloud
  { name:'Dropbox',          url:'https://www.google.com/s2/favicons?sz=64&domain=dropbox.com' },
  { name:'Box',              url:'https://www.google.com/s2/favicons?sz=64&domain=box.com' },
  // Social & Media
  { name:'LinkedIn',         url:'https://www.google.com/s2/favicons?sz=64&domain=linkedin.com' },
  { name:'Twitter / X',      url:'https://www.google.com/s2/favicons?sz=64&domain=x.com' },
  { name:'Instagram',        url:'https://www.google.com/s2/favicons?sz=64&domain=instagram.com' },
  { name:'Facebook',         url:'https://www.google.com/s2/favicons?sz=64&domain=facebook.com' },
  { name:'Spotify',          url:'https://www.google.com/s2/favicons?sz=64&domain=spotify.com' },
  { name:'Netflix',          url:'https://www.google.com/s2/favicons?sz=64&domain=netflix.com' },
  // Business
  { name:'Salesforce',       url:'https://www.google.com/s2/favicons?sz=64&domain=salesforce.com' },
  { name:'HubSpot',          url:'https://www.google.com/s2/favicons?sz=64&domain=hubspot.com' },
  { name:'Zendesk',          url:'https://www.google.com/s2/favicons?sz=64&domain=zendesk.com' },
  { name:'Stripe',           url:'https://www.google.com/s2/favicons?sz=64&domain=stripe.com' },
]

function tryHost(u) { try { return new URL(u).hostname } catch { return u } }
function isValidUrl(s) { try { const u = new URL(s); return u.protocol === 'http:' || u.protocol === 'https:' } catch { return false } }

function renderShortcutText(sc) {
  if (!sc) return <span style={{ color: 'var(--text3)' }}>None</span>
  return sc.split('+').map((k, i, arr) => (
    <span key={i}><span className="shortcut-key">{k}</span>{i < arr.length - 1 ? '+' : ''}</span>
  ))
}

export default function AppModal({ app, groups, onSave, onDelete, onClose }) {
  const isNew = !app?.id
  const [name, setName]         = useState(app?.name || '')
  const [url, setUrl]           = useState(app?.url || '')
  const [groupId, setGroupId]   = useState(app?.groupId || groups[0]?.id || '')
  // Load icon from dedicated store (wsh_app_icons) when editing an existing app
  const storedIcon = app?.id ? getAppIcon(app.id) : null
  const [iconVal, setIconVal]   = useState(storedIcon || app?.customIcon || app?.favicon || app?.emoji || '')
  const [shortcut, setShortcut] = useState(app?.shortcut || '')
  const [showInSidebar, setShowInSidebar] = useState(app?.showInSidebar !== false) // default true
  const [listening, setListening] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const nameRef = useRef(null)

  useEffect(() => {
    if (app?.focusField === 'icon') document.getElementById('ae-icon-input')?.focus()
    else if (app?.focusField === 'shortcut') setListening(true)
    else setTimeout(() => nameRef.current?.focus(), 80)
  }, [])

  useEffect(() => {
    if (!listening) return
    function handler(e) {
      e.preventDefault(); e.stopPropagation()
      if (e.key === 'Escape') { setListening(false); return }
      if (['Control','Alt','Shift','Meta'].includes(e.key)) return
      const parts = []
      if (e.ctrlKey) parts.push('Ctrl'); if (e.metaKey) parts.push('Cmd')
      if (e.altKey) parts.push('Alt'); if (e.shiftKey) parts.push('Shift')
      parts.push(e.key.length === 1 ? e.key.toUpperCase() : e.key)
      setShortcut(parts.join('+'))
      setListening(false)
    }
    document.addEventListener('keydown', handler, true)
    return () => document.removeEventListener('keydown', handler, true)
  }, [listening])

  function previewIcon() {
    if (iconVal.startsWith('http') || iconVal.startsWith('data:')) return <img src={iconVal} style={{ width: 28, height: 28, borderRadius: 6 }} alt="" onError={e => { e.target.outerHTML = '<span>🌐</span>' }} />
    if (iconVal) return <span style={{ fontSize: 24 }}>{iconVal}</span>
    if (url) { try { return <img src={`https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(new URL(url).hostname)}`} style={{ width: 28, height: 28, borderRadius: 6 }} alt="" onError={e => { e.target.outerHTML = '<span>🌐</span>' }} /> } catch {} }
    return <span>🌐</span>
  }

  function shake(el) { if (!el) return; el.style.borderColor = 'var(--red)'; setTimeout(() => el.style.borderColor = '', 900) }

  function handleSave() {
    if (!name.trim()) { shake(document.getElementById('ae-name')); return }
    if (!url.trim() || !isValidUrl(url.trim())) { shake(document.getElementById('ae-url')); return }
    let emoji = null, favicon = null, customIcon = null
    if (iconVal.startsWith('data:')) {
      customIcon = iconVal  // uploaded image — stored in dedicated field
    } else if (iconVal.startsWith('http')) {
      favicon = iconVal
    } else if (iconVal) {
      emoji = iconVal
    } else {
      try { favicon = `https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(new URL(url).hostname)}` } catch {}
    }
    onSave({ id: app?.id || null, name: name.trim(), url: url.trim(), groupId: groupId || null, emoji, favicon, customIcon, shortcut, showInSidebar })
  }

  return (
    <>
    <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-box">
        <div className="modal-title">{isNew ? 'Add App' : 'Edit App'}</div>
        <div className="modal-sub">{isNew ? 'Fill in the details below.' : 'Changes save when you click Save.'}</div>
        <div className="modal-preview">
          <div className="modal-preview-icon">{previewIcon()}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="modal-preview-name">{name || 'App Name'}</div>
            <div className="modal-preview-url">{url || 'https://…'}</div>
            {shortcut && <div className="modal-preview-shortcut">⌨ {shortcut}</div>}
          </div>
        </div>
        <div className="field"><label>App Name</label><input id="ae-name" ref={nameRef} type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Gmail, Notion…" maxLength={40} /></div>
        <div className="field"><label>URL</label><input id="ae-url" type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://…" /></div>
        <div className="field">
          <label>Group</label>
          <select value={groupId} onChange={e => setGroupId(e.target.value)} style={{ background:'var(--s2)', border:'1px solid var(--border2)', borderRadius:8, color:'var(--text)', fontFamily:"'DM Mono',monospace", fontSize:13, padding:'9px 12px', outline:'none', cursor:'pointer', appearance:'none' }}>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            <option value="">— No group —</option>
          </select>
        </div>
        <div className="field">
          <label>Icon — emoji, image URL, or upload</label>
          <div style={{ display:'flex', gap:6 }}>
            <input id="ae-icon-input" type="text" value={iconVal} onChange={e => setIconVal(e.target.value)} placeholder="🚀 or https://…" maxLength={200} style={{ flex:1 }} />
            <label title="Upload image" style={{ display:'flex', alignItems:'center', justifyContent:'center', width:36, height:36, borderRadius:8, background:'var(--s3)', border:'1px solid var(--border2)', cursor:'pointer', flexShrink:0, fontSize:16 }}>
              📁
              <input type="file" accept="image/*" style={{ display:'none' }} onChange={async e => {
                const file = e.target.files?.[0]
                if (!file) return
                e.target.value = ''
                try { setIconVal(await resizeImage(file, 64)) } catch {}
              }} />
            </label>
          </div>
        </div>
        {/* Popular app icons */}
        <div className="emoji-section-title" style={{ marginTop: 4 }}>Popular apps</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(10,1fr)', gap:2, marginBottom:12, maxHeight:120, overflowY:'auto' }}>
          {POPULAR_APPS.map(app => (
            <button key={app.name} type="button" title={app.name}
              className={`epick-cell${iconVal === app.url ? ' sel' : ''}`}
              style={{ padding:2 }}
              onClick={() => setIconVal(iconVal === app.url ? '' : app.url)}>
              <img src={app.url} alt={app.name} style={{ width:22, height:22, borderRadius:4, display:'block' }}
                onError={e => { e.target.style.opacity='0.3' }} />
            </button>
          ))}
        </div>

        <div className="emoji-section-title">Emoji</div>
        <div className="emoji-picker-grid">
          {EMOJI_LIST.map(em => (
            <button key={em} type="button" className={`epick-cell${iconVal === em ? ' sel' : ''}`} onClick={() => setIconVal(iconVal === em ? '' : em)}>{em}</button>
          ))}
        </div>
        <div className="field">
          <label>Keyboard Shortcut <span style={{ color:'var(--text3)', fontWeight:400 }}>(optional)</span></label>
          <div className={`shortcut-capture${listening ? ' listening' : ''}`} tabIndex={0} onClick={() => setListening(!listening)}>
            <span>{listening ? 'Press keys…' : renderShortcutText(shortcut)}</span>
            <span style={{ fontSize:10, color:'var(--text3)', fontFamily:"'DM Mono',monospace" }}>{listening ? 'Esc to cancel' : 'click to set'}</span>
          </div>
        </div>
        <div className="modal-actions">
          {/* Visibility toggle */}
          <div style={{ display:'flex', alignItems:'center', gap:12, background:'var(--s2)', border:'1px solid var(--border2)', borderRadius:8, padding:'10px 14px', marginBottom:8, width:'100%' }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12, fontWeight:700 }}>Show in left sidebar</div>
              <div style={{ fontSize:10, color:'var(--text3)', fontFamily:"'DM Mono',monospace", marginTop:2 }}>
                {showInSidebar ? 'Visible as icon in sidebar' : 'Only in center area'}
              </div>
            </div>
            <button type="button" onClick={() => setShowInSidebar(v => !v)}
              style={{ width:40, height:22, borderRadius:11, border:'none', cursor:'pointer', background: showInSidebar ? 'var(--accent)' : 'var(--s4)', position:'relative', transition:'background .2s', flexShrink:0 }}>
              <span style={{ position:'absolute', top:3, left: showInSidebar ? 21 : 3, width:16, height:16, borderRadius:'50%', background:'#fff', transition:'left .2s', display:'block' }} />
            </button>
          </div>
          {!isNew && <button className="btn-danger" onClick={() => setConfirmDelete(true)}>Delete</button>}
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-primary" style={{ width:'auto' }} onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>

    {confirmDelete && (
      <ConfirmModal
        title="Delete App"
        message={`Are you sure you want to delete "${name || app?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => { setConfirmDelete(false); onDelete(app.id) }}
        onCancel={() => setConfirmDelete(false)}
      />
    )}
    </>
  )
}
