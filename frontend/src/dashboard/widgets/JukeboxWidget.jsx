import { useRef, useState, useEffect } from 'react'

export default function JukeboxWidget() {
  const containerRef = useRef(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    function updateScale() {
      if (containerRef.current) {
        const available = containerRef.current.offsetWidth
        const nativeW = 1000
        setScale(Math.min(1, available / nativeW))
      }
    }
    updateScale()
    const ro = new ResizeObserver(updateScale)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  const nativeH = 680
  const scaledH = Math.round(nativeH * scale)

  return (
    <div ref={containerRef} style={{ overflow:'hidden', borderRadius:8, height: scaledH }}>
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
