import { useEffect, useRef, useState } from 'react'
import { X, Check, Search } from 'lucide-react'

// Loads Leaflet (CSS + JS) from CDN once, no API key needed.
function loadLeaflet() {
  return new Promise((resolve) => {
    if (window.L) { resolve(window.L); return }
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => resolve(window.L)
    document.body.appendChild(script)
  })
}

export default function LocationPickerModal({ initial, onClose, onPick }) {
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const leafletRef = useRef(null)
  const [coords, setCoords] = useState(initial?.lat != null ? { lat: initial.lat, lng: initial.lng } : null)
  const [search, setSearch] = useState('')
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    let map
    loadLeaflet().then((L) => {
      leafletRef.current = L
      const start = initial?.lat != null ? [initial.lat, initial.lng] : [31.9539, 35.9106] // default: Amman
      map = L.map('location-picker-map').setView(start, initial?.lat != null ? 15 : 6)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(map)
      mapRef.current = map

      if (initial?.lat != null) {
        markerRef.current = L.marker(start).addTo(map)
      }

      map.on('click', (e) => {
        const { lat, lng } = e.latlng
        setCoords({ lat: +lat.toFixed(6), lng: +lng.toFixed(6) })
        if (markerRef.current) markerRef.current.setLatLng(e.latlng)
        else markerRef.current = L.marker(e.latlng).addTo(map)
      })

      // Fix tiles not rendering in a freshly-shown container
      setTimeout(() => map.invalidateSize(), 200)
    })
    return () => { if (map) map.remove() }
  }, [])

  // Search by place name (free OpenStreetMap Nominatim)
  const doSearch = async (e) => {
    e.preventDefault()
    if (!search.trim()) return
    setSearching(true)
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(search)}`)
      const data = await res.json()
      if (data[0]) {
        const lat = +(+data[0].lat).toFixed(6)
        const lng = +(+data[0].lon).toFixed(6)
        setCoords({ lat, lng })
        const L = leafletRef.current
        mapRef.current.setView([lat, lng], 15)
        if (markerRef.current) markerRef.current.setLatLng([lat, lng])
        else markerRef.current = L.marker([lat, lng]).addTo(mapRef.current)
      }
    } catch { /* ignore */ }
    setSearching(false)
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div>
            <h3 className="font-semibold text-gray-900">Pick Clinic Location</h3>
            <p className="text-xs text-gray-400">Click anywhere on the map to drop a pin</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        {/* Search */}
        <form onSubmit={doSearch} className="flex gap-2 p-3 border-b border-gray-100">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search for a place (e.g. your clinic, area, city)"
              className="w-full pl-9 pr-3 py-2 bg-gray-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button type="submit" disabled={searching}
            className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-800 disabled:opacity-50">
            {searching ? '...' : 'Search'}
          </button>
        </form>

        <div id="location-picker-map" style={{ height: 360, width: '100%' }} />

        <div className="flex items-center justify-between p-4 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            {coords ? `📍 ${coords.lat}, ${coords.lng}` : 'No location selected yet'}
          </p>
          <button
            onClick={() => coords && onPick(coords.lat, coords.lng)}
            disabled={!coords}
            className="flex items-center gap-1.5 bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-40">
            <Check size={15} /> Confirm Location
          </button>
        </div>
      </div>
    </div>
  )
}
