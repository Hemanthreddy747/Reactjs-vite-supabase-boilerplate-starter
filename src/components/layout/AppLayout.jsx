import { Outlet, Navigate } from 'react-router-dom'
import Navbar from './Navbar'
import { useAuth } from '../../context/AuthProvider'
import { isSupabaseConfigured } from '../../lib/supabaseClient'

export default function AppLayout() {
  const { user, loading, isRecoveryMode } = useAuth()

  if (!isSupabaseConfigured) {
    return (
      <main className="app-shell">
        <section className="auth-card">
          <h1>Supabase Auth App</h1>
          <p>Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to a <code>.env</code> file.</p>
        </section>
      </main>
    )
  }

  if (loading) {
    return (
      <div className="app-shell">
        <p>Loading...</p>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (isRecoveryMode) return <Navigate to="/forgot-password" replace />

  return (
    <div className="app-layout">
      <Navbar />
      <main className="app-content">
        <Outlet />
      </main>
    </div>
  )
}
