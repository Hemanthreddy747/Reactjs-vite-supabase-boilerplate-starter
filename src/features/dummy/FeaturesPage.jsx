export default function FeaturesPage() {
  return (
    <div className="page-dummy">
      <div className="page-header">
        <h1>Features</h1>
        <p className="page-subtitle">Explore available features</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card stat-primary">
          <span className="stat-value">—</span>
          <span className="stat-label">Active</span>
        </div>
        <div className="stat-card stat-success">
          <span className="stat-value">—</span>
          <span className="stat-label">Coming Soon</span>
        </div>
        <div className="stat-card stat-warning">
          <span className="stat-value">—</span>
          <span className="stat-label">Planned</span>
        </div>
      </div>

      <div className="dash-card">
        <h2>Coming Soon</h2>
        <p className="text-muted">
          Feature showcase is under development. Check back later for a full
          list of capabilities and integrations.
        </p>
      </div>
    </div>
  )
}
