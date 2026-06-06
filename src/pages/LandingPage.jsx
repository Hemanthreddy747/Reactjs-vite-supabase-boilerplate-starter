import { useNavigate } from 'react-router-dom'

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <main className="landing-shell">
      <div className="landing-content">
        <div className="landing-badge">Supabase + React</div>
        <h1 className="landing-title">
          Build faster.<br />
          <span className="landing-highlight">Ship smarter.</span>
        </h1>
        <p className="landing-subtitle">
          A production-ready boilerplate with authentication, database, and
          real-time features — powered by Supabase and React.
        </p>
        <div className="landing-actions">
          <button className="landing-btn-primary" onClick={() => navigate('/login')}>
            Get started
          </button>
          <button className="landing-btn-secondary" onClick={() => navigate('/signup')}>
            Create account
          </button>
        </div>
      </div>
    </main>
  )
}
