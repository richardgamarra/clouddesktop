// Singleton to persist music state across tab switches
let _current = null
const listeners = new Set()

export function setPlaying(playlist) { _current = playlist; listeners.forEach(cb => cb(playlist)) }
export function getPlaying() { return _current }
export function subscribe(cb) { listeners.add(cb); return () => listeners.delete(cb) }
