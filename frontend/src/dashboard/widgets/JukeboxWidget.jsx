export default function JukeboxWidget() {
  // embed mode: no sidebar, no bottom nav, compact controls
  // video(180) + nowplaying(~20) + title(~24) + progress(~20) + controls(~36) + volume(~24) = ~310px
  const HEIGHT = 310

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
