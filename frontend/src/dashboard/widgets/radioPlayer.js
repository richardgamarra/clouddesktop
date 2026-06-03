// Singleton radio player — persists across tab switches
// The Audio element lives at module scope, not inside a React component

let audio = null
let _station = null
let _playing = false
let _volume = 0.8
const listeners = new Set()

function getAudio() {
  if (!audio) {
    audio = new Audio()
    audio.preload = 'none'
    audio.addEventListener('play',  () => { _playing = true;  notify() })
    audio.addEventListener('pause', () => { _playing = false; notify() })
    audio.addEventListener('ended', () => { _playing = false; notify() })
    audio.addEventListener('error', () => { _playing = false; notify() })
  }
  return audio
}

function notify() {
  listeners.forEach(cb => cb({ station: _station, playing: _playing, volume: _volume }))
}

export function play(station) {
  const a = getAudio()
  if (_station?.url !== station.url) {
    a.src = station.url
    _station = station
  }
  a.volume = _volume
  a.play().catch(() => { _playing = false; notify() })
}

export function pause() {
  if (audio) audio.pause()
}

export function toggle(station) {
  if (_station?.url === station.url && _playing) {
    pause()
  } else {
    play(station)
  }
}

export function setVolume(v) {
  _volume = v
  if (audio) audio.volume = v
  notify()
}

export function getState() {
  return { station: _station, playing: _playing, volume: _volume }
}

export function subscribe(cb) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}
