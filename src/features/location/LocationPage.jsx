import { useEffect, useRef, useState, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthProvider'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const SHARE_INTERVAL_MS = 30000
const FIVE_DAYS_AGO = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()

function FlyTo({ center }) {
  const map = useMap()
  useEffect(() => {
    if (center) {
      map.flyTo([center.lat, center.lng], 16, { duration: 1 })
    }
  }, [center, map])
  return null
}

export default function LocationPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('share')

  return (
    <div className="page-location">
      <div className="page-header">
        <h1>Location</h1>
        <p className="page-subtitle">Share your live GPS location</p>
      </div>

      <div className="location-tabs">
        <button
          type="button"
          className={`tab-btn${activeTab === 'share' ? ' active' : ''}`}
          onClick={() => setActiveTab('share')}
        >
          Share Location
        </button>
        <button
          type="button"
          className={`tab-btn${activeTab === 'map' ? ' active' : ''}`}
          onClick={() => setActiveTab('map')}
        >
          Live Map
        </button>
      </div>

      {activeTab === 'share' ? (
        <ShareTab userId={user.id} />
      ) : (
        <MapTab userId={user.id} />
      )}
    </div>
  )
}

function ShareTab({ userId }) {
  const [position, setPosition] = useState(null)
  const [isSharing, setIsSharing] = useState(false)
  const [shareCount, setShareCount] = useState(0)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [lastSharedTime, setLastSharedTime] = useState(null)
  const watchIdRef = useRef(null)
  const positionRef = useRef(null)
  const intervalRef = useRef(null)
  const countdownRef = useRef(null)

  const shareLocation = useCallback(async (pos) => {
    if (!pos) return
    const { latitude, longitude, accuracy } = pos.coords
    const { data, error: dbError } = await supabase
      .from('locations')
      .insert({
        user_id: userId,
        latitude,
        longitude,
        accuracy: accuracy ?? null,
      })
      .select('created_at')
      .single()
    if (dbError) {
      setError(dbError.message)
    } else {
      setShareCount(prev => prev + 1)
      setLastSharedTime(data.created_at)
      setError('')
    }
  }, [userId])

  const startSharing = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      return
    }
    setError('')

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition(pos)
        positionRef.current = pos
        setIsSharing(true)
        setError('')
      },
      (err) => {
        setError(`Geolocation error: ${err.message}`)
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    )
    watchIdRef.current = watchId
  }

  const stopSharing = () => {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    clearInterval(intervalRef.current)
    clearInterval(countdownRef.current)
    intervalRef.current = null
    countdownRef.current = null
    setIsSharing(false)
    setCountdown(0)
  }

  useEffect(() => {
    if (!position || !isSharing) return

    intervalRef.current = setInterval(() => {
      shareLocation(positionRef.current)
    }, SHARE_INTERVAL_MS)

    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) return Math.floor(SHARE_INTERVAL_MS / 1000)
        return prev - 1
      })
    }, 1000)

    setCountdown(Math.floor(SHARE_INTERVAL_MS / 1000))

    return () => {
      clearInterval(intervalRef.current)
      clearInterval(countdownRef.current)
    }
  }, [position, isSharing, shareLocation])

  useEffect(() => {
    if (position && isSharing) {
      shareLocation(positionRef.current || position)
    }
  }, [isSharing])

  useEffect(() => {
    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
      clearInterval(intervalRef.current)
      clearInterval(countdownRef.current)
    }
  }, [])

  const formatDateTime = (iso) => {
    if (!iso) return ''
    return new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  return (
    <div className="location-share-card">
      <div className="location-status-bar">
        <span className={`status-dot${isSharing ? ' active' : ''}`} />
        <span>{isSharing ? 'Sharing active' : 'Not sharing'}</span>
      </div>

      {error && <p className="location-error">{error}</p>}

      {position && (
        <div className="location-coords">
          <div className="coord-row">
            <span className="coord-label">Latitude</span>
            <span className="coord-value">{position.coords.latitude.toFixed(6)}</span>
          </div>
          <div className="coord-row">
            <span className="coord-label">Longitude</span>
            <span className="coord-value">{position.coords.longitude.toFixed(6)}</span>
          </div>
          <div className="coord-row">
            <span className="coord-label">Accuracy</span>
            <span className="coord-value">{Math.round(position.coords.accuracy)}m</span>
          </div>
        </div>
      )}

      <div className="location-share-actions">
        {!isSharing ? (
          <button type="button" className="share-btn start" onClick={startSharing}>
            Start Sharing
          </button>
        ) : (
          <button type="button" className="share-btn stop" onClick={stopSharing}>
            Stop Sharing
          </button>
        )}
      </div>

      {shareCount > 0 && (
        <div className="location-share-stats">
          <div className="share-stat">
            <span className="share-stat-value">{shareCount}</span>
            <span className="share-stat-label">Times Shared</span>
          </div>
          {lastSharedTime && (
            <div className="share-stat">
              <span className="share-stat-value">{formatDateTime(lastSharedTime)}</span>
              <span className="share-stat-label">Last Shared At</span>
            </div>
          )}
          {countdown > 0 && (
            <div className="share-stat">
              <span className="share-stat-value">{countdown}s</span>
              <span className="share-stat-label">Next Share</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const PAGE_SIZE = 10

function MapTab({ userId }) {
  const [dbLocations, setDbLocations] = useState([])
  const [selectedLocId, setSelectedLocId] = useState(null)
  const [displayedLocation, setDisplayedLocation] = useState(null)
  const [flyToCenter, setFlyToCenter] = useState(null)
  const [error, setError] = useState('')
  const [isTracking, setIsTracking] = useState(false)
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)

    const countQuery = supabase
      .from('locations')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', FIVE_DAYS_AGO)

    const dataQuery = supabase
      .from('locations')
      .select('id, latitude, longitude, accuracy, created_at')
      .eq('user_id', userId)
      .gte('created_at', FIVE_DAYS_AGO)
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    Promise.all([countQuery, dataQuery]).then(([countRes, dataRes]) => {
      if (cancelled) return
      if (countRes.error) {
        setError(countRes.error.message)
      } else if (dataRes.error) {
        setError(dataRes.error.message)
      } else {
        setTotalCount(countRes.count ?? 0)
        setDbLocations(dataRes.data ?? [])
        if (page === 0 && dataRes.data && dataRes.data.length > 0) {
          const last = dataRes.data[0]
          setDisplayedLocation({ lat: last.latitude, lng: last.longitude, id: last.id })
          setSelectedLocId(last.id)
        }
        setError('')
      }
      setIsLoading(false)
    })

    return () => { cancelled = true }
  }, [userId, page])

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      return
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        setDisplayedLocation({ lat: latitude, lng: longitude })
        setIsTracking(true)
        setError('')
      },
      (err) => {
        setError(`Geolocation error: ${err.message}`)
        setIsTracking(false)
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    )

    return () => {
      navigator.geolocation.clearWatch(watchId)
    }
  }, [])

  const handleRowClick = (loc) => {
    setSelectedLocId(loc.id)
    setDisplayedLocation({ lat: loc.latitude, lng: loc.longitude })
    setFlyToCenter({ lat: loc.latitude, lng: loc.longitude })
  }

  const formatDateTime = (iso) => {
    if (!iso) return ''
    return new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const mapCenter = displayedLocation || { lat: 20, lng: 78 }

  return (
    <div className="location-map-card">
      <div className="location-status-bar">
        <span className={`status-dot${isTracking ? ' active' : ''}`} />
        <span>{isTracking ? 'Tracking active' : 'Waiting for GPS...'}</span>
        {totalCount > 0 && (
          <span className="map-points-count">
            {totalCount} saved
          </span>
        )}
      </div>

      {error && <p className="location-error">{error}</p>}

      <div className="location-map-container">
        <MapContainer
          center={mapCenter}
          zoom={15}
          className="location-map"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {displayedLocation && (
            <Marker position={[displayedLocation.lat, displayedLocation.lng]} />
          )}
          {flyToCenter && <FlyTo center={flyToCenter} />}
        </MapContainer>
      </div>

      {isLoading ? (
        <p className="location-empty">Loading history...</p>
      ) : dbLocations.length > 0 ? (
        <div className="location-history">
          <h3 className="location-history-title">Location History</h3>
          <div className="location-history-table-wrapper">
            <table className="location-history-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Latitude</th>
                  <th>Longitude</th>
                  <th>Accuracy</th>
                </tr>
              </thead>
              <tbody>
                {dbLocations.map((loc) => (
                  <tr
                    key={loc.id}
                    className={`history-row${selectedLocId === loc.id ? ' selected' : ''}`}
                    onClick={() => handleRowClick(loc)}
                  >
                    <td className="cell-datetime">{formatDateTime(loc.created_at)}</td>
                    <td className="cell-coord">{loc.latitude.toFixed(6)}</td>
                    <td className="cell-coord">{loc.longitude.toFixed(6)}</td>
                    <td className="cell-accuracy">{loc.accuracy ? `${Math.round(loc.accuracy)}m` : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="location-pagination">
            <button
              type="button"
              className="pagination-btn"
              disabled={page === 0}
              onClick={() => setPage(prev => prev - 1)}
            >
              Previous
            </button>
            <span className="pagination-info">
              Page {page + 1} of {totalPages}
            </span>
            <button
              type="button"
              className="pagination-btn"
              disabled={page >= totalPages - 1}
              onClick={() => setPage(prev => prev + 1)}
            >
              Next
            </button>
          </div>
        </div>
      ) : (
        <p className="location-empty">No location data found.</p>
      )}
    </div>
  )
}
