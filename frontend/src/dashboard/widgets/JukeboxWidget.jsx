export default function JukeboxWidget() {
  const HEIGHT = 330  // video(175) + nowplaying+title(30) + progress(20) + controls(38) + volume(24) + padding

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
