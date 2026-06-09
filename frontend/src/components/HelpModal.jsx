import { useRef } from 'react'

export default function HelpModal({ onClose }) {
  const contentRef = useRef(null)

  function handleDownloadPDF() {
    const printWindow = window.open('', '_blank', 'width=900,height=700')
    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>CloudDesktop User Manual</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 13px;
      line-height: 1.7;
      color: #1a1a2e;
      padding: 40px 56px;
      max-width: 900px;
      margin: 0 auto;
    }
    h1 { font-size: 26px; font-weight: 800; margin-bottom: 6px; color: #0b0d12; }
    h2 { font-size: 18px; font-weight: 700; margin: 28px 0 8px; color: #1a1a2e; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px; }
    h3 { font-size: 14px; font-weight: 700; margin: 18px 0 6px; color: #374151; }
    p, li { margin-bottom: 6px; color: #374151; }
    ul, ol { padding-left: 20px; margin-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0 18px; font-size: 12px; }
    th { background: #f3f4f6; text-align: left; padding: 8px 12px; font-weight: 700; border: 1px solid #e5e7eb; }
    td { padding: 7px 12px; border: 1px solid #e5e7eb; }
    tr:nth-child(even) td { background: #fafafa; }
    .part-header {
      background: #0b0d12;
      color: #fff;
      padding: 18px 24px;
      border-radius: 10px;
      margin: 32px 0 24px;
      font-size: 20px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .meta { font-size: 11px; color: #6b7280; margin-bottom: 28px; font-family: monospace; }
    .cover {
      text-align: center;
      padding: 48px 0 40px;
      border-bottom: 2px solid #e5e7eb;
      margin-bottom: 36px;
    }
    .cover h1 { font-size: 32px; margin-bottom: 10px; }
    .cover .subtitle { font-size: 14px; color: #6b7280; }
    strong { color: #111827; }
    hr { border: none; border-top: 1px solid #e5e7eb; margin: 24px 0; }
    @media print {
      body { padding: 28px 36px; }
      .no-print { display: none !important; }
      .part-header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      h2 { page-break-after: avoid; }
      table { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="position:fixed;top:0;left:0;right:0;background:#0b0d12;color:#fff;padding:12px 24px;display:flex;align-items:center;justify-content:space-between;z-index:999;font-family:sans-serif;">
    <span style="font-weight:700;">CloudDesktop User Manual — PDF Preview</span>
    <div style="display:flex;gap:10px;">
      <button onclick="window.print()" style="background:#5b7fff;border:none;color:#fff;padding:8px 20px;border-radius:8px;cursor:pointer;font-weight:700;font-size:13px;">⬇ Download PDF</button>
      <button onclick="window.close()" style="background:#374151;border:none;color:#fff;padding:8px 16px;border-radius:8px;cursor:pointer;font-size:13px;">✕ Close</button>
    </div>
  </div>
  <div style="margin-top:52px;">

  <div class="cover">
    <div style="font-size:48px;margin-bottom:12px;">☁</div>
    <h1>CloudDesktop</h1>
    <div class="subtitle">User Manual — Desktop &amp; Mobile</div>
    <div class="meta" style="margin-top:14px;">Version 1.0 &nbsp;·&nbsp; clouddesktop.infoplay.com &nbsp;·&nbsp; Updated 2026-06-09</div>
  </div>

  <!-- ════════════════════════════════════════ PART 1: DESKTOP ════ -->
  <div class="part-header">☁ PART 1 — DESKTOP VERSION</div>

  <h2>1 — Getting Started</h2>
  <p>CloudDesktop is a personal cloud workspace that runs in your browser. Access it at:</p>
  <p><strong>https://clouddesktop.infoplay.com</strong></p>
  <p>Desktop browsers open the full dashboard automatically. Mobile browsers are redirected to the mobile view.</p>

  <h2>2 — Logging In</h2>
  <ol>
    <li>Go to <strong>https://clouddesktop.infoplay.com</strong></li>
    <li>Enter your <strong>email</strong> and <strong>password</strong></li>
    <li>Click <strong>Sign In</strong></li>
  </ol>
  <p>You are taken directly to the dashboard. The login page is removed from browser history so pressing Back does not return to it.</p>

  <h2>3 — Dashboard Overview</h2>
  <table>
    <tr><th>Area</th><th>Location</th><th>Purpose</th></tr>
    <tr><td><strong>Sidebar</strong></td><td>Left side</td><td>Navigate between tabs (Apps, News, Bookmarks, Widgets, Notes)</td></tr>
    <tr><td><strong>Main Content</strong></td><td>Right / center</td><td>Content for the selected tab</td></tr>
  </table>
  <p>A background image fills the screen behind the content. Customize it in Settings.</p>

  <h2>4 — Apps Tab</h2>
  <p>The Apps tab is your main launcher — showing all saved web apps in colored groups.</p>
  <h3>Launching an App</h3>
  <p><strong>Click</strong> any app icon to open it in a new browser tab.</p>
  <h3>App Groups</h3>
  <ul>
    <li>Apps are organized by <strong>colored groups</strong> (e.g., Google, Work)</li>
    <li>Click <strong>+ Add Group</strong> to create a new group</li>
  </ul>
  <h3>Adding an App</h3>
  <ol>
    <li>Click <strong>+ Add App</strong> inside a group</li>
    <li>Enter the app name and URL</li>
    <li>Optionally set a custom icon (emoji or image URL)</li>
    <li>Click Save</li>
  </ol>
  <h3>Editing or Deleting an App</h3>
  <ul>
    <li><strong>Right-click</strong> any app icon → choose <strong>Edit</strong> or <strong>Delete</strong></li>
  </ul>
  <h3>Managing Groups</h3>
  <ul>
    <li>Right-click a group header → <strong>Edit Group</strong> to rename or change color</li>
    <li>Right-click a group header → <strong>Delete Group</strong> to remove it and its apps</li>
  </ul>

  <h2>5 — News &amp; Bookmarks</h2>
  <h3>News Tab</h3>
  <ul>
    <li>Displays headlines from your configured news sources</li>
    <li>Click any headline to open the article in a new tab</li>
    <li>News sources are organized into groups</li>
  </ul>
  <h3>Bookmarks Tab</h3>
  <ul>
    <li>Shows saved bookmarks organized by category</li>
    <li>Click any bookmark to open it; right-click to edit or delete</li>
  </ul>

  <h2>6 — Widgets Tab</h2>
  <table>
    <tr><th>Widget</th><th>Description</th></tr>
    <tr><td>🕐 Clock</td><td>Live world clock in multiple time zones</td></tr>
    <tr><td>📅 Calendar</td><td>Monthly calendar view</td></tr>
    <tr><td>⏱ Pomodoro</td><td>Focus timer (25 min work / 5 min break)</td></tr>
    <tr><td>✅ To-Do</td><td>Personal task list</td></tr>
    <tr><td>⏳ Countdown</td><td>Count down to any date or event</td></tr>
    <tr><td>🧮 Calculator</td><td>Basic calculator</td></tr>
    <tr><td>💰 Crypto</td><td>Live cryptocurrency prices</td></tr>
    <tr><td>📈 Stocks</td><td>Live stock quotes</td></tr>
    <tr><td>🌤 Weather</td><td>Current weather for your location</td></tr>
    <tr><td>🎵 Music / Radio</td><td>Stream music or radio stations</td></tr>
    <tr><td>📺 YouTube / Live TV</td><td>Embedded video player</td></tr>
  </table>
  <p>Click the widget name or icon to open/close it. Drag widgets to reposition them.</p>

  <h2>7 — Notes Tab</h2>
  <p>Opens <strong>NotesVault</strong> — your personal note-taking workspace. Create and organize notes into categories using the left panel. Notes sync automatically when you save.</p>

  <h2>8 — Settings &amp; Backups</h2>
  <p>Access Settings from the sidebar or navigate to <strong>/settings</strong>.</p>
  <h3>Save to Cloud</h3>
  <p>Click <strong>💾 Save to Cloud Now</strong> to back up your workspace (apps, groups, news sources, tabs) to the server. Restorable on any device.</p>
  <h3>Restore from Cloud</h3>
  <p>Click <strong>↩ Restore Latest Backup</strong> to restore your most recent backup. Up to 5 backups are kept automatically (including daily auto-saves).</p>
  <h3>Background Images</h3>
  <ul>
    <li>Choose a preset background for Dark or Light mode</li>
    <li>Upload your own image (JPG, PNG, WebP — max 10MB)</li>
    <li>Paste any image URL</li>
    <li>Adjust the <strong>overlay darkness</strong> slider for better readability</li>
  </ul>
  <h3>Fix &amp; Bake Icons</h3>
  <ul>
    <li><strong>Fix Google &amp; Microsoft Icons</strong> — replaces generic icons with official Gmail, Drive, Outlook, Teams icons instantly</li>
    <li><strong>Bake All Icons Now</strong> — permanently embeds all app icons as base64 images (works offline)</li>
  </ul>
  <h3>Local Export / Import</h3>
  <ul>
    <li><strong>↓ Export JSON</strong> — downloads all settings as a JSON file</li>
    <li><strong>↑ Import JSON</strong> — restores settings from a previously exported file</li>
  </ul>
  <h3>Recover Previous Workspace</h3>
  <p>If your workspace was previously saved with password encryption, click <strong>🔑 Recover Now</strong> and enter your password to decrypt and restore it.</p>

  <!-- ════════════════════════════════════════ PART 2: MOBILE ════ -->
  <div class="part-header">📱 PART 2 — MOBILE VERSION</div>

  <h2>1 — Getting Started</h2>
  <p>CloudDesktop Mobile is accessible at:</p>
  <p><strong>https://clouddesktop.infoplay.com/mobile</strong></p>
  <p>Mobile browsers are redirected here automatically when visiting the main URL.</p>

  <h2>2 — Installing the App (PWA)</h2>
  <p>Install CloudDesktop as an app on your home screen for a full-screen experience with no browser bar.</p>
  <h3>Android (Chrome)</h3>
  <ol>
    <li>Open Chrome → go to <strong>https://clouddesktop.infoplay.com/mobile</strong></li>
    <li>Tap the <strong>⋮ three-dot menu</strong> (top-right of Chrome)</li>
    <li>Tap <strong>"Add to Home screen"</strong></li>
    <li>If two options appear, tap <strong>"This app is already installed → Click to open the app instead"</strong> (full PWA, no Chrome badge)</li>
    <li>Tap <strong>Add</strong> — the icon is placed in your App Drawer</li>
  </ol>
  <p><strong>Finding the icon after install:</strong></p>
  <ul>
    <li>Swipe up from the home screen to open the App Drawer</li>
    <li>Search for "CloudDesktop"</li>
    <li>Long-press the icon and drag it to your home screen</li>
  </ul>
  <h3>iOS (Safari)</h3>
  <ol>
    <li>Open Safari → go to <strong>https://clouddesktop.infoplay.com/mobile</strong></li>
    <li>Tap the <strong>Share button (⬆)</strong> at the bottom</li>
    <li>Scroll down → tap <strong>"Add to Home Screen"</strong></li>
    <li>Tap <strong>Add</strong> — the icon appears on your home screen</li>
  </ol>

  <h2>3 — Logging In</h2>
  <ol>
    <li>Open CloudDesktop from your home screen or browser</li>
    <li>Enter your <strong>email</strong> and <strong>password</strong></li>
    <li>Tap <strong>Sign In</strong></li>
  </ol>

  <h2>4 — Navigation Overview</h2>
  <table>
    <tr><th>Bar</th><th>Location</th><th>Purpose</th></tr>
    <tr><td><strong>Top Bar</strong></td><td>Top</td><td>App logo + account avatar</td></tr>
    <tr><td><strong>Bottom Tab Bar</strong></td><td>Bottom</td><td>Switch between Apps, Notes, Bookmarks, Settings</td></tr>
  </table>

  <h2>5 — Apps Tab</h2>
  <h3>Launching an App</h3>
  <p><strong>Tap</strong> any app icon to open it in a new browser tab.</p>
  <h3>Adding an App</h3>
  <p>Tap the <strong>＋ button</strong> in the top-right of any group header.</p>
  <h3>Editing or Deleting an App</h3>
  <ul>
    <li><strong>Long-press</strong> any app icon (hold ~0.5 sec)</li>
    <li>Choose <strong>✎ Edit App</strong> or <strong>🗑 Delete App</strong> from the slide-up menu</li>
  </ul>

  <h2>6 — Notes Tab</h2>
  <p>Opens <strong>NotesVault</strong> embedded directly in CloudDesktop.</p>
  <ul>
    <li>Browse categories on the left panel; tap any note to open and edit it</li>
    <li>Tap <strong>↗</strong> (top-right) to open NotesVault in a full browser tab</li>
    <li>Use the <strong>← back arrow</strong> inside NotesVault to navigate within notes</li>
    <li>Tap any bottom tab to return to CloudDesktop</li>
  </ul>

  <h2>7 — Bookmarks Tab</h2>
  <ul>
    <li>Bookmarks listed vertically by category</li>
    <li>Tap any bookmark to open it; news groups stack vertically for easy scrolling</li>
  </ul>

  <h2>8 — Settings Tab</h2>
  <ul>
    <li><strong>Account bar</strong> (top row): your email, role badge, and Sign out button</li>
    <li><strong>Theme</strong>: toggle 🌙 Dark or ☀️ Light mode</li>
    <li><strong>Switch to Desktop version →</strong>: opens the full desktop dashboard</li>
  </ul>

  <h2>9 — Top Bar &amp; Account Menu</h2>
  <p>Tap your <strong>avatar</strong> (circle with your initial, top-right) to open the dropdown:</p>
  <ul>
    <li>Your email address</li>
    <li><strong>📲 Install App</strong> — shown when not yet installed as a PWA</li>
    <li><strong>🚪 Sign out</strong> — logs you out</li>
  </ul>

  <h2>10 — Switching to Desktop View</h2>
  <ul>
    <li><strong>Settings tab</strong> → tap <strong>"Switch to Desktop version →"</strong></li>
    <li>Or navigate to <strong>https://clouddesktop.infoplay.com/dashboard</strong></li>
  </ul>

  <hr />
  <h2>Quick Reference — Mobile</h2>
  <table>
    <tr><th>Action</th><th>How</th></tr>
    <tr><td>Launch an app</td><td>Tap the app icon</td></tr>
    <tr><td>Edit / delete an app</td><td>Long-press the app icon</td></tr>
    <tr><td>Add an app to a group</td><td>Tap ＋ in group header</td></tr>
    <tr><td>Open Notes</td><td>Tap Notes tab</td></tr>
    <tr><td>Open NotesVault in browser</td><td>Tap ↗ inside Notes tab</td></tr>
    <tr><td>Change theme</td><td>Settings → Theme toggle</td></tr>
    <tr><td>Sign out</td><td>Avatar menu → 🚪 Sign out</td></tr>
    <tr><td>Install as home screen app</td><td>Avatar menu → 📲 Install App</td></tr>
    <tr><td>Switch to desktop</td><td>Settings → Switch to Desktop version</td></tr>
  </table>

  <hr />
  <p style="font-size:11px;color:#9ca3af;text-align:center;margin-top:24px;">CloudDesktop is built and maintained by InfoPlay. For support, contact your administrator.</p>
  </div>
</body>
</html>`)
    printWindow.document.close()
    printWindow.focus()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px'
    }} onClick={onClose}>
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        width: '100%', maxWidth: 820,
        maxHeight: '90vh',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden'
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 24px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0
        }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-.3px' }}>📖 Help &amp; Documentation</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: "'DM Mono',monospace", marginTop: 2 }}>
              CloudDesktop User Manual — Desktop &amp; Mobile
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={handleDownloadPDF} style={{
              background: 'var(--accent)', border: 'none', borderRadius: 8,
              color: '#fff', fontSize: 13, fontWeight: 700,
              padding: '8px 18px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6
            }}>
              ⬇ Download PDF
            </button>
            <button onClick={onClose} style={{
              background: 'var(--s2)', border: '1px solid var(--border2)',
              borderRadius: 8, color: 'var(--text2)', fontSize: 13,
              padding: '8px 14px', cursor: 'pointer'
            }}>✕</button>
          </div>
        </div>

        {/* Body — scrollable */}
        <div ref={contentRef} style={{
          overflowY: 'auto', padding: '28px 32px',
          flex: 1, color: 'var(--text)',
          fontFamily: "'Plus Jakarta Sans',sans-serif",
          fontSize: 13, lineHeight: 1.75
        }}>

          {/* Part 1 — Desktop */}
          <div style={{
            background: 'var(--accent)', color: '#fff',
            borderRadius: 10, padding: '14px 20px',
            fontSize: 16, fontWeight: 800, marginBottom: 24
          }}>☁ PART 1 — DESKTOP VERSION</div>

          <Section title="1 — Getting Started">
            <p>CloudDesktop is a personal cloud workspace that runs in your browser.</p>
            <p>URL: <strong>https://clouddesktop.infoplay.com</strong></p>
            <p>Desktop browsers open the full dashboard automatically. Mobile browsers are redirected to the mobile view.</p>
          </Section>

          <Section title="2 — Logging In">
            <ol>
              <li>Go to <strong>https://clouddesktop.infoplay.com</strong></li>
              <li>Enter your <strong>email</strong> and <strong>password</strong></li>
              <li>Click <strong>Sign In</strong></li>
            </ol>
          </Section>

          <Section title="3 — Dashboard Overview">
            <ManualTable headers={['Area','Location','Purpose']} rows={[
              ['Sidebar','Left side','Navigate between tabs (Apps, News, Bookmarks, Widgets, Notes)'],
              ['Main Content','Right / center','Content for the selected tab'],
            ]} />
            <p>A background image fills the screen. Customize it in Settings.</p>
          </Section>

          <Section title="4 — Apps Tab">
            <p><strong>Launching:</strong> Click any app icon to open it in a new browser tab.</p>
            <p><strong>Adding an App:</strong> Click <strong>+ Add App</strong> inside a group → enter name &amp; URL → Save.</p>
            <p><strong>Edit / Delete:</strong> Right-click any app icon → Edit or Delete.</p>
            <p><strong>Groups:</strong> Right-click a group header to Edit Group or Delete Group.</p>
          </Section>

          <Section title="5 — News & Bookmarks">
            <p><strong>News Tab:</strong> Headlines from your configured sources. Click any headline to open it.</p>
            <p><strong>Bookmarks Tab:</strong> Saved bookmarks by category. Click to open; right-click to edit or delete.</p>
          </Section>

          <Section title="6 — Widgets Tab">
            <ManualTable headers={['Widget','Description']} rows={[
              ['🕐 Clock','Live world clock in multiple time zones'],
              ['📅 Calendar','Monthly calendar view'],
              ['⏱ Pomodoro','Focus timer (25 min work / 5 min break)'],
              ['✅ To-Do','Personal task list'],
              ['⏳ Countdown','Count down to any date or event'],
              ['🧮 Calculator','Basic calculator'],
              ['💰 Crypto','Live cryptocurrency prices'],
              ['📈 Stocks','Live stock quotes'],
              ['🌤 Weather','Current weather for your location'],
              ['🎵 Music / Radio','Stream music or radio stations'],
              ['📺 YouTube / Live TV','Embedded video player'],
            ]} />
          </Section>

          <Section title="7 — Notes Tab">
            <p>Opens <strong>NotesVault</strong> — your personal note-taking workspace. Create and organize notes into categories. Notes sync automatically when saved.</p>
          </Section>

          <Section title="8 — Settings & Backups">
            <p><strong>Save to Cloud:</strong> Click 💾 Save to Cloud Now to back up your workspace. Restorable on any device.</p>
            <p><strong>Restore from Cloud:</strong> Click ↩ Restore Latest Backup. Up to 5 backups kept automatically (including daily auto-saves).</p>
            <p><strong>Background Images:</strong> Choose a preset, upload your own (max 10MB), or paste any image URL. Adjust the overlay darkness slider.</p>
            <p><strong>Fix Icons:</strong> Click "Fix Google &amp; Microsoft Icons" to replace generic icons with official ones instantly.</p>
            <p><strong>Bake Icons:</strong> Permanently embeds all icons as base64 images — works offline after baking.</p>
            <p><strong>Export / Import:</strong> ↓ Export JSON saves settings to your device. ↑ Import JSON restores from a file.</p>
            <p><strong>Recover Previous Workspace:</strong> Click 🔑 Recover Now and enter your password to decrypt and restore an old encrypted backup.</p>
          </Section>

          {/* Part 2 — Mobile */}
          <div style={{
            background: '#1a1a2e', color: '#fff',
            borderRadius: 10, padding: '14px 20px',
            fontSize: 16, fontWeight: 800, margin: '32px 0 24px'
          }}>📱 PART 2 — MOBILE VERSION</div>

          <Section title="1 — Getting Started">
            <p>URL: <strong>https://clouddesktop.infoplay.com/mobile</strong></p>
            <p>Mobile browsers are redirected here automatically when visiting the main URL.</p>
          </Section>

          <Section title="2 — Installing the App (PWA)">
            <p><strong>Android (Chrome):</strong></p>
            <ol>
              <li>Open Chrome → go to <strong>https://clouddesktop.infoplay.com/mobile</strong></li>
              <li>Tap the <strong>⋮ three-dot menu</strong> (top-right of Chrome)</li>
              <li>Tap <strong>"Add to Home screen"</strong></li>
              <li>If two options appear, tap <strong>"This app is already installed → Click to open the app instead"</strong></li>
              <li>Tap <strong>Add</strong> — icon goes to your App Drawer</li>
            </ol>
            <p style={{marginTop:8}}><strong>Finding the icon:</strong> Swipe up from home screen → search "CloudDesktop" → long-press the icon → drag to home screen.</p>
            <p style={{marginTop:8}}><strong>iOS (Safari):</strong> Tap Share (⬆) → "Add to Home Screen" → Add.</p>
          </Section>

          <Section title="3 — Navigation Overview">
            <ManualTable headers={['Bar','Location','Purpose']} rows={[
              ['Top Bar','Top','App logo + account avatar'],
              ['Bottom Tab Bar','Bottom','Switch between Apps, Notes, Bookmarks, Settings'],
            ]} />
          </Section>

          <Section title="4 — Apps Tab">
            <p><strong>Launch:</strong> Tap any app icon.</p>
            <p><strong>Add:</strong> Tap the ＋ in any group header.</p>
            <p><strong>Edit / Delete:</strong> Long-press any app icon → choose from the slide-up menu.</p>
          </Section>

          <Section title="5 — Notes Tab">
            <p>Opens NotesVault embedded in CloudDesktop. Tap ↗ to open in a full browser tab. Use ← back arrow to navigate within notes. Tap any bottom tab to return to CloudDesktop.</p>
          </Section>

          <Section title="6 — Bookmarks Tab">
            <p>Bookmarks listed vertically by category. Tap to open. News groups stack vertically for easy scrolling.</p>
          </Section>

          <Section title="7 — Settings Tab">
            <p><strong>Account bar:</strong> Your email, role badge, and Sign out button in one row.</p>
            <p><strong>Theme:</strong> Toggle 🌙 Dark or ☀️ Light mode.</p>
            <p><strong>Switch to Desktop version →</strong> opens the full desktop dashboard.</p>
          </Section>

          <Section title="8 — Top Bar & Account Menu">
            <p>Tap your <strong>avatar</strong> (top-right circle) to open the dropdown:</p>
            <ul>
              <li>Your email</li>
              <li><strong>📲 Install App</strong> — shown when app is not yet installed as a PWA</li>
              <li><strong>🚪 Sign out</strong></li>
            </ul>
          </Section>

          <Section title="Quick Reference — Mobile">
            <ManualTable headers={['Action','How']} rows={[
              ['Launch an app','Tap the app icon'],
              ['Edit / delete an app','Long-press the app icon'],
              ['Add an app to a group','Tap ＋ in group header'],
              ['Open Notes','Tap Notes tab'],
              ['Open NotesVault in browser','Tap ↗ inside Notes tab'],
              ['Change theme','Settings → Theme toggle'],
              ['Sign out','Avatar menu → 🚪 Sign out'],
              ['Install as home screen app','Avatar menu → 📲 Install App'],
              ['Switch to desktop','Settings → Switch to Desktop version'],
            ]} />
          </Section>

          <div style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'center', marginTop: 24, fontFamily: "'DM Mono',monospace" }}>
            CloudDesktop is built and maintained by InfoPlay. For support, contact your administrator.
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{
        fontSize: 14, fontWeight: 700,
        color: 'var(--text)',
        borderBottom: '1px solid var(--border)',
        paddingBottom: 5, marginBottom: 10
      }}>{title}</div>
      <div style={{ paddingLeft: 4, color: 'var(--text2)', fontSize: 13, lineHeight: 1.75 }}>
        {children}
      </div>
    </div>
  )
}

function ManualTable({ headers, rows }) {
  return (
    <table style={{
      width: '100%', borderCollapse: 'collapse',
      fontSize: 12, marginBottom: 12,
      fontFamily: "'DM Mono',monospace"
    }}>
      <thead>
        <tr>
          {headers.map(h => (
            <th key={h} style={{
              background: 'var(--s2)', textAlign: 'left',
              padding: '7px 12px', fontWeight: 700,
              border: '1px solid var(--border)', color: 'var(--text2)'
            }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            {row.map((cell, j) => (
              <td key={j} style={{
                padding: '6px 12px',
                border: '1px solid var(--border)',
                color: 'var(--text2)',
                background: i % 2 === 0 ? 'transparent' : 'var(--s2)'
              }}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
