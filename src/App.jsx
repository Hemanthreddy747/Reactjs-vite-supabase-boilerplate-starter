import { useEffect, useState } from 'react'
import { isSupabaseConfigured, supabase } from './supabaseClient'
import HomePage from './HomePage'
import './App.css'

function App() {
  const [session, setSession] = useState(null)
  const [authTab, setAuthTab] = useState('email')
  const [isLoginMode, setIsLoginMode] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)

  useEffect(() => {
    if (!isSupabaseConfigured) return

    const fetchSession = async () => {
      const { data, error } = await supabase.auth.getSession()
      if (!error) setSession(data.session)
    }
    fetchSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleEmailAuth = async (event) => {
    event.preventDefault()
    setMessage('')
    setIsLoading(true)

    const action = isLoginMode
      ? supabase.auth.signInWithPassword({ email, password })
      : supabase.auth.signUp({ email, password })

    const { error } = await action

    if (error) {
      setMessage(error.message)
    } else if (isLoginMode) {
      setMessage('Login successful.')
    } else {
      setMessage('Signup successful. Check your email for confirmation.')
    }
    setIsLoading(false)
  }

  const handleSendOtp = async (event) => {
    event.preventDefault()
    setMessage('')
    setIsLoading(true)
    const { error } = await supabase.auth.signInWithOtp({ phone })
    if (error) {
      setMessage(error.message)
    } else {
      setOtpSent(true)
      setMessage('OTP sent to your phone.')
    }
    setIsLoading(false)
  }

  const handleVerifyOtp = async (event) => {
    event.preventDefault()
    setMessage('')
    setIsLoading(true)
    const { error } = await supabase.auth.verifyOtp({ phone, token: otp, type: 'sms' })
    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Phone verified successfully.')
    }
    setIsLoading(false)
  }

  const handleGoogleLogin = async () => {
    setMessage('')
    setIsLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' })
    if (error) {
      setMessage(error.message)
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    setMessage('')
    await supabase.auth.signOut()
  }

  if (!isSupabaseConfigured) {
    return (
      <main className="app-shell">
        <section className="auth-card">
          <h1>Supabase Auth App</h1>
          <p>
            Add <code>VITE_SUPABASE_URL</code> and{' '}
            <code>VITE_SUPABASE_ANON_KEY</code> to a <code>.env</code> file.
          </p>
        </section>
      </main>
    )
  }

  if (session) {
    return <HomePage user={session.user} onLogout={handleLogout} />
  }

  return (
    <main className="app-shell">
      <section className="auth-card">
        <h1>{isLoginMode ? 'Login' : 'Sign Up'}</h1>

        <div className="auth-tabs">
          <button
            type="button"
            className={`tab-btn${authTab === 'email' ? ' active' : ''}`}
            onClick={() => { setAuthTab('email'); setMessage('') }}
          >
            Email
          </button>
          <button
            type="button"
            className={`tab-btn${authTab === 'phone' ? ' active' : ''}`}
            onClick={() => { setAuthTab('phone'); setMessage(''); setOtpSent(false) }}
          >
            Phone
          </button>
        </div>

        {authTab === 'email' && (
          <form onSubmit={handleEmailAuth} className="auth-form">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Please wait...' : isLoginMode ? 'Login' : 'Create Account'}
            </button>
          </form>
        )}

        {authTab === 'phone' && !otpSent && (
          <form onSubmit={handleSendOtp} className="auth-form">
            <label htmlFor="phone">Phone Number</label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1234567890"
              required
            />
            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        )}

        {authTab === 'phone' && otpSent && (
          <form onSubmit={handleVerifyOtp} className="auth-form">
            <label htmlFor="otp">Enter OTP</label>
            <input
              id="otp"
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="123456"
              required
            />
            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <button
              type="button"
              className="mode-toggle"
              onClick={() => { setOtpSent(false); setOtp(''); setMessage('') }}
            >
              Back
            </button>
          </form>
        )}

        <div className="auth-divider"><span>or</span></div>

        <button type="button" className="google-btn" onClick={handleGoogleLogin} disabled={isLoading}>
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
          </svg>
          Continue with Google
        </button>

        {authTab === 'email' && (
          <button
            className="mode-toggle"
            type="button"
            onClick={() => setIsLoginMode((prev) => !prev)}
          >
            {isLoginMode ? 'Need an account? Sign up' : 'Already have an account? Login'}
          </button>
        )}

        {message && <p className="status-message">{message}</p>}
      </section>
    </main>
  )
}

export default App
