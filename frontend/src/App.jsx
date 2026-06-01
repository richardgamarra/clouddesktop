export default function App() {
  return (
    <div style={{
      background: '#0b0d12',
      color: '#e8eaf2',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '12px'
    }}>
      <div style={{
        width: 52, height: 52,
        background: 'linear-gradient(135deg, #5b7fff, #a78bfa)',
        borderRadius: 14,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18, fontWeight: 800, color: '#fff'
      }}>CW</div>
      <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px' }}>
        CloudDesktop Workspace
      </h1>
      <p style={{ color: '#8b90a8', fontFamily: "'DM Mono', monospace", fontSize: 13 }}>
        Stage 1 scaffold — deploy pipeline working ✓
      </p>
    </div>
  )
}
