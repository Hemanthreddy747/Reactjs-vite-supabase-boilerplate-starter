import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthProvider'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const TABS = { COLLECT: 'collect', MAP: 'map' }
const PAGE_SIZE = 30

const INTERVAL_OPTIONS = [
  { label: '10 sec', value: 10 },
  { label: '30 sec', value: 30 },
  { label: '2 min', value: 120 },
  { label: '3 min', value: 180 },
  { label: '5 min', value: 300 },
  { label: '10 min', value: 600 },
  { label: '20 min', value: 1200 },
]

export default function LocationPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState(TABS.COLLECT)
  const [isTracking, setIsTracking] = useState(false)
  const [lastLocation, setLastLocation] = useState(null)
  const [lastLocationTime, setLastLocationTime] = useState(null)
  const [locationCount, setLocationCount] = useState(0)
  const [locations, setLocations] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [lastRefreshed, setLastRefreshed] = useState(null)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [trackInterval, setTrackInterval] = useState(10)
  const trackIntervalRef = useRef(null)
  const mapIntervalRef = useRef(null)
  const lastSentLocationRef = useRef(null)

  const fetchLocations = useCallback((pageNum) => {
    const from = (pageNum - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1
    supabase
      .from('locations')
      .select('id, latitude, longitude, created_at', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(from, to)
      .then(({ data, error, count }) => {
        if (error) {
          setErrorMessage(error.message)
        } else {
          setLocations(data ?? [])
          setTotalCount(count ?? 0)
          if (pageNum === 1 && data?.length) {
            setLastLocation({ lat: data[0].latitude, lng: data[0].longitude })
          }
          setErrorMessage('')
        }
        setIsLoading(false)
        setLastRefreshed(new Date())
      })
  }, [user.id])

  useEffect(() => {
    fetchLocations(page)
  }, [fetchLocations, page])

  useEffect(() => {
    if (activeTab === TABS.MAP) {
      mapIntervalRef.current = setInterval(() => {
        setPage(1)
        fetchLocations(1)
      }, 10000)
    }
    return () => {
      if (mapIntervalRef.current) {
        clearInterval(mapIntervalRef.current)
        mapIntervalRef.current = null
      }
    }
  }, [activeTab, fetchLocations])

  const getDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371000
    const toRad = (deg) => (deg * Math.PI) / 180
    const dLat = toRad(lat2 - lat1)
    const dLng = toRad(lng2 - lng1)
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }

  const captureAndSend = useCallback(async () => {
    if (!navigator.geolocation) {
      setErrorMessage('Geolocation is not supported by this browser')
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        setLastLocation({ lat: latitude, lng: longitude })
        setLastLocationTime(new Date())

        const prev = lastSentLocationRef.current
        if (prev) {
          const dist = getDistance(prev.lat, prev.lng, latitude, longitude)
          if (dist < 20) {
            return
          }
        }

        const { error } = await supabase
          .from('locations')
          .insert({ user_id: user.id, latitude, longitude })

        if (error) {
          setErrorMessage(error.message)
        } else {
          lastSentLocationRef.current = { lat: latitude, lng: longitude }
          setLocationCount((c) => c + 1)
          setErrorMessage('')
        }
      },
      (err) => {
        setErrorMessage(`Geolocation error: ${err.message}`)
      },
      { enableHighAccuracy: true, timeout: 5000 },
    )
  }, [user.id])

  const startTracking = () => {
    if (trackIntervalRef.current) return
    captureAndSend()
    trackIntervalRef.current = setInterval(captureAndSend, trackInterval * 1000)
    setIsTracking(true)
  }

  const stopTracking = () => {
    if (trackIntervalRef.current) {
      clearInterval(trackIntervalRef.current)
      trackIntervalRef.current = null
    }
    setIsTracking(false)
  }

  useEffect(() => {
    return () => {
      if (trackIntervalRef.current) clearInterval(trackIntervalRef.current)
      if (mapIntervalRef.current) clearInterval(mapIntervalRef.current)
    }
  }, [])

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

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
    <div className="page-location">
      <div className="page-header">
        <h1>Location</h1>
        <p className="page-subtitle">Track and view your location history</p>
      </div>

      <div className="loc-tabs">
        <button
          type="button"
          className={`tab-btn${activeTab === TABS.COLLECT ? ' active' : ''}`}
          onClick={() => setActiveTab(TABS.COLLECT)}
        >
          Collect
        </button>
        <button
          type="button"
          className={`tab-btn${activeTab === TABS.MAP ? ' active' : ''}`}
          onClick={() => setActiveTab(TABS.MAP)}
        >
          Map &amp; History
        </button>
      </div>

      {activeTab === TABS.COLLECT && (
        <div className="loc-collect">
          <div className="loc-collect-card">
            <div className="loc-collect-info">
              <div className="loc-collect-status">
                <span className={`loc-status-dot${isTracking ? ' tracking' : ''}`} />
                <span>{isTracking ? `Tracking every ${INTERVAL_OPTIONS.find(o => o.value === trackInterval).label}` : 'Not tracking'}</span>
              </div>
              {lastLocation && (
                <p className="loc-collect-coords">
                  {lastLocation.lat.toFixed(6)}, {lastLocation.lng.toFixed(6)}
                </p>
              )}
              {lastLocationTime && (
                <p className="loc-collect-time">
                  Last updated: {lastLocationTime.toLocaleTimeString('en-US', {
                    hour: '2-digit', minute: '2-digit', second: '2-digit',
                  })}
                </p>
              )}
              <p className="loc-collect-count">
                Locations saved: <strong>{locationCount}</strong>
              </p>
              {errorMessage && <p className="loc-error">{errorMessage}</p>}
            </div>
            <div className="loc-collect-actions">
              <select
                className="loc-interval-select"
                value={trackInterval}
                onChange={(e) => setTrackInterval(Number(e.target.value))}
                disabled={isTracking}
              >
                {INTERVAL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {!isTracking ? (
                <button type="button" className="loc-btn-start" onClick={startTracking}>
                  Start Tracking
                </button>
              ) : (
                <button type="button" className="loc-btn-stop" onClick={stopTracking}>
                  Stop Tracking
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === TABS.MAP && (
        <div className="loc-map-section">
          {lastLocation ? (
            <div className="loc-map-wrap">
              <div className="loc-map-container">
                <MapContainer
                  center={[lastLocation.lat, lastLocation.lng]}
                  zoom={15}
                  className="loc-map"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={selectedLocation ? [selectedLocation.lat, selectedLocation.lng] : [lastLocation.lat, lastLocation.lng]}>
                    <Popup>{selectedLocation ? 'Selected location' : 'Latest location'}</Popup>
                  </Marker>
                </MapContainer>
              </div>
              {selectedLocation && (
                <button type="button" className="loc-map-reset" onClick={() => setSelectedLocation(null)}>
                  Reset to latest
                </button>
              )}
            </div>
          ) : (
            <div className="loc-map-placeholder">
              <p>No location data yet. Start tracking to see your location on the map.</p>
            </div>
          )}

          <div className="loc-table-section">
            <div className="loc-table-header">
              <h2>Location History</h2>
              {lastRefreshed && (
                <span className="loc-refresh-info">Refreshed at {formatTime(lastRefreshed)}</span>
              )}
            </div>
            {isLoading ? (
              <p className="loc-empty">Loading locations...</p>
            ) : locations.length === 0 ? (
              <p className="loc-empty">No location data recorded yet.</p>
            ) : (
              <div className="loc-table-wrapper">
                <table className="loc-table">
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
                        className={selectedLocation?.id === loc.id ? 'row-selected' : ''}
                        onClick={() => setSelectedLocation({ id: loc.id, lat: loc.latitude, lng: loc.longitude })}
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
            )}
            {totalCount > PAGE_SIZE && (
              <div className="loc-pagination">
                <button
                  type="button"
                  className="loc-page-btn"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </button>
                <span className="loc-page-info">
                  Page {page} of {Math.ceil(totalCount / PAGE_SIZE)}
                </span>
                <button
                  type="button"
                  className="loc-page-btn"
                  disabled={page >= Math.ceil(totalCount / PAGE_SIZE)}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
