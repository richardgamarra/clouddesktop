import { useRef, useState, useEffect } from 'react'

export default function JukeboxWidget() {
  const containerRef = useRef(null)
  const [height, setHeight] = useState(560)

  // Auto-height: match the container width * aspect ratio
  useEffect(() => {
    function update() {
      if (!containerRef.current) return
      // Sidebar(180) + video(200) + controls(~160) + upnext(~130) + header(0 hidden)
      setHeight(560)
    }
    update()
    const ro = new ResizeObserver(update)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  return (
    <div ref={containerRef}
      style={{ overflow:'hidden', borderRadius:8, height }}>
      <iframe
        src="https://jukebox.richardgamarra.com?embed=1"
        width="100%"
        height={height}
        frameBorder="0"
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        style={{ display:'block', border:'none' }}
        title="Jukebox"
      />
    </div>
  )
}
