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

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const { user, isRecoveryMode, resetPassword, updatePassword } = useAuth()

  const [emailSent, setEmailSent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const isUpdateMode = user && isRecoveryMode

  const [email, setEmail] = useState('')
  const [fieldError, setFieldError] = useState('')

  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmNew, setShowConfirmNew] = useState(false)
  const [passwordErrors, setPasswordErrors] = useState({})

  const strength = getStrength(newPassword)

  const isValidEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)

  const handleSendReset = async (e) => {
    e.preventDefault()
    setFieldError('')
    if (!email.trim()) { setFieldError('Email is required'); return }
    if (!isValidEmail(email)) { setFieldError('Enter a valid email address'); return }

    setIsLoading(true)
    const { error } = await resetPassword(email)
    setIsLoading(false)

    if (error) {
      if (error.message.includes('rate limit')) {
        toast.error('Too many requests. Please try again later')
      } else {
        toast.error(error.message)
      }
    } else {
      setEmailSent(true)
      toast.success('Password reset email sent')
    }
  }

  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    const errors = {}
    if (!newPassword) errors.newPassword = 'Password is required'
    else if (newPassword.length < 6) errors.newPassword = 'Password must be at least 6 characters'
    if (!confirmNewPassword) errors.confirmNewPassword = 'Please confirm your password'
    else if (newPassword !== confirmNewPassword) errors.confirmNewPassword = 'Passwords do not match'
    setPasswordErrors(errors)
    if (Object.keys(errors).length) return

    setIsLoading(true)
    const { error } = await updatePassword(newPassword)
    setIsLoading(false)

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Password updated successfully')
      navigate('/', { replace: true })
    }
  }

  if (emailSent) {
    return (
      <main className="app-shell">
        <section className="auth-card">
          <div className="success-card">
            <h2>Check your email</h2>
            <p>If an account exists with that email, we&apos;ve sent a password reset link.</p>
            <p className="auth-switch" style={{ marginTop: '1rem' }}>
              <Link to="/login" className="auth-link">Back to login</Link>
            </p>
          </div>
        </section>
      </main>
    )
  }

  if (isUpdateMode) {
    return (
      <main className="app-shell">
        <section className="auth-card">
          <h1>Set New Password</h1>
          <p className="page-description">Enter your new password below.</p>

          <form onSubmit={handleUpdatePassword} className="auth-form" noValidate>
            <label htmlFor="newPassword">New Password</label>
            <div className="input-wrapper">
              <input
                id="newPassword" type={showNewPassword ? 'text' : 'password'} value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setPasswordErrors((p) => ({ ...p, newPassword: '' })) }}
                placeholder="Enter new password" autoComplete="new-password"
              />
              <button type="button" className="visibility-toggle" onClick={() => setShowNewPassword((p) => !p)} aria-label={showNewPassword ? 'Hide password' : 'Show password'}>
                <EyeIcon open={showNewPassword} />
              </button>
            </div>
            {passwordErrors.newPassword && <p className="field-error">{passwordErrors.newPassword}</p>}

            {newPassword && (
              <div className="password-strength">
                <div className="strength-bar" style={{ width: strength.width, backgroundColor: strength.color }} />
                <span className="strength-label" style={{ color: strength.color }}>{strength.label}</span>
              </div>
            )}

            <label htmlFor="confirmNewPassword">Confirm New Password</label>
            <div className="input-wrapper">
              <input
                id="confirmNewPassword" type={showConfirmNew ? 'text' : 'password'} value={confirmNewPassword}
                onChange={(e) => { setConfirmNewPassword(e.target.value); setPasswordErrors((p) => ({ ...p, confirmNewPassword: '' })) }}
                placeholder="Re-enter new password" autoComplete="new-password"
              />
              <button type="button" className="visibility-toggle" onClick={() => setShowConfirmNew((p) => !p)} aria-label={showConfirmNew ? 'Hide password' : 'Show password'}>
                <EyeIcon open={showConfirmNew} />
              </button>
            </div>
            {passwordErrors.confirmNewPassword && <p className="field-error">{passwordErrors.confirmNewPassword}</p>}

            <button type="submit" disabled={isLoading} className="btn-primary">
              {isLoading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </section>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <section className="auth-card">
        <h1>Forgot Password</h1>
        <p className="page-description">Enter your email and we&apos;ll send you a reset link.</p>

        <form onSubmit={handleSendReset} className="auth-form" noValidate>
          <label htmlFor="resetEmail">Email</label>
          <input
            id="resetEmail" type="email" value={email}
            onChange={(e) => { setEmail(e.target.value); setFieldError('') }}
            placeholder="you@example.com" autoComplete="email"
          />
          {fieldError && <p className="field-error">{fieldError}</p>}

          <button type="submit" disabled={isLoading} className="btn-primary">
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <p className="auth-switch">
          Remember your password? <Link to="/login" className="auth-link">Login</Link>
        </p>
      </section>
    </main>
  )
}
