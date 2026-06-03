import { useRef, useState, useEffect } from 'react'

export default function JukeboxWidget() {
  const containerRef = useRef(null)
  const [iframeH, setIframeH] = useState(580)

  useEffect(() => {
    function update() {
      if (!containerRef.current) return
      const w = containerRef.current.offsetWidth
      // Video height = clamp(220, 38% of width, 520) + controls ~170px + nav ~50px
      const videoH = Math.min(Math.max(Math.round(w * 0.38), 220), 520)
      setIframeH(videoH + 230) // video + controls + upnext
    }
    update()
    const ro = new ResizeObserver(update)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  return (
    <div ref={containerRef}
      style={{ overflow:'hidden', borderRadius:8, height: iframeH }}>
      <iframe
        src="https://jukebox.richardgamarra.com?embed=1"
        width="100%"
        height={iframeH}
        frameBorder="0"
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        style={{ display:'block', border:'none' }}
        title="Jukebox"
      />
    </div>
  )
}
