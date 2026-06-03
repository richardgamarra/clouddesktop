export default function JukeboxWidget() {
  // video(150) + nowplaying+title(28) + progress(18) + controls(34) + volume(22) + bottomnav(40) + padding = ~370
  const HEIGHT = 370

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
