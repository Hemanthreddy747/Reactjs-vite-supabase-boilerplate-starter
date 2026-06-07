import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthProvider'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './LocationPage.css'

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

const TAB_SEND = 'send'
const TAB_MAP = 'map'

const DELAY_OPTIONS = [
  { label: '30 seconds', value: 30000 },
  { label: '1 minute', value: 60000 },
  { label: '3 minutes', value: 180000 },
  { label: '5 minutes', value: 300000 },
  { label: '10 minutes', value: 600000 },
  { label: '20 minutes', value: 1200000 },
  { label: '30 minutes', value: 1800000 },
]

function SendTab({ user }) {
  const [isTracking, setIsTracking] = useState(false)
  const [currentLocation, setCurrentLocation] = useState(null)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [delay, setDelay] = useState(30000)
  const intervalRef = useRef(null)

  const sendLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        setCurrentLocation({ latitude, longitude })

        const { data: inserted, error: dbError } = await supabase
          .from('locations')
          .insert({ user_id: user.id, latitude, longitude })
          .select('created_at')
          .single()

        if (dbError) {
          setError(dbError.message)
        } else {
          setStatus(`Location sent at ${new Date(inserted.created_at).toLocaleTimeString()}`)
          setError('')
        }
      },
      (err) => {
        setError(`Geolocation error: ${err.message}`)
      },
      { enableHighAccuracy: true },
    )
  }, [user.id])

  const startTracking = () => {
    setError('')
    setIsTracking(true)
    sendLocation()
    intervalRef.current = setInterval(sendLocation, delay)
  }

  const stopTracking = () => {
    setIsTracking(false)
    setStatus('Tracking stopped')
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  const handleDelayChange = (newDelay) => {
    setDelay(newDelay)
    if (isTracking) {
      clearInterval(intervalRef.current)
      intervalRef.current = setInterval(sendLocation, newDelay)
    }
  }

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const formatDelay = (ms) => {
    const opt = DELAY_OPTIONS.find((o) => o.value === ms)
    return opt ? opt.label : `${ms / 1000} seconds`
  }

  return (
    <div className="location-send">
      <div className="location-card">
        <h3>Location Tracker</h3>
        <p className="page-description">
          {isTracking
            ? `Sending your location every ${formatDelay(delay)}.`
            : 'Start tracking to send your location periodically.'}
        </p>

        <div className="location-delay-selector">
          <label htmlFor="delay-select">Send interval</label>
          <select
            id="delay-select"
            value={delay}
            onChange={(e) => handleDelayChange(Number(e.target.value))}
            disabled={isTracking}
            className="location-select"
          >
            {DELAY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="location-controls">
          {!isTracking ? (
            <button className="btn-primary location-btn" onClick={startTracking}>
              Start Tracking
            </button>
          ) : (
            <button className="btn-danger location-btn" onClick={stopTracking}>
              Stop Tracking
            </button>
          )}
        </div>

        {currentLocation && (
          <div className="location-current">
            <p><strong>Latitude:</strong> {currentLocation.latitude.toFixed(6)}</p>
            <p><strong>Longitude:</strong> {currentLocation.longitude.toFixed(6)}</p>
          </div>
        )}

        {status && <p className="location-status">{status}</p>}
        {error && <p className="location-error">{error}</p>}

        {isTracking && (
          <div className="location-pulse">
            <span className="pulse-dot" />
            <span>Tracking active</span>
          </div>
        )}
      </div>
    </div>
  )
}

const PAGE_SIZE = 30

function MapTab({ user }) {
  const [locations, setLocations] = useState([])
  const [lastLocation, setLastLocation] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [mapCenter, setMapCenter] = useState(null)
  const [selectedRowId, setSelectedRowId] = useState(null)
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    const from = (page - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1
    supabase
      .from('locations')
      .select('id, latitude, longitude, created_at', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(from, to)
      .then(({ data, error: err, count }) => {
        if (cancelled) return
        setIsLoading(false)
        if (err) {
          setError(err.message)
        } else {
          const locs = data ?? []
          setLocations(locs)
          setTotalCount(count ?? 0)
          if (locs.length > 0 && page === 1) {
            setLastLocation(locs[0])
          }
          setError('')
        }
      })
    return () => { cancelled = true }
  }, [user.id, page])

  useEffect(() => {
    const channel = supabase
      .channel('locations-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'locations',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newLoc = payload.new
          setLastLocation(newLoc)
          setTotalCount((prev) => prev + 1)
          if (page === 1) {
            setLocations((prev) => {
              const updated = [newLoc, ...prev]
              return updated.slice(0, PAGE_SIZE)
            })
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user.id, page])

  useEffect(() => {
    const target = mapCenter || lastLocation
    if (!target || !mapRef.current) return

    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setView(
          [target.latitude, target.longitude],
          15,
        )
        if (markerRef.current) {
          markerRef.current.setLatLng([
            target.latitude,
            target.longitude,
          ])
        }
        return
      }

      const map = L.map(mapRef.current, {
        center: [target.latitude, target.longitude],
        zoom: 15,
        zoomControl: true,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map)

      const marker = L.marker([
        target.latitude,
        target.longitude,
      ]).addTo(map)
      marker.bindPopup(
        mapCenter ? 'Selected location' : 'Last known location',
      )

      mapInstanceRef.current = map
      markerRef.current = marker
    }, 100)

    return () => clearTimeout(timer)
  }, [mapCenter, lastLocation])

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        markerRef.current = null
      }
    }
  }, [])

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  return (
    <div className="location-map-tab">
      <div className="location-card">
        <div className="location-map-header">
          <h3>Location Map</h3>
          <div className="location-map-actions">
            {mapCenter ? (
              <button className="btn-ghost-sm" onClick={() => { setMapCenter(null); setSelectedRowId(null) }}>
                Reset
              </button>
            ) : lastLocation && (
              <span className="location-live-badge">LIVE</span>
            )}
          </div>
        </div>

        {error && <p className="location-error">{error}</p>}

        {isLoading ? (
          <p className="location-loading">Loading locations...</p>
        ) : !lastLocation ? (
          <p className="location-empty">
            No location data yet. Start tracking from the Send tab.
          </p>
        ) : (
          <>
            <div ref={mapRef} className="location-map-container" />

            <div className="location-table-wrapper">
              <table className="location-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Latitude</th>
                    <th>Longitude</th>
                    <th>Date &amp; Time</th>
                  </tr>
                </thead>
                <tbody>
                  {locations.map((loc, i) => (
                    <tr
                      key={loc.id}
                      className={loc.id === selectedRowId ? 'row-selected' : ''}
                      onClick={() => {
                        setMapCenter({ latitude: loc.latitude, longitude: loc.longitude })
                        setSelectedRowId(loc.id)
                      }}
                    >
                      <td>{(page - 1) * PAGE_SIZE + i + 1}</td>
                      <td>{loc.latitude.toFixed(6)}</td>
                      <td>{loc.longitude.toFixed(6)}</td>
                      <td className="cell-date">{formatDateTime(loc.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pagination">
              <button
                className="pagination-btn"
                disabled={page <= 1}
                onClick={() => { setIsLoading(true); setPage((p) => p - 1) }}
              >
                Previous
              </button>
              <span className="pagination-info">
                Page {page} of {totalPages} ({totalCount} total)
              </span>
              <button
                className="pagination-btn"
                disabled={page >= totalPages}
                onClick={() => { setIsLoading(true); setPage((p) => p + 1) }}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function LocationPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState(TAB_SEND)

  return (
    <div className="page-location">
      <div className="page-header">
        <h1>Location</h1>
        <p className="page-subtitle">Track and view your location data</p>
      </div>

      <div className="auth-tabs location-tabs">
        <button
          className={`tab-btn${activeTab === TAB_SEND ? ' active' : ''}`}
          onClick={() => setActiveTab(TAB_SEND)}
        >
          Send Location
        </button>
        <button
          className={`tab-btn${activeTab === TAB_MAP ? ' active' : ''}`}
          onClick={() => setActiveTab(TAB_MAP)}
        >
          View Map
        </button>
      </div>

      {activeTab === TAB_SEND && <SendTab user={user} />}
      {activeTab === TAB_MAP && <MapTab user={user} />}
    </div>
  )
}
