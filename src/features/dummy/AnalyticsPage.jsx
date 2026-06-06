export default function AnalyticsPage() {
  return (
    <div className="page-dummy">
      <div className="page-header">
        <h1>Analytics</h1>
        <p className="page-subtitle">Track your activity and insights</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card stat-primary">
          <span className="stat-value">—</span>
          <span className="stat-label">Page Views</span>
        </div>
        <div className="stat-card stat-success">
          <span className="stat-value">—</span>
          <span className="stat-label">Sessions</span>
        </div>
        <div className="stat-card stat-warning">
          <span className="stat-value">—</span>
          <span className="stat-label">Events</span>
        </div>
      </div>

      <div className="dash-card">
        <h2>Coming Soon</h2>
        <p className="text-muted">
          Analytics dashboard is under development. Check back later for charts,
          user activity tracking, and performance metrics.
        </p>
      </div>
    </div>
  )
}
