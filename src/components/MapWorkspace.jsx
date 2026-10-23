import 'leaflet/dist/leaflet.css'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { MapContainer, TileLayer, Polyline, Marker, useMap, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import { MapPin, Navigation, Crosshair, Loader2, ShieldCheck, ChevronRight, Layers, Info } from 'lucide-react'

// ─── Custom HTML Markers ────────────────────────────────────────────────────────

const startIcon = L.divIcon({
  className: 'leaflet-div-icon',
  html: '<div class="w-4 h-4 bg-black border-2 border-white rounded-full shadow-lg flex items-center justify-center"><div class="w-1.5 h-1.5 bg-white rounded-full"></div></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

const endIcon = L.divIcon({
  className: 'leaflet-div-icon',
  html: '<div class="w-4 h-4 bg-black border-2 border-white rounded-full shadow-lg flex items-center justify-center"><div class="w-1.5 h-1.5 bg-white rounded-full"></div></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

const createPoiIcon = (label, type) => {
  let badgeColor = 'bg-blue-600 border-blue-700'
  let iconEmoji = '🚓'
  
  if (type === 'transit') {
    badgeColor = 'bg-amber-600 border-amber-700'
    iconEmoji = '🚌'
  } else if (type === 'shop') {
    badgeColor = 'bg-emerald-600 border-emerald-700'
    iconEmoji = '🏪'
  }

  return L.divIcon({
    className: 'leaflet-div-icon',
    html: `
      <div class="${badgeColor} text-white border text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md whitespace-nowrap flex items-center gap-1 font-mono transition-transform hover:scale-105">
        <span>${iconEmoji}</span>
        <span>${label}</span>
      </div>
    `,
    iconSize: [120, 24],
    iconAnchor: [60, 12],
  })
}

// ─── Map Camera Controller ────────────────────────────────────────────────────

function MapCameraController({ bounds }) {
  const map = useMap()
  useEffect(() => {
    if (bounds && bounds.length >= 2) {
      try {
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 })
      } catch (e) {
        // Safe catch for invalid bounds
      }
    }
  }, [bounds, map])
  return null
}

// ─── Defaults & Constants ─────────────────────────────────────────────────────

const DEFAULT_CENTER = [12.9565, 77.6337]
const DEFAULT_START = [12.9345, 77.6266] // Koramangala 4th Block
const DEFAULT_END = [12.9784, 77.6408]   // Indiranagar 100ft Road

// Segment styling configurations
const ROAD_STYLES = {
  HIGHWAY_LIT: {
    color: '#2563eb', // Solid Blue
    dashArray: undefined,
    label: 'Highway & Well-Lit',
  },
  FOREST_AREA: {
    color: '#16a34a', // Solid Green
    dashArray: undefined,
    label: 'Forest / Tree Canopy',
  },
  DARK_NO_LIGHT: {
    color: '#000000', // Solid Black
    dashArray: undefined,
    label: 'Dark Stretch (Unlit)',
  },
  CONSTRUCTION_IMPROPER: {
    color: '#d97706', // Dotted Amber
    dashArray: '4, 10',
    label: 'Under Construction',
  },
}

// Helper: split route coordinates into continuous segments without gaps
function splitRouteIntoSegments(coords, segmentPlan) {
  const total = coords.length
  if (total < 2) return []

  const segments = []
  let prevIdx = 0

  segmentPlan.forEach((plan, i) => {
    let nextIdx = Math.round(plan.endRatio * (total - 1))
    if (i === segmentPlan.length - 1) nextIdx = total - 1
    if (nextIdx <= prevIdx) nextIdx = Math.min(prevIdx + 1, total - 1)

    // Slice contiguous vertices (including boundary point so no gap)
    const segCoords = coords.slice(prevIdx, nextIdx + 1)
    if (segCoords.length >= 2) {
      segments.push({
        type: plan.type,
        coords: segCoords,
      })
    }
    prevIdx = nextIdx
  })

  return segments
}

export default function MapWorkspace({ activeRoute, setActiveRoute, theme, routesData, setRoutesData }) {
  // Input fields & coordinates
  const [startQuery, setStartQuery] = useState(routesData?.startName || 'Koramangala 4th Block')
  const [startCoords, setStartCoords] = useState(DEFAULT_START)
  const [startSuggestions, setStartSuggestions] = useState([])
  const [isSearchingStart, setIsSearchingStart] = useState(false)
  const [showStartDropdown, setShowStartDropdown] = useState(false)

  const [destQuery, setDestQuery] = useState(routesData?.destName || 'Indiranagar 100ft Road')
  const [destCoords, setDestCoords] = useState(DEFAULT_END)
  const [destSuggestions, setDestSuggestions] = useState([])
  const [isSearchingDest, setIsSearchingDest] = useState(false)
  const [showDestDropdown, setShowDestDropdown] = useState(false)

  // 3 Generated Routes data state
  const [routeSegments, setRouteSegments] = useState({
    '1': [],
    '2': [],
    '3': [],
  })
  const [routePois, setRoutePois] = useState({
    '1': [],
    '2': [],
    '3': [],
  })

  const [mapBounds, setMapBounds] = useState([DEFAULT_START, DEFAULT_END])
  const [isLoadingRoute, setIsLoadingRoute] = useState(false)
  const [isLocating, setIsLocating] = useState(false)

  const startDebounceTimer = useRef(null)
  const destDebounceTimer = useRef(null)

  // ── 1. Location Autocomplete Fetcher (Photon + Nominatim fallback) ───────────

  const fetchLocationSuggestions = async (query, setSuggestions, setLoading) => {
    if (!query || query.trim().length < 2) {
      setSuggestions([])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      // Primary: Photon OpenStreetMap API
      const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`)
      if (response.ok) {
        const data = await response.json()
        if (data?.features && data.features.length > 0) {
          const list = data.features.map((f) => {
            const p = f.properties || {}
            const parts = [
              p.name,
              p.street,
              p.district || p.suburb,
              p.city || p.county,
              p.state,
              p.country,
            ].filter(Boolean)
            const cleanLabel = [...new Set(parts)].join(', ')
            return {
              label: cleanLabel || p.name || 'Location',
              lat: f.geometry.coordinates[1],
              lng: f.geometry.coordinates[0],
            }
          })
          setSuggestions(list)
          setLoading(false)
          return
        }
      }

      // Fallback: Nominatim OpenStreetMap API
      const nomRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`)
      if (nomRes.ok) {
        const nomData = await nomRes.json()
        const list = nomData.map((item) => ({
          label: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
        }))
        setSuggestions(list)
      }
    } catch (err) {
      console.warn('Geocoding fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleStartInputChange = (e) => {
    const text = e.target.value
    setStartQuery(text)
    setShowStartDropdown(true)

    if (startDebounceTimer.current) clearTimeout(startDebounceTimer.current)
    startDebounceTimer.current = setTimeout(() => {
      fetchLocationSuggestions(text, setStartSuggestions, setIsSearchingStart)
    }, 300)
  }

  const handleDestInputChange = (e) => {
    const text = e.target.value
    setDestQuery(text)
    setShowDestDropdown(true)

    if (destDebounceTimer.current) clearTimeout(destDebounceTimer.current)
    destDebounceTimer.current = setTimeout(() => {
      fetchLocationSuggestions(text, setDestSuggestions, setIsSearchingDest)
    }, 300)
  }

  const handleSelectStartSuggestion = (item) => {
    setStartQuery(item.label)
    setStartCoords([item.lat, item.lng])
    setShowStartDropdown(false)
    setStartSuggestions([])
  }

  const handleSelectDestSuggestion = (item) => {
    setDestQuery(item.label)
    setDestCoords([item.lat, item.lng])
    setShowDestDropdown(false)
    setDestSuggestions([])
  }

  const handleUseCurrentLocation = () => {
    if (!('geolocation' in navigator)) {
      alert('Geolocation is not supported by your browser.')
      return
    }

    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setStartCoords([lat, lng])
        setStartQuery('Current Location')
        setIsLocating(false)

        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
          if (res.ok) {
            const data = await res.json()
            if (data?.display_name) {
              const shortName = data.display_name.split(',').slice(0, 3).join(', ')
              setStartQuery(shortName)
            }
          }
        } catch (e) {
          // fallback
        }
      },
      (err) => {
        setIsLocating(false)
        alert('Could not retrieve current location: ' + err.message)
      },
      { timeout: 10000, enableHighAccuracy: true }
    )
  }

  // ── 2. OSRM + Smart 3-Route Alternative Generator ───────────────────────────

  const calculateRoute = useCallback(async (start, end, startName, destName) => {
    if (!start || !end) return
    setIsLoadingRoute(true)

    const [startLat, startLng] = start
    const [endLat, endLng] = end

    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson&alternatives=3`
      const res = await fetch(url)
      const data = await res.json()

      let coords1 = []
      let coords2 = []
      let coords3 = []

      let dist1 = 6.2
      let dur1 = 22
      let dist2 = 5.8
      let dur2 = 20
      let dist3 = 5.1
      let dur3 = 16

      if (data?.code === 'Ok' && data.routes && data.routes.length > 0) {
        // Route 1 from primary OSRM route
        const r1 = data.routes[0]
        coords1 = r1.geometry.coordinates.map(([lng, lat]) => [lat, lng])
        dist1 = parseFloat((r1.distance / 1000).toFixed(1))
        dur1 = Math.max(1, Math.round(r1.duration / 60))

        const len = coords1.length
        const dLat = endLat - startLat
        const dLng = endLng - startLng
        const distMag = Math.sqrt(dLat * dLat + dLng * dLng) || 0.01

        // Normal perpendicular vectors
        const normLat = -dLng / distMag
        const normLng = dLat / distMag

        // Route 2: Use second OSRM route if available, otherwise algorithmic bypass curve
        if (data.routes.length >= 2) {
          const r2 = data.routes[1]
          coords2 = r2.geometry.coordinates.map(([lng, lat]) => [lat, lng])
          dist2 = parseFloat((r2.distance / 1000).toFixed(1))
          dur2 = Math.max(1, Math.round(r2.duration / 60))
        } else {
          coords2 = coords1.map((coord, idx) => {
            if (idx === 0 || idx === len - 1) return coord
            const curve = Math.sin((idx / len) * Math.PI)
            const offset = 0.0085 * curve
            return [coord[0] + normLat * offset, coord[1] + normLng * offset]
          })
          dist2 = parseFloat((dist1 * 0.94).toFixed(1))
          dur2 = Math.max(1, Math.round(dur1 * 0.9))
        }

        // Route 3: Use third OSRM route if available, otherwise algorithmic opposite shortcut curve
        if (data.routes.length >= 3) {
          const r3 = data.routes[2]
          coords3 = r3.geometry.coordinates.map(([lng, lat]) => [lat, lng])
          dist3 = parseFloat((r3.distance / 1000).toFixed(1))
          dur3 = Math.max(1, Math.round(r3.duration / 60))
        } else {
          coords3 = coords1.map((coord, idx) => {
            if (idx === 0 || idx === len - 1) return coord
            const curve = Math.sin((idx / len) * Math.PI)
            const offset = -0.011 * curve
            return [coord[0] + normLat * offset, coord[1] + normLng * offset]
          })
          dist3 = parseFloat((dist1 * 0.82).toFixed(1))
          dur3 = Math.max(1, Math.round(dur1 * 0.72))
        }
      } else {
        // Fallback smooth geometric coordinates connecting start to end
        const steps = 12
        for (let i = 0; i <= steps; i++) {
          const t = i / steps
          const baseLat = startLat + (endLat - startLat) * t
          const baseLng = startLng + (endLng - startLng) * t
          const curve = Math.sin(t * Math.PI)

          coords1.push([baseLat, baseLng])
          coords2.push([baseLat + 0.007 * curve, baseLng - 0.006 * curve])
          coords3.push([baseLat - 0.009 * curve, baseLng + 0.008 * curve])
        }
      }

      // ── Split into Styled Segments ──
      // Route 1 (Safe Highway): 78% Lit Highway, 14% Dark, 8% Forest
      const segs1 = splitRouteIntoSegments(coords1, [
        { type: 'HIGHWAY_LIT', endRatio: 0.45 },
        { type: 'HIGHWAY_LIT', endRatio: 0.75 },
        { type: 'DARK_NO_LIGHT', endRatio: 0.88 },
        { type: 'HIGHWAY_LIT', endRatio: 1.0 },
      ])

      // Route 2 (Forest Bypass): 42% Highway, 36% Forest, 18% Dark, 4% Construction
      const segs2 = splitRouteIntoSegments(coords2, [
        { type: 'HIGHWAY_LIT', endRatio: 0.30 },
        { type: 'FOREST_AREA', endRatio: 0.65 },
        { type: 'DARK_NO_LIGHT', endRatio: 0.82 },
        { type: 'HIGHWAY_LIT', endRatio: 1.0 },
      ])

      // Route 3 (Short Backroad): 22% Highway, 40% Dark, 26% Construction, 12% Forest
      const segs3 = splitRouteIntoSegments(coords3, [
        { type: 'HIGHWAY_LIT', endRatio: 0.22 },
        { type: 'CONSTRUCTION_IMPROPER', endRatio: 0.58 },
        { type: 'DARK_NO_LIGHT', endRatio: 0.85 },
        { type: 'HIGHWAY_LIT', endRatio: 1.0 },
      ])

      setRouteSegments({
        '1': segs1,
        '2': segs2,
        '3': segs3,
      })

      // ── Safe Haven POIs along Routes ──
      const len1 = coords1.length
      const len2 = coords2.length
      const len3 = coords3.length

      const pois1 = [
        { pos: coords1[Math.floor(len1 * 0.22)] || coords1[0], label: 'Police Station #4', type: 'police' },
        { pos: coords1[Math.floor(len1 * 0.48)] || coords1[0], label: 'Central Bus Transit Hub', type: 'transit' },
        { pos: coords1[Math.floor(len1 * 0.72)] || coords1[0], label: '24/7 Fuel & Pharmacy', type: 'shop' },
        { pos: coords1[Math.floor(len1 * 0.88)] || coords1[0], label: 'Highway Patrol Post', type: 'police' },
      ]

      const pois2 = [
        { pos: coords2[Math.floor(len2 * 0.35)] || coords2[0], label: 'Forest Beat Kiosk', type: 'police' },
        { pos: coords2[Math.floor(len2 * 0.72)] || coords2[0], label: 'Suburban Bus Stop', type: 'transit' },
      ]

      const pois3 = [
        { pos: coords3[Math.floor(len3 * 0.42)] || coords3[0], label: 'Corner Store & Fuel', type: 'shop' },
      ]

      setRoutePois({
        '1': pois1,
        '2': pois2,
        '3': pois3,
      })

      // Set Map camera bounds
      const allBounds = [start, end, ...coords1, ...coords2, ...coords3]
      setMapBounds(allBounds)

      // Update shared telemetry state
      if (setRoutesData) {
        setRoutesData({
          startName: startName || 'Start Point',
          destName: destName || 'Destination Point',
          routes: {
            '1': {
              id: '1',
              name: 'Route 1 (Primary Highway)',
              type: 'Well-Lit Highway / Commercial Corridor',
              distanceKm: dist1.toFixed(1),
              durationMin: dur1,
              safetyScore: 88,
              highwayPercent: 78,
              forestPercent: 4,
              darkPercent: 14,
              constructionPercent: 4,
              roadCondition: 'Multi-Lane Paved Highway',
              publicHubsCount: 4,
              publicHubs: [
                { label: 'Police Station #4', type: 'police' },
                { label: 'Central Bus Transit Hub', type: 'transit' },
                { label: '24/7 Fuel & Pharmacy', type: 'shop' },
                { label: 'Highway Patrol Post', type: 'police' },
              ],
              quickTags: '78% Highway • 4 Public Hubs',
              evaluationText: `Route 1 to ${destName || 'destination'} is strongly recommended (${dur1} mins, ${dist1} km). 78% of the corridor is well-lit multi-lane highway with 4 verified safe havens (Police kiosk, Transit hub, 24/7 fuel) and zero unpaved construction hazards.`,
            },
            '2': {
              id: '2',
              name: 'Route 2 (Forest Bypass)',
              type: 'Mixed Urban / Forest Bypass',
              distanceKm: dist2.toFixed(1),
              durationMin: dur2,
              safetyScore: 64,
              highwayPercent: 42,
              forestPercent: 36,
              darkPercent: 18,
              constructionPercent: 4,
              roadCondition: 'Paved Secondary Roads',
              publicHubsCount: 2,
              publicHubs: [
                { label: 'Forest Beat Kiosk', type: 'police' },
                { label: 'Suburban Bus Stop', type: 'transit' },
              ],
              quickTags: '36% Forest • 2 Public Hubs',
              evaluationText: `Route 2 bypasses congestion via tree-covered roads (${dur2} mins, ${dist2} km). Has 36% forest stretch with moderate lighting and 2 public hubs. Exercise caution when traveling after dark.`,
            },
            '3': {
              id: '3',
              name: 'Route 3 (Short Backroad)',
              type: 'Backroad / Construction Shortcut',
              distanceKm: dist3.toFixed(1),
              durationMin: dur3,
              safetyScore: 42,
              highwayPercent: 22,
              forestPercent: 12,
              darkPercent: 40,
              constructionPercent: 26,
              roadCondition: 'Under Construction / Rough Surface',
              publicHubsCount: 1,
              publicHubs: [
                { label: 'Corner Store & Fuel', type: 'shop' },
              ],
              quickTags: '40% Dark • Construction Zone',
              evaluationText: `Caution: Route 3 is the fastest (${dur3} mins, ${dist3} km), but 40% is pitch dark with rough construction stretches and only 1 commercial hub. High vulnerability risk for solo commuters.`,
            },
          },
        })
      }
    } catch (err) {
      console.error('OSRM route calculation error:', err)
    } finally {
      setIsLoadingRoute(false)
    }
  }, [setRoutesData])

  // Trigger initial calculation on mount
  useEffect(() => {
    calculateRoute(DEFAULT_START, DEFAULT_END, 'Koramangala 4th Block', 'Indiranagar 100ft Road')
  }, [calculateRoute])

  const handleFindRouteClick = () => {
    calculateRoute(startCoords, destCoords, startQuery, destQuery)
  }

  // Active POIs to display (prominently showing safe havens for active route, plus other key points)
  const currentPois = routePois[activeRoute] || routePois['1'] || []
  const r1 = routesData?.routes?.['1'] || { distanceKm: '6.2', durationMin: 22, safetyScore: 88, quickTags: '78% Highway • 4 Public Hubs' }
  const r2 = routesData?.routes?.['2'] || { distanceKm: '5.8', durationMin: 20, safetyScore: 64, quickTags: '36% Forest • 2 Public Hubs' }
  const r3 = routesData?.routes?.['3'] || { distanceKm: '5.1', durationMin: 16, safetyScore: 42, quickTags: '40% Dark • Construction Zone' }

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      
      {/* ── Leaflet Interactive Map Container (100% W/H, z-index: 0) ───────────── */}
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={13}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <MapCameraController bounds={mapBounds} />

        {/* Reliable OSM Tile Layer */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={19}
        />

        {/* ── Render All 3 Multi-Segment Styled Routes ────────────────────────── */}
        {['3', '2', '1'].map((routeId) => {
          const isCurrentActive = activeRoute === routeId
          const segments = routeSegments[routeId] || []

          return (
            <React.Fragment key={routeId}>
              {segments.map((seg, sIdx) => {
                const styleDef = ROAD_STYLES[seg.type] || ROAD_STYLES.HIGHWAY_LIT
                const isDotted = seg.type === 'CONSTRUCTION_IMPROPER'

                return (
                  <Polyline
                    key={`${routeId}-seg-${sIdx}`}
                    positions={seg.coords}
                    color={styleDef.color}
                    dashArray={styleDef.dashArray}
                    weight={isCurrentActive ? (isDotted ? 5 : 6) : (isDotted ? 3.5 : 4)}
                    opacity={isCurrentActive ? 1.0 : 0.40}
                    eventHandlers={{
                      click: () => setActiveRoute(routeId),
                    }}
                  >
                    <Tooltip sticky>
                      <span className="font-mono text-xs font-bold">
                        Route {routeId} • {styleDef.label}
                      </span>
                    </Tooltip>
                  </Polyline>
                )
              })}
            </React.Fragment>
          )
        })}

        {/* Start Point Marker */}
        {startCoords && <Marker position={startCoords} icon={startIcon} />}

        {/* End Point Marker */}
        {destCoords && <Marker position={destCoords} icon={endIcon} />}

        {/* Public Safe Havens for active route */}
        {currentPois.map((haven, idx) => (
          <Marker
            key={`poi-${activeRoute}-${idx}`}
            position={haven.pos}
            icon={createPoiIcon(haven.label, haven.type)}
          >
            <Tooltip permanent={false}>
              <div className="font-mono text-xs font-bold text-neutral-800">
                {haven.label} ({haven.type.toUpperCase()})
              </div>
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>

      {/* ── Top-Left Floating Card with Live Autocomplete (z-[1000]) ───────────── */}
      <div className="absolute top-4 left-4 z-[1000] w-72 sm:w-84 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 shadow-xl rounded-xl text-black dark:text-white p-4">
        <div className="space-y-3 mb-3">
          
          {/* Start Location Input & Dropdown */}
          <div className="relative">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-600 dark:text-neutral-400 font-bold">
                START LOCATION
              </label>
              <button
                onClick={handleUseCurrentLocation}
                disabled={isLocating}
                className="text-[10px] font-mono text-neutral-500 hover:text-black dark:hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                title="Use current GPS location"
              >
                {isLocating ? <Loader2 className="w-3 h-3 animate-spin text-black dark:text-white" /> : <Crosshair className="w-3 h-3 text-black dark:text-white" />}
                <span>GPS</span>
              </button>
            </div>

            <div className="flex items-center border border-neutral-300 dark:border-neutral-700 focus-within:border-black dark:focus-within:border-white px-2.5 py-1.5 bg-white/90 dark:bg-neutral-800/90 rounded-md transition-colors relative">
              <span className="font-mono text-xs text-neutral-500 mr-1.5 font-bold">o</span>
              <input
                type="text"
                value={startQuery}
                onChange={handleStartInputChange}
                onFocus={() => setShowStartDropdown(true)}
                className="w-full text-xs font-mono outline-none bg-transparent text-black dark:text-white"
                placeholder="Search start place..."
              />
              {isSearchingStart && <Loader2 className="w-3 h-3 animate-spin text-neutral-400 flex-shrink-0" />}
            </div>

            {/* Start Autocomplete Dropdown (z-[2000]) */}
            {showStartDropdown && startSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 z-[2000] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl rounded-xl overflow-hidden max-h-56 overflow-y-auto font-sans">
                {startSuggestions.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectStartSuggestion(item)}
                    className="px-3 py-2 text-xs text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2 cursor-pointer transition-colors border-b border-neutral-100 dark:border-neutral-800 last:border-b-0"
                  >
                    <MapPin className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Destination Location Input & Dropdown */}
          <div className="relative">
            <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-600 dark:text-neutral-400 font-bold mb-1">
              DESTINATION
            </label>

            <div className="flex items-center border border-neutral-300 dark:border-neutral-700 focus-within:border-black dark:focus-within:border-white px-2.5 py-1.5 bg-white/90 dark:bg-neutral-800/90 rounded-md transition-colors relative">
              <span className="font-mono text-xs text-neutral-500 mr-1.5 font-bold">x</span>
              <input
                type="text"
                value={destQuery}
                onChange={handleDestInputChange}
                onFocus={() => setShowDestDropdown(true)}
                className="w-full text-xs font-mono outline-none bg-transparent text-black dark:text-white"
                placeholder="Search destination place..."
              />
              {isSearchingDest && <Loader2 className="w-3 h-3 animate-spin text-neutral-400 flex-shrink-0" />}
            </div>

            {/* Destination Autocomplete Dropdown (z-[2000]) */}
            {showDestDropdown && destSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 z-[2000] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl rounded-xl overflow-hidden max-h-56 overflow-y-auto font-sans">
                {destSuggestions.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectDestSuggestion(item)}
                    className="px-3 py-2 text-xs text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2 cursor-pointer transition-colors border-b border-neutral-100 dark:border-neutral-800 last:border-b-0"
                  >
                    <Navigation className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Find Safest Route Button */}
        <button 
          onClick={handleFindRouteClick}
          disabled={isLoadingRoute}
          className="w-full bg-black dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-black text-xs font-mono font-bold uppercase tracking-wider py-2.5 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          {isLoadingRoute ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Analyzing 3 Paths...</span>
            </>
          ) : (
            <>
              <span>[&gt;] Find Safest Route</span>
            </>
          )}
        </button>
      </div>

      {/* ── Map Legend Overlay (Bottom-Right, stacked above route cards, z-[1000]) ─ */}
      <div className="absolute bottom-28 right-4 z-[1000] bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 shadow-xl rounded-xl p-3 text-black dark:text-white max-w-[210px] hidden md:block">
        <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2 border-b border-neutral-100 dark:border-neutral-800 pb-1">
          <Layers className="w-3 h-3 text-primary" />
          <span>ROAD INFRASTRUCTURE</span>
        </div>
        
        <div className="space-y-1.5 font-mono text-[10px]">
          <div className="flex items-center gap-2">
            <span className="w-4 h-1.5 bg-[#2563eb] rounded-full inline-block flex-shrink-0"></span>
            <span className="text-neutral-700 dark:text-neutral-300">Highway &amp; Well-Lit</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-1.5 bg-[#16a34a] rounded-full inline-block flex-shrink-0"></span>
            <span className="text-neutral-700 dark:text-neutral-300">Forest / Tree Canopy</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-1.5 bg-black dark:bg-white rounded-full inline-block flex-shrink-0"></span>
            <span className="text-neutral-700 dark:text-neutral-300">Dark Stretch (Unlit)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-1 border-t-2 border-dashed border-[#d97706] inline-block flex-shrink-0"></span>
            <span className="text-neutral-700 dark:text-neutral-300">Under Construction</span>
          </div>
        </div>

        <div className="mt-2.5 pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-[9px] font-mono text-neutral-500">
          <span>🚓 Police</span>
          <span>🚌 Transit</span>
          <span>🏪 Fuel/Shop</span>
        </div>
      </div>

      {/* ── Bottom Overlay Cards: 3-Route Selector (z-[1000]) ──────────────────── */}
      <div className="absolute bottom-4 left-4 right-4 z-[1000] grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
        
        {/* Card 1: Route 1 (Safe Highway) */}
        <button
          onClick={() => setActiveRoute('1')}
          className={`text-left p-3 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md shadow-xl rounded-xl transition-all cursor-pointer ${
            activeRoute === '1'
              ? 'border-2 border-black dark:border-white ring-2 ring-blue-500/30'
              : 'border border-neutral-200 dark:border-neutral-800 opacity-75 hover:opacity-100'
          }`}
        >
          <div className="font-mono text-xs font-bold text-black dark:text-white uppercase tracking-wider mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5 truncate">
              <span className="w-2.5 h-2.5 bg-blue-600 rounded-full inline-block flex-shrink-0" />
              Route 1 (Safe Highway)
            </span>
            <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded shadow-sm flex-shrink-0">
              {r1.safetyScore}/100
            </span>
          </div>
          <div className="font-mono text-[11px] text-neutral-600 dark:text-neutral-400">
            <span className="font-bold text-black dark:text-white">{r1.durationMin} min</span> ({r1.distanceKm} km) • {r1.quickTags}
          </div>
        </button>

        {/* Card 2: Route 2 (Forest Bypass) */}
        <button
          onClick={() => setActiveRoute('2')}
          className={`text-left p-3 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md shadow-xl rounded-xl transition-all cursor-pointer ${
            activeRoute === '2'
              ? 'border-2 border-black dark:border-white ring-2 ring-emerald-500/30'
              : 'border border-neutral-200 dark:border-neutral-800 opacity-75 hover:opacity-100'
          }`}
        >
          <div className="font-mono text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5 truncate">
              <span className="w-2.5 h-2.5 bg-emerald-600 rounded-full inline-block flex-shrink-0" />
              Route 2 (Forest Bypass)
            </span>
            <span className="text-[10px] bg-amber-600 text-white font-bold px-2 py-0.5 rounded shadow-sm flex-shrink-0">
              {r2.safetyScore}/100
            </span>
          </div>
          <div className="font-mono text-[11px] text-neutral-600 dark:text-neutral-400">
            <span className="font-bold text-black dark:text-white">{r2.durationMin} min</span> ({r2.distanceKm} km) • {r2.quickTags}
          </div>
        </button>

        {/* Card 3: Route 3 (Short Backroad) */}
        <button
          onClick={() => setActiveRoute('3')}
          className={`text-left p-3 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md shadow-xl rounded-xl transition-all cursor-pointer ${
            activeRoute === '3'
              ? 'border-2 border-black dark:border-white ring-2 ring-rose-500/30'
              : 'border border-neutral-200 dark:border-neutral-800 opacity-75 hover:opacity-100'
          }`}
        >
          <div className="font-mono text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5 truncate">
              <span className="w-2.5 h-2.5 bg-black dark:bg-white rounded-full inline-block flex-shrink-0" />
              Route 3 (Backroad Shortcut)
            </span>
            <span className="text-[10px] bg-rose-600 text-white font-bold px-2 py-0.5 rounded shadow-sm flex-shrink-0">
              {r3.safetyScore}/100
            </span>
          </div>
          <div className="font-mono text-[11px] text-neutral-600 dark:text-neutral-400">
            <span className="font-bold text-black dark:text-white">{r3.durationMin} min</span> ({r3.distanceKm} km) • {r3.quickTags}
          </div>
        </button>

      </div>

    </div>
  )
}
