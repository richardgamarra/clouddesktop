import { useRef, useState, useEffect } from 'react'

export default function JukeboxWidget() {
  const containerRef = useRef(null)
  const [scale, setScale] = useState(1)

  // Calculate scale based on available width vs jukebox's native width (~1000px)
  useEffect(() => {
    function updateScale() {
      if (containerRef.current) {
        const available = containerRef.current.offsetWidth
        const nativeW = 1000 // jukebox designed width
        setScale(Math.min(1, available / nativeW))
      }
    }
    updateScale()
    const ro = new ResizeObserver(updateScale)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  const nativeH = 680  // jukebox native height
  const scaledH = Math.round(nativeH * scale)

  return (
    <div ref={containerRef} style={{ margin:'-16px', overflow:'hidden', borderRadius:'0 0 12px 12px', height: scaledH }}>
      <iframe
        src="https://jukebox.richardgamarra.com"
        width={`${Math.round(100 / scale)}%`}
        height={nativeH}
        frameBorder="0"
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        style={{
          display:'block',
          border:'none',
          transformOrigin:'top left',
          transform:`scale(${scale})`,
        }}
        title="Jukebox"
      />
    </div>
  )
}
