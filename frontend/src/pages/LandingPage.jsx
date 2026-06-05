import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const SLIDES = [
  { src: '/slides/landingpage.png', label: 'App Launcher', desc: 'All your web apps in one place' },
  { src: '/slides/news.png', label: 'Live News', desc: 'Curated feeds from top sources' },
  { src: '/slides/bookmarks.png', label: 'Bookmarks', desc: 'Organized folders, instant access' },
  { src: '/slides/widgets.png', label: 'Widgets', desc: 'Radio, notes, weather and more' },
]

const FEATURES = [
  {
    icon: '🚀',
    title: 'App Launcher',
    desc: 'Open Gmail, Notion, Slack, Drive and 100+ apps in named browser tabs. Click once to launch, click again to focus — no duplicate windows.',
    color: '#5b7fff',
  },
  {
    icon: '📰',
    title: 'Live News Feeds',
    desc: 'CNN, BBC, ESPN, TechCrunch and more — fetched fresh with images. Add any RSS source. Filter by outlet. Stay informed without leaving your hub.',
    color: '#3ddcaa',
  },
  {
    icon: '🔖',
    title: 'Bookmarks',
    desc: 'Save any URL into color-coded folders. Drag to reorder. Works like a second brain for your most-visited pages.',
    color: '#a78bfa',
  },
  {
    icon: '🎛️',
    title: 'Widgets',
    desc: 'Live radio, weather, sticky notes, clocks and more. Pin any widget to your dashboard. Build your perfect workspace.',
    color: '#f5a623',
  },
  {
    icon: '📸',
    title: 'SnapVault',
    desc: 'Store screenshots, images and quick visual notes right inside your hub. Find them instantly with titles and tags.',
    color: '#38bdf8',
  },
  {
    icon: '📝',
    title: 'NotesVault',
    desc: 'Rich text notes that sync across all your devices. Markdown support, folders, and full-text search — always at your fingertips.',
    color: '#ff5b6e',
  },
]

const FREE_FEATURES = [
  { text: 'Up to 2 groups', on: true },
  { text: 'Up to 10 apps', on: true },
  { text: '3 news sources', on: true },
  { text: '2 custom tabs', on: true },
  { text: 'Local settings only', on: true },
  { text: 'Cloud sync', on: false },
  { text: 'Custom themes', on: false },
]

const PRO_FEATURES = [
  { text: 'Unlimited groups', on: true },
  { text: 'Unlimited apps', on: true },
  { text: 'Unlimited news sources', on: true },
  { text: 'Unlimited custom tabs', on: true },
  { text: 'Encrypted cloud sync', on: true },
  { text: 'Custom themes', on: true },
  { text: 'Priority support', on: true },
]

const ENT_FEATURES = [
  { text: 'Everything in Premium', on: true },
  { text: 'Admin panel', on: true },
  { text: 'User management', on: true },
  { text: 'Usage analytics', on: true },
  { text: 'SLA guarantee', on: true },
  { text: 'Dedicated support', on: true },
  { text: 'Custom domain', on: true },
]

function Slideshow() {
  const [active, setActive] = useState(0)
  const [fading, setFading] = useState(false)
  const timerRef = useRef(null)

  function goTo(idx) {
    if (idx === active) return
    setFading(true)
    setTimeout(() => {
      setActive(idx)
      setFading(false)
    }, 300)
  }

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setFading(true)
      setTimeout(() => {
        setActive(prev => (prev + 1) % SLIDES.length)
        setFading(false)
      }, 300)
    }, 4000)
    return () => clearInterval(timerRef.current)
  }, [])

  const slide = SLIDES[active]

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 900, margin: '0 auto' }}>
      <div style={{
        position: 'relative',
        borderRadius: 16,
        overflow: 'hidden',
        border: '1px solid var(--border2)',
        boxShadow: '0 32px 80px rgba(0,0,0,.7)',
        background: 'var(--s2)',
        aspectRatio: '16/9',
      }}>
        <img
          key={active}
          src={slide.src}
          alt={slide.label}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            opacity: fading ? 0 : 1,
            transition: 'opacity 0.3s ease',
          }}
        />
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '32px 24px 20px',
          background: 'linear-gradient(to top, rgba(0,0,0,.75) 0%, transparent 100%)',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{slide.label}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.7)', fontFamily: "'DM Mono',monospace" }}>{slide.desc}</div>
          </div>
          <div style={{ display: 'flex', gap: 7 }}>
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                style={{
                  width: i === active ? 24 : 8,
                  height: 8,
                  borderRadius: 4,
                  border: 'none',
                  background: i === active ? 'var(--accent)' : 'rgba(255,255,255,.35)',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'all 0.3s ease',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function PlanFeature({ text, on }) {
  return (
    <li style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontFamily: "'DM Mono',monospace", color: on ? 'var(--text2)' : 'var(--text3)' }}>
      <span style={{ color: on ? 'var(--green)' : 'var(--text3)', fontWeight: 700 }}>{on ? '✓' : '✗'}</span>
      {text}
    </li>
  )
}

function LoginCard() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ email, password }) })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Login failed'); return }
      login(data.accessToken, data.user, password)
      navigate('/dashboard')
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 16, padding: 32, boxShadow: '0 24px 64px rgba(0,0,0,.5)', maxWidth: 420, width: '100%', margin: '0 auto' }}>
      <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Sign in to your workspace</div>
      <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: "'DM Mono',monospace", marginBottom: 22 }}>Access your hub instantly</div>
      {error && <div className="auth-error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="field"><label>Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required /></div>
        <div className="field"><label>Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required /></div>
        <div style={{ textAlign: 'right', fontSize: 10, fontFamily: "'DM Mono',monospace", marginTop: -6, marginBottom: 14 }}>
          <Link to="/reset-password" style={{ color: 'var(--accent2)' }}>Forgot password?</Link>
        </div>
        <button className="btn-primary" type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign in →'}</button>
      </form>
      <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text3)', fontFamily: "'DM Mono',monospace", marginTop: 18 }}>
        Don't have an account? <Link to="/signup" style={{ color: 'var(--accent2)' }}>Sign up free</Link>
      </div>
    </div>
  )
}

export default function LandingPage() {
  const { accessToken } = useAuth()
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* NAV */}
      <nav style={{ display: 'flex', alignItems: 'center', padding: '0 48px', height: 100, background: 'rgba(11,13,18,.92)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(12px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/logo.png" alt="CloudDesktop" style={{ height: 84, width: 'auto', display: 'block' }} />
        </div>
        <div style={{ display: 'flex', gap: 28, marginLeft: 36 }}>
          <a href="#features" style={{ color: 'var(--text2)', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>Features</a>
          <a href="#pricing" style={{ color: 'var(--text2)', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>Pricing</a>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
          {accessToken ? (
            <button className="btn-ghost" onClick={() => navigate('/dashboard')}>Open workspace →</button>
          ) : (
            <>
              <Link to="/login"><button className="btn-ghost">Log in</button></Link>
              <Link to="/signup"><button className="btn-primary" style={{ padding: '7px 20px', fontSize: 13, width: 'auto' }}>Get started free</button></Link>
            </>
          )}
        </div>
      </nav>

      {/* HERO */}
      <section style={{ padding: '72px 48px 60px', maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--s2)', border: '1px solid var(--border2)', borderRadius: 20, padding: '4px 14px', fontSize: 11, fontFamily: "'DM Mono',monospace", color: 'var(--accent2)', marginBottom: 24 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
          Your entire workspace, one tab
        </div>
        <h1 style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.08, letterSpacing: '-2px', marginBottom: 18 }}>
          Launch every app.<br />
          <span style={{ background: 'linear-gradient(135deg,var(--accent),var(--purple))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Stay in the flow.</span>
        </h1>
        <p style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.7, maxWidth: 560, margin: '0 auto 36px', fontFamily: "'DM Mono',monospace" }}>
          CloudDesktop gives you a single hub for all your web apps, live news, bookmarks, notes, and widgets — all synced across every device.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 48 }}>
          <Link to="/signup"><button style={{ background: 'var(--accent)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 15, fontWeight: 700, padding: '13px 32px', cursor: 'pointer' }}>Start for free →</button></Link>
          <a href="#features"><button className="btn-ghost" style={{ padding: '13px 24px' }}>See features</button></a>
        </div>
        <Slideshow />
        <p style={{ fontSize: 11, color: 'var(--text3)', fontFamily: "'DM Mono',monospace", marginTop: 16 }}>No credit card required · Free forever plan available</p>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ padding: '60px 48px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 11, fontFamily: "'DM Mono',monospace", color: 'var(--accent2)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 10 }}>Everything you need</div>
          <h2 style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-1px', marginBottom: 8 }}>One hub. Every tool.</h2>
          <p style={{ fontSize: 14, color: 'var(--text2)', fontFamily: "'DM Mono',monospace" }}>Built for people who live inside their browser all day.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          {FEATURES.map(f => (
            <div key={f.title} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 24 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 14, background: `${f.color}22` }}>{f.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>{f.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', fontFamily: "'DM Mono',monospace", lineHeight: 1.65 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* LOGIN */}
      <section style={{ padding: '60px 48px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ background: 'linear-gradient(135deg, var(--s2) 0%, var(--surface) 100%)', border: '1px solid var(--border2)', borderRadius: 20, padding: '52px 48px', display: 'flex', gap: 64, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <div style={{ fontSize: 11, fontFamily: "'DM Mono',monospace", color: 'var(--accent2)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 12 }}>Already have an account?</div>
            <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-1px', marginBottom: 12 }}>Sign in to your workspace</h2>
            <p style={{ fontSize: 13, color: 'var(--text2)', fontFamily: "'DM Mono',monospace", lineHeight: 1.7, marginBottom: 0 }}>
              Pick up right where you left off. All your apps, bookmarks, and settings are waiting for you — synced and ready.
            </p>
          </div>
          <div style={{ flex: 1, minWidth: 300 }}>
            <LoginCard />
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ padding: '60px 48px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontFamily: "'DM Mono',monospace", color: 'var(--accent2)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 10 }}>Simple pricing</div>
          <h2 style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-1px', marginBottom: 8 }}>Start free. Upgrade when ready.</h2>
          <p style={{ fontSize: 14, color: 'var(--text2)', fontFamily: "'DM Mono',monospace" }}>No hidden fees. Cancel anytime.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20, marginTop: 36 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 28 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text2)', marginBottom: 8 }}>Free</div>
            <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-2px', marginBottom: 4 }}>$0 <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text2)' }}>/&nbsp;month</span></div>
            <div style={{ fontSize: 11, fontFamily: "'DM Mono',monospace", color: 'var(--text3)', marginBottom: 20 }}>Free forever</div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 24 }}>{FREE_FEATURES.map(f => <PlanFeature key={f.text} {...f} />)}</ul>
            <Link to="/signup"><button className="btn-ghost" style={{ width: '100%', padding: 10, fontSize: 13 }}>Get started free</button></Link>
          </div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--accent)', borderRadius: 16, padding: 28, position: 'relative', boxShadow: '0 0 0 1px var(--accent),0 8px 32px var(--aglow)' }}>
            <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'var(--accent)', color: '#fff', fontSize: 10, fontWeight: 700, fontFamily: "'DM Mono',monospace", padding: '3px 14px', borderRadius: 20, whiteSpace: 'nowrap' }}>Most Popular</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text2)', marginBottom: 8 }}>Premium</div>
            <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-2px', marginBottom: 4 }}>$4.99 <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text2)' }}>/&nbsp;month</span></div>
            <div style={{ fontSize: 11, fontFamily: "'DM Mono',monospace", color: 'var(--green)', marginBottom: 20 }}>or $39.99/year — save 33%</div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 24 }}>{PRO_FEATURES.map(f => <PlanFeature key={f.text} {...f} />)}</ul>
            <Link to="/signup"><button className="btn-primary" style={{ fontSize: 13 }}>Start free trial →</button></Link>
          </div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 28 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text2)', marginBottom: 8 }}>Enterprise</div>
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-2px', marginBottom: 4 }}>Contact us</div>
            <div style={{ fontSize: 11, fontFamily: "'DM Mono',monospace", color: 'var(--text3)', marginBottom: 20 }}>Custom pricing</div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 24 }}>{ENT_FEATURES.map(f => <PlanFeature key={f.text} {...f} />)}</ul>
            <button className="btn-ghost" style={{ width: '100%', padding: 10, fontSize: 13 }}>Contact sales →</button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <div style={{ borderTop: '1px solid var(--border)', maxWidth: 1100, margin: '0 auto', padding: '32px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontSize: 11, color: 'var(--text3)', fontFamily: "'DM Mono',monospace" }}>© 2026 CloudDesktop Workspace · clouddesktop.infoplay.com</p>
        <div>
          <a href="#" style={{ color: 'var(--text3)', fontFamily: "'DM Mono',monospace", fontSize: 11, textDecoration: 'none', marginLeft: 20 }}>Privacy</a>
          <a href="#" style={{ color: 'var(--text3)', fontFamily: "'DM Mono',monospace", fontSize: 11, textDecoration: 'none', marginLeft: 20 }}>Terms</a>
          <a href="mailto:support@clouddesktop.infoplay.com" style={{ color: 'var(--text3)', fontFamily: "'DM Mono',monospace", fontSize: 11, textDecoration: 'none', marginLeft: 20 }}>Contact</a>
        </div>
      </div>
    </div>
  )
}
