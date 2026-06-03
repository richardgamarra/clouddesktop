export default function JukeboxWidget() {
  // Fills 100% of card height (card is 520px - 48px header = 472px content area)
  return (
    <div style={{ height:'100%', overflow:'hidden', borderRadius:8 }}>
      <iframe
        src="https://jukebox.richardgamarra.com?embed=1"
        width="100%"
        height="100%"
        frameBorder="0"
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        style={{ display:'block', border:'none', height:'100%' }}
        title="Jukebox"
      />
    </div>
  )
}
