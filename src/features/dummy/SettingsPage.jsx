export default function SettingsPage() {
  return (
    <div className="page-dummy">
      <div className="page-header">
        <h1>Settings</h1>
        <p className="page-subtitle">Manage your preferences</p>
      </div>

      <div className="dash-card">
        <h2>Application Settings</h2>
        <div className="settings-group">
          <div className="setting-item">
            <div>
              <strong>Email Notifications</strong>
              <p className="text-muted">Receive email updates about your account</p>
            </div>
            <label className="toggle">
              <input type="checkbox" defaultChecked />
              <span className="toggle-slider" />
            </label>
          </div>
          <div className="setting-item">
            <div>
              <strong>Dark Mode</strong>
              <p className="text-muted">Switch between light and dark themes</p>
            </div>
            <label className="toggle">
              <input type="checkbox" />
              <span className="toggle-slider" />
            </label>
          </div>
        </div>
      </div>

      <div className="dash-card">
        <h2>Account</h2>
        <p className="text-muted">
          Manage your account settings on the{' '}
          <a href="/dashboard/profile">Profile page</a>.
        </p>
      </div>
    </div>
  )
}
