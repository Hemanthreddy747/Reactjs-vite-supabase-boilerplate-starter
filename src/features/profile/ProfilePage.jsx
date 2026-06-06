import { useAuth } from '../../context/AuthProvider'

export default function ProfilePage() {
  const { user, signInWithGoogle } = useAuth()

  const displayName = user.user_metadata?.full_name || user.user_metadata?.name || user.email
  const avatarUrl = user.user_metadata?.avatar_url
  const provider = user.app_metadata?.provider || 'email'
  const memberSince = new Date(user.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const lastSignIn = user.last_sign_in_at
    ? new Date(user.last_sign_in_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—'

  const identities = user.identities || []

  return (
    <div className="page-profile">
      <div className="page-header">
        <h1>Profile</h1>
        <p className="page-subtitle">Your account details and settings</p>
      </div>

      <div className="profile-card-detailed">
        <div className="profile-head">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="profile-avatar-img" />
          ) : (
            <div className="profile-avatar-lg">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h2>{displayName}</h2>
            <p className="profile-email">{user.email}</p>
            <span className="provider-badge">
              {provider === 'email' ? 'Email' : provider}
            </span>
          </div>
        </div>

        <div className="profile-details">
          <div className="detail-row">
            <span className="detail-label">User ID</span>
            <span className="detail-value code">{user.id}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Email</span>
            <span className="detail-value">{user.email}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Email Verified</span>
            <span className="detail-value">
              {user.email_confirmed_at ? 'Yes' : 'No'}
            </span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Member Since</span>
            <span className="detail-value">{memberSince}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Last Sign In</span>
            <span className="detail-value">{lastSignIn}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Auth Provider</span>
            <span className="detail-value">{provider}</span>
          </div>

          {identities.length > 1 && (
            <div className="detail-row">
              <span className="detail-label">Linked Accounts</span>
              <span className="detail-value">
                {identities.map((id) => id.provider).join(', ')}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="profile-card-detailed">
        <h3>Connected Services</h3>
        <div className="connected-services">
          <div className="service-item">
            <div className="service-info">
              <strong>Google</strong>
              <span>{provider === 'google' ? 'Connected' : 'Not connected'}</span>
            </div>
            {provider !== 'google' && (
              <button className="btn-outline btn-sm" onClick={signInWithGoogle}>
                Connect
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
