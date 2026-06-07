import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider, useAuth } from './context/AuthProvider'
import AppLayout from './components/layout/AppLayout'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import DashboardPage from './features/dashboard/DashboardPage'
import TodoPage from './features/todos/TodoPage'
import LocationPage from './features/location/LocationPage'
import ProfilePage from './features/profile/ProfilePage'
import FeaturesPage from './features/dummy/FeaturesPage'
import SettingsPage from './features/dummy/SettingsPage'
import { isSupabaseConfigured } from './lib/supabaseClient'
import './App.css'

function PublicRoute({ children }) {
  const { user, loading, isRecoveryMode } = useAuth()
  if (loading) return <div className="app-shell"><p>Loading...</p></div>
  if (user) {
    if (isRecoveryMode) return <Navigate to="/forgot-password" replace />
    return <Navigate to="/dashboard" replace />
  }
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/todo" element={<TodoPage />} />
        <Route path="/location" element={<LocationPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      <Route path="/" element={<LandingPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
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

  return (
    <AuthProvider>
      <AppRoutes />
      <Toaster position="top-center" richColors closeButton />
    </AuthProvider>
  )
}

export default App
