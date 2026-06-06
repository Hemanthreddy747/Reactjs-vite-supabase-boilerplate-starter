import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthProvider'
import { supabase } from '../../lib/supabaseClient'

function StatCard({ label, value, accent }) {
  return (
    <div className={`stat-card stat-${accent}`}>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    supabase
      .from('todos')
      .select('is_completed')
      .eq('user_id', user.id)
      .then(({ data, error }) => {
        if (cancelled) return
        if (!error && data) {
          setStats({
            total: data.length,
            completed: data.filter((t) => t.is_completed).length,
            pending: data.filter((t) => !t.is_completed).length,
          })
        }
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [user.id])

  const displayName = user.user_metadata?.full_name || user.user_metadata?.name || user.email

  return (
    <div className="page-dashboard">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p className="page-subtitle">Welcome back, {displayName}</p>
      </div>

      <div className="stats-grid">
        <StatCard label="Total Tasks" value={loading ? '...' : stats.total} accent="primary" />
        <StatCard label="Completed" value={loading ? '...' : stats.completed} accent="success" />
        <StatCard label="Pending" value={loading ? '...' : stats.pending} accent="warning" />
      </div>

      <div className="dashboard-cards">
        <div className="dash-card">
          <h2>Quick Actions</h2>
          <div className="quick-actions">
            <a href="/dashboard/todos" className="quick-action">
              <span className="qa-icon">+</span>
              <span>New Task</span>
            </a>
            <a href="/dashboard/profile" className="quick-action">
              <span className="qa-icon">@</span>
              <span>Profile</span>
            </a>
            <a href="/dashboard/analytics" className="quick-action">
              <span className="qa-icon">&#x25B3;</span>
              <span>Analytics</span>
            </a>
          </div>
        </div>

        <div className="dash-card">
          <h2>Account</h2>
          <div className="dash-account-info">
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Member since:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
            {user.last_sign_in_at && (
              <p><strong>Last sign in:</strong> {new Date(user.last_sign_in_at).toLocaleDateString()}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
