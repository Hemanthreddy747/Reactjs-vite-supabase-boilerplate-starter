import Navbar from './Navbar'
import TodoPage from './features/TodoPage'

export default function HomePage({ user, onLogout }) {
  return (
    <div className="page-wrapper">
      <Navbar userEmail={user.email} onLogout={onLogout} />

      <main>
        <section className="hero">
          <div className="hero-inner">
            <h1 className="hero-title">Welcome back</h1>
            <p className="hero-subtitle">
              You are signed in. This is a simple starter home page for your app.
              Use it as a base and add your own sections later.
            </p>
          </div>
        </section>

        <section className="features" id="features" aria-label="features">
          <h2 className="features-title">Features</h2>
          <div className="features-grid">
            {[
              { title: 'Authentication', desc: 'Email, phone OTP, and OAuth are already connected.' },
              { title: 'Session Ready', desc: 'You can access the logged-in user from the active session.' },
              { title: 'Easy to Extend', desc: 'Add your own pages, data, and business logic step by step.' },
            ].map((f) => (
              <div className="feature-card" key={f.title}>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>

          <TodoPage userId={user.id} />
        </section>

        <section className="account" id="account">
          <h2>Account</h2>
          <p>Signed in as: {user.email}</p>
        </section>
      </main>
    </div>
  )
}
