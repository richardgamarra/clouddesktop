export default function JukeboxWidget() {
  return (
    <div style={{ margin:'-16px', height:520, borderRadius:'0 0 12px 12px', overflow:'hidden' }}>
      <iframe
        src="https://jukebox.richardgamarra.com"
        width="100%"
        height="100%"
        frameBorder="0"
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        style={{ display:'block', border:'none' }}
        title="Jukebox"
      />
    </div>
  )
}
