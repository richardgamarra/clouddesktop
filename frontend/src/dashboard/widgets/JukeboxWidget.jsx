import { useRef, useState, useEffect } from 'react'

export default function JukeboxWidget() {
  const containerRef = useRef(null)
  const [scale, setScale]   = useState(1)
  const [contW, setContW]   = useState(560)

  // Native jukebox dimensions (from actual app)
  const NATIVE_W = 1280
  const NATIVE_H = 900

  useEffect(() => {
    function update() {
      if (!containerRef.current) return
      const w = containerRef.current.offsetWidth
      setContW(w)
      setScale(w / NATIVE_W)
    }
    update()
    const ro = new ResizeObserver(update)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  const scaledH = Math.round(NATIVE_H * scale)

  return (
    <div ref={containerRef}
      style={{ overflow:'hidden', borderRadius:8, height: scaledH, position:'relative' }}>
      <iframe
        src="https://jukebox.richardgamarra.com"
        width={NATIVE_W}
        height={NATIVE_H}
        frameBorder="0"
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        style={{
          display:'block',
          border:'none',
          transformOrigin:'top left',
          transform:`scale(${scale})`,
          position:'absolute',
          top:0, left:0,
        }}
        title="Jukebox"
      />
    </div>
  )
}
