import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const S = {
  nav: { display:'flex', alignItems:'center', padding:'0 48px', height:64, background:'rgba(11,13,18,.9)', borderBottom:'1px solid var(--border)', position:'sticky', top:0, zIndex:100, backdropFilter:'blur(12px)' },
  navLogo: { display:'flex', alignItems:'center', gap:10, fontSize:17, fontWeight:800, letterSpacing:'-.4px' },
  navLogoIcon: { height:48, width:'auto', display:'block' },
  navLinks: { display:'flex', gap:28, marginLeft:36 },
  navLink: { color:'var(--text2)', fontSize:13, fontWeight:600, textDecoration:'none' },
  navRight: { marginLeft:'auto', display:'flex', gap:10, alignItems:'center' },
  hero: { display:'grid', gridTemplateColumns:'1fr 380px', gap:48, alignItems:'center', padding:'72px 48px 60px', maxWidth:1200, margin:'0 auto' },
  badge: { display:'inline-flex', alignItems:'center', gap:6, background:'var(--s2)', border:'1px solid var(--border2)', borderRadius:20, padding:'4px 14px', fontSize:11, fontFamily:"'DM Mono',monospace", color:'var(--accent2)', marginBottom:20 },
  badgeDot: { width:6, height:6, borderRadius:'50%', background:'var(--green)', display:'inline-block' },
  heroTitle: { fontSize:50, fontWeight:800, lineHeight:1.1, letterSpacing:'-2px', marginBottom:16 },
  heroTitleSpan: { background:'linear-gradient(135deg,var(--accent),var(--purple))', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' },
  heroSub: { fontSize:15, color:'var(--text2)', lineHeight:1.7, maxWidth:460, marginBottom:28, fontFamily:"'DM Mono',monospace" },
  heroCta: { display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' },
  btnBig: { background:'var(--accent)', border:'none', borderRadius:10, color:'#fff', fontSize:15, fontWeight:700, padding:'12px 28px', transition:'all var(--t)', cursor:'pointer' },
  heroNote: { fontSize:11, color:'var(--text3)', fontFamily:"'DM Mono',monospace", marginTop:12 },
  loginCard: { background:'var(--surface)', border:'1px solid var(--border2)', borderRadius:16, padding:28, boxShadow:'0 24px 64px rgba(0,0,0,.6)' },
  forgotLink: { textAlign:'right', fontSize:10, fontFamily:"'DM Mono',monospace", color:'var(--accent2)', marginTop:-6, marginBottom:12, display:'block' },
  divider: { textAlign:'center', fontSize:11, color:'var(--text3)', fontFamily:"'DM Mono',monospace", margin:'14px 0' },
  section: { padding:'60px 48px', maxWidth:1200, margin:'0 auto' },
  sectionLabel: { fontSize:11, fontFamily:"'DM Mono',monospace", color:'var(--accent2)', textTransform:'uppercase', letterSpacing:'.12em', marginBottom:10 },
  sectionTitle: { fontSize:34, fontWeight:800, letterSpacing:'-1px', marginBottom:8 },
  sectionSub: { fontSize:14, color:'var(--text2)', fontFamily:"'DM Mono',monospace", marginBottom:40 },
  featGrid: { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 },
  featCard: { background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:22 },
  featIcon: { width:42, height:42, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, marginBottom:14 },
  featTitle: { fontSize:14, fontWeight:700, marginBottom:6 },
  featDesc: { fontSize:12, color:'var(--text2)', fontFamily:"'DM Mono',monospace", lineHeight:1.6 },
  pricingGrid: { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20, marginTop:36 },
  planCard: { background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, padding:28, position:'relative' },
  planCardFeatured: { border:'1px solid var(--accent)', boxShadow:'0 0 0 1px var(--accent),0 8px 32px var(--aglow)' },
  planBadge: { position:'absolute', top:-12, left:'50%', transform:'translateX(-50%)', background:'var(--accent)', color:'#fff', fontSize:10, fontWeight:700, fontFamily:"'DM Mono',monospace", padding:'3px 14px', borderRadius:20, whiteSpace:'nowrap' },
  planName: { fontSize:14, fontWeight:700, color:'var(--text2)', marginBottom:8 },
  planPrice: { fontSize:36, fontWeight:800, letterSpacing:'-2px', marginBottom:4 },
  planAnnual: { fontSize:11, fontFamily:"'DM Mono',monospace", color:'var(--green)', marginBottom:20 },
  planFeatures: { listStyle:'none', display:'flex', flexDirection:'column', gap:9, marginBottom:24 },
  planFeatureItem: { fontSize:12, fontFamily:"'DM Mono',monospace", color:'var(--text2)', display:'flex', alignItems:'center', gap:8 },
  planFeatureOff: { color:'var(--text3)' },
  footer: { borderTop:'1px solid var(--border)', padding:'32px 48px', maxWidth:1200, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between' },
  footerText: { fontSize:11, color:'var(--text3)', fontFamily:"'DM Mono',monospace" },
  footerLink: { color:'var(--text3)', fontFamily:"'DM Mono',monospace", fontSize:11, textDecoration:'none', marginLeft:20 },
}

const FEATURES = [
  { icon:'🚀', bg:'rgba(91,127,255,.13)', title:'App Launcher', desc:'Open Gmail, Notion, Slack and 100+ apps in named browser tabs. Click again to focus — no duplicates.' },
  { icon:'📰', bg:'rgba(61,220,170,.13)', title:'Live News Feed', desc:'CNN, BBC, ESPN, TechCrunch and more — fetched fresh with images. Add any RSS source. Filter by outlet.' },
  { icon:'🗂️', bg:'rgba(167,139,250,.13)', title:'App Groups', desc:'Organize apps into color-coded groups. Drag to reorder. Right-click to edit anything.' },
  { icon:'⌨️', bg:'rgba(245,166,35,.13)', title:'Keyboard Shortcuts', desc:'Assign a global shortcut to any app. Press Ctrl+Shift+G to jump to Gmail instantly.' },
  { icon:'🔒', bg:'rgba(255,91,110,.13)', title:'Private by Design', desc:'Your settings are encrypted in your browser before touching the server. We store a blob we cannot read.' },
  { icon:'☁️', bg:'rgba(56,189,248,.13)', title:'Cloud Sync', desc:'Premium users get encrypted sync across all devices. Import/export as JSON anytime.' },
]

const FREE_FEATURES = [
  { text:'Up to 2 groups', on:true },
  { text:'Up to 10 apps', on:true },
  { text:'3 news sources', on:true },
  { text:'2 custom tabs', on:true },
  { text:'Local settings only', on:true },
  { text:'Cloud sync', on:false },
  { text:'Custom themes', on:false },
]

const PRO_FEATURES = [
  { text:'Unlimited groups', on:true },
  { text:'Unlimited apps', on:true },
  { text:'Unlimited news sources', on:true },
  { text:'Unlimited custom tabs', on:true },
  { text:'Encrypted cloud sync', on:true },
  { text:'Custom themes', on:true },
  { text:'Priority support', on:true },
]

const ENT_FEATURES = [
  { text:'Everything in Premium', on:true },
  { text:'Admin panel', on:true },
  { text:'User management', on:true },
  { text:'Usage analytics', on:true },
  { text:'SLA guarantee', on:true },
  { text:'Dedicated support', on:true },
  { text:'Custom domain', on:true },
]

function PlanFeature({ text, on }) {
  return (
    <li style={{ ...S.planFeatureItem, ...(on ? {} : S.planFeatureOff) }}>
      <span style={{ color: on ? 'var(--green)' : 'var(--text3)', fontWeight:700 }}>{on ? '✓' : '✗'}</span>
      {text}
    </li>
  )
}

function HeroLoginCard() {
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
      const res = await fetch('/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include', body: JSON.stringify({ email, password }) })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Login failed'); return }
      login(data.accessToken, data.user, password)
      navigate('/dashboard')
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }

  return (
    <div style={S.loginCard}>
      <div style={{ fontSize:17, fontWeight:800, marginBottom:4 }}>Sign in to your hub</div>
      <div style={{ fontSize:11, color:'var(--text3)', fontFamily:"'DM Mono',monospace", marginBottom:20 }}>Access your workspace instantly</div>
      {error && <div className="auth-error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="field"><label>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required /></div>
        <div className="field"><label>Password</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required /></div>
        <Link to="/reset-password" style={S.forgotLink}>Forgot password?</Link>
        <button className="btn-primary" type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign in →'}</button>
      </form>
      <div style={S.divider}>— or —</div>
      <div style={{ textAlign:'center', fontSize:11, color:'var(--text3)', fontFamily:"'DM Mono',monospace" }}>
        Don't have an account? <Link to="/signup" style={{ color:'var(--accent2)' }}>Sign up free</Link>
      </div>
    </div>
  )
}

export default function LandingPage() {
  const { accessToken } = useAuth()
  const navigate = useNavigate()

  return (
    <div>
      {/* NAV */}
      <nav style={S.nav}>
        <div style={S.navLogo}><img src="/logo.png" alt="CloudDesktop" style={S.navLogoIcon} /></div>
        <div style={S.navLinks}>
          <a href="#features" style={S.navLink}>Features</a>
          <a href="#pricing" style={S.navLink}>Pricing</a>
        </div>
        <div style={S.navRight}>
          {accessToken ? (
            <button className="btn-ghost" onClick={() => navigate('/dashboard')}>Open workspace →</button>
          ) : (
            <>
              <Link to="/login"><button className="btn-ghost">Log in</button></Link>
              <Link to="/signup"><button className="btn-primary" style={{ padding:'7px 20px', fontSize:13, width:'auto' }}>Get started free</button></Link>
            </>
          )}
        </div>
      </nav>

      {/* HERO */}
      <section style={S.hero}>
        <div>
          <div style={S.badge}><span style={S.badgeDot}></span> Now with live news feeds</div>
          <h1 style={S.heroTitle}>Your entire<br /><span style={S.heroTitleSpan}>workspace,</span><br />one place.</h1>
          <p style={S.heroSub}>Launch all your web apps — Gmail, Notion, Slack, Drive and more — from a single hub. Stay logged into everything simultaneously.</p>
          <div style={S.heroCta}>
            <Link to="/signup"><button style={S.btnBig}>Start for free →</button></Link>
            <a href="#features"><button className="btn-ghost">See features</button></a>
          </div>
          <p style={S.heroNote}>No credit card required · Free forever plan available</p>
        </div>
        <HeroLoginCard />
      </section>

      {/* FEATURES */}
      <section id="features" style={S.section}>
        <div style={S.sectionLabel}>Everything you need</div>
        <h2 style={S.sectionTitle}>One hub. Every tool.</h2>
        <p style={S.sectionSub}>Built for people who live inside their browser all day.</p>
        <div style={S.featGrid}>
          {FEATURES.map(f => (
            <div key={f.title} style={S.featCard}>
              <div style={{ ...S.featIcon, background: f.bg }}>{f.icon}</div>
              <div style={S.featTitle}>{f.title}</div>
              <div style={S.featDesc}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={S.section}>
        <div style={{ textAlign:'center' }}>
          <div style={S.sectionLabel}>Simple pricing</div>
          <h2 style={S.sectionTitle}>Start free. Upgrade when ready.</h2>
          <p style={S.sectionSub}>No hidden fees. Cancel anytime.</p>
        </div>
        <div style={S.pricingGrid}>
          {/* FREE */}
          <div style={S.planCard}>
            <div style={S.planName}>Free</div>
            <div style={S.planPrice}>$0 <span style={{ fontSize:14, fontWeight:400, color:'var(--text2)' }}>/&nbsp;month</span></div>
            <div style={{ ...S.planAnnual, color:'var(--text3)' }}>Free forever</div>
            <ul style={S.planFeatures}>{FREE_FEATURES.map(f => <PlanFeature key={f.text} {...f} />)}</ul>
            <Link to="/signup"><button className="btn-ghost" style={{ width:'100%', padding:10, fontSize:13 }}>Get started free</button></Link>
          </div>
          {/* PREMIUM */}
          <div style={{ ...S.planCard, ...S.planCardFeatured }}>
            <div style={S.planBadge}>Most Popular</div>
            <div style={S.planName}>Premium</div>
            <div style={S.planPrice}>$4.99 <span style={{ fontSize:14, fontWeight:400, color:'var(--text2)' }}>/&nbsp;month</span></div>
            <div style={S.planAnnual}>or $39.99/year — save 33%</div>
            <ul style={S.planFeatures}>{PRO_FEATURES.map(f => <PlanFeature key={f.text} {...f} />)}</ul>
            <Link to="/signup"><button className="btn-primary" style={{ fontSize:13 }}>Start free trial →</button></Link>
          </div>
          {/* ENTERPRISE */}
          <div style={S.planCard}>
            <div style={S.planName}>Enterprise</div>
            <div style={{ ...S.planPrice, fontSize:24 }}>Contact us</div>
            <div style={{ ...S.planAnnual, color:'var(--text3)' }}>Custom pricing</div>
            <ul style={S.planFeatures}>{ENT_FEATURES.map(f => <PlanFeature key={f.text} {...f} />)}</ul>
            <button className="btn-ghost" style={{ width:'100%', padding:10, fontSize:13 }}>Contact sales →</button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <div style={{ maxWidth:1200, margin:'0 auto' }}>
        <footer style={S.footer}>
          <p style={S.footerText}>© 2026 CloudDesktop Workspace · clouddesktop.infoplay.com</p>
          <div>
            <a href="#" style={S.footerLink}>Privacy</a>
            <a href="#" style={S.footerLink}>Terms</a>
            <a href="mailto:support@clouddesktop.infoplay.com" style={S.footerLink}>Contact</a>
          </div>
        </footer>
      </div>
    </div>
  )
}
