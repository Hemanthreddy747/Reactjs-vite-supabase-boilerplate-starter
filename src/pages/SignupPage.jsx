import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthProvider'
import { toast } from 'sonner'

function EyeIcon({ open }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {open ? (
        <>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </>
      ) : (
        <>
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </>
      )}
    </svg>
  )
}

function getStrength(password) {
  if (!password) return { score: 0, label: '', color: '', width: '0%' }
  let score = 0
  if (password.length >= 6) score += 1
  if (password.length >= 10) score += 1
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1
  if (/\d/.test(password)) score += 1
  if (/[^a-zA-Z0-9]/.test(password)) score += 1
  if (score <= 1) return { score: 1, label: 'Weak', color: '#dc2626', width: '25%' }
  if (score === 2) return { score: 2, label: 'Fair', color: '#f59e0b', width: '50%' }
  if (score === 3) return { score: 3, label: 'Good', color: '#10b981', width: '75%' }
  return { score: 4, label: 'Strong', color: '#059669', width: '100%' }
}

export default function SignupPage() {
  const navigate = useNavigate()
  const { signUp, sendOtp, verifyOtp, signInWithGoogle } = useAuth()

  const [authTab, setAuthTab] = useState('email')
  const [isLoading, setIsLoading] = useState(false)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})

  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)

  const strength = getStrength(password)

  const isValidEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)

  const validateEmail = () => {
    const errors = {}
    if (!email.trim()) errors.email = 'Email is required'
    else if (!isValidEmail(email)) errors.email = 'Enter a valid email address'
    if (!password) errors.password = 'Password is required'
    else if (password.length < 6) errors.password = 'Password must be at least 6 characters'
    if (!confirmPassword) errors.confirmPassword = 'Please confirm your password'
    else if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    if (!validateEmail()) return

    setIsLoading(true)
    const { error } = await signUp(email, password)
    setIsLoading(false)

    if (error) {
      if (error.message.includes('already registered')) {
        toast.error('An account with this email already exists')
      } else if (error.message.includes('rate limit')) {
        toast.error('Too many attempts. Please try again later')
      } else {
        toast.error(error.message)
      }
    } else {
      toast.success('Account created! Check your email for confirmation.')
      navigate('/login', { replace: true })
    }
  }

  const handleSendOtp = async (e) => {
    e.preventDefault()
    const phoneRegex = /^\+[1-9]\d{6,14}$/
    const errors = {}
    if (!phone.trim()) errors.phone = 'Phone number is required'
    else if (!phoneRegex.test(phone)) errors.phone = 'Include country code (e.g. +1234567890)'
    setFieldErrors(errors)
    if (Object.keys(errors).length) return

    setIsLoading(true)
    const { error } = await sendOtp(phone)
    setIsLoading(false)

    if (error) {
      if (error.message.includes('rate limit')) {
        toast.error('Too many requests. Please wait before trying again')
      } else {
        toast.error(error.message)
      }
    } else {
      setOtpSent(true)
      toast.success('OTP sent to your phone')
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    const errors = {}
    if (!otp.trim()) errors.otp = 'OTP is required'
    else if (!/^\d{6}$/.test(otp)) errors.otp = 'OTP must be 6 digits'
    setFieldErrors(errors)
    if (Object.keys(errors).length) return

    setIsLoading(true)
    const { error } = await verifyOtp(phone, otp)
    setIsLoading(false)

    if (error) {
      if (error.message.toLowerCase().includes('expired')) {
        toast.error('OTP has expired. Request a new one')
        setOtpSent(false)
        setOtp('')
      } else if (error.message.toLowerCase().includes('invalid')) {
        toast.error('Invalid OTP. Please try again')
      } else {
        toast.error(error.message)
      }
    } else {
      toast.success('Account created and logged in successfully')
      navigate('/', { replace: true })
    }
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    const error = await signInWithGoogle()
    setIsLoading(false)
    if (error) toast.error(error.message)
  }

  const clearError = (field) => setFieldErrors((p) => { const n = { ...p }; delete n[field]; return n })

  const switchTab = (tab) => {
    setAuthTab(tab)
    setFieldErrors({})
    if (tab === 'email') {
      setOtpSent(false)
      setOtp('')
    }
  }

  return (
    <main className="app-shell">
      <section className="auth-card">
        <h1>Create Account</h1>

        <div className="auth-tabs">
          <button type="button" className={`tab-btn${authTab === 'email' ? ' active' : ''}`} onClick={() => switchTab('email')}>
            Email
          </button>
          <button type="button" className={`tab-btn${authTab === 'phone' ? ' active' : ''}`} onClick={() => switchTab('phone')}>
            Phone
          </button>
        </div>

        {authTab === 'email' && (
          <form onSubmit={handleSignUp} className="auth-form" noValidate>
            <label htmlFor="email">Email</label>
            <input
              id="email" type="email" value={email}
              onChange={(e) => { setEmail(e.target.value); clearError('email') }}
              placeholder="you@example.com" autoComplete="email"
            />
            {fieldErrors.email && <p className="field-error">{fieldErrors.email}</p>}

            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <input
                id="password" type={showPassword ? 'text' : 'password'} value={password}
                onChange={(e) => { setPassword(e.target.value); clearError('password') }}
                placeholder="Create a password" autoComplete="new-password"
              />
              <button type="button" className="visibility-toggle" onClick={() => setShowPassword((p) => !p)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                <EyeIcon open={showPassword} />
              </button>
            </div>
            {fieldErrors.password && <p className="field-error">{fieldErrors.password}</p>}

            {password && (
              <div className="password-strength">
                <div className="strength-bar" style={{ width: strength.width, backgroundColor: strength.color }} />
                <span className="strength-label" style={{ color: strength.color }}>{strength.label}</span>
              </div>
            )}

            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="input-wrapper">
              <input
                id="confirmPassword" type={showConfirm ? 'text' : 'password'} value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); clearError('confirmPassword') }}
                placeholder="Re-enter password" autoComplete="new-password"
              />
              <button type="button" className="visibility-toggle" onClick={() => setShowConfirm((p) => !p)} aria-label={showConfirm ? 'Hide password' : 'Show password'}>
                <EyeIcon open={showConfirm} />
              </button>
            </div>
            {fieldErrors.confirmPassword && <p className="field-error">{fieldErrors.confirmPassword}</p>}

            {password && confirmPassword && password !== confirmPassword && (
              <p className="field-error">Passwords do not match</p>
            )}

            <button type="submit" disabled={isLoading} className="btn-primary">
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        )}

        {authTab === 'phone' && !otpSent && (
          <form onSubmit={handleSendOtp} className="auth-form" noValidate>
            <label htmlFor="phone">Phone Number</label>
            <input
              id="phone" type="tel" value={phone}
              onChange={(e) => { setPhone(e.target.value); clearError('phone') }}
              placeholder="+1234567890" autoComplete="tel"
            />
            {fieldErrors.phone && <p className="field-error">{fieldErrors.phone}</p>}
            <p className="input-hint">Include country code (e.g. +1 for US)</p>

            <button type="submit" disabled={isLoading} className="btn-primary">
              {isLoading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        )}

        {authTab === 'phone' && otpSent && (
          <form onSubmit={handleVerifyOtp} className="auth-form" noValidate>
            <label htmlFor="otp">Enter OTP</label>
            <input
              id="otp" type="text" inputMode="numeric" value={otp}
              onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); clearError('otp') }}
              placeholder="123456" autoComplete="one-time-code"
            />
            {fieldErrors.otp && <p className="field-error">{fieldErrors.otp}</p>}
            <p className="input-hint">Enter the 6-digit code sent to your phone</p>

            <button type="submit" disabled={isLoading} className="btn-primary">
              {isLoading ? 'Verifying...' : 'Verify OTP'}
            </button>

            <button type="button" className="btn-ghost" onClick={() => { setOtpSent(false); setOtp(''); setFieldErrors({}) }}>
              Change phone number
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

        <p className="auth-switch">
          Already have an account? <Link to="/login" className="auth-link">Login</Link>
        </p>
      </section>
    </main>
  )
}
