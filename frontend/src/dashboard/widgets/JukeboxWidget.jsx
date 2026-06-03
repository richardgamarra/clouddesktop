export default function JukeboxWidget() {
  const HEIGHT = 410

  return (
    <div style={{ overflow:'hidden', borderRadius:8, height: HEIGHT }}>
      <iframe
        src="https://jukebox.richardgamarra.com?embed=1"
        width="100%"
        height={HEIGHT}
        frameBorder="0"
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        style={{ display:'block', border:'none' }}
        title="Jukebox"
      />
    </div>
  )
}
