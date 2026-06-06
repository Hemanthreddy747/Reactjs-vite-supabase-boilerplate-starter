import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthProvider'

export default function Navbar() {
  const { user, signOut } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  const handleLinkClick = () => setIsOpen(false)

  const handleLogout = async () => {
    setIsOpen(false)
    await signOut()
  }

  const links = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/dashboard/todos', label: 'Todos' },
    { to: '/dashboard/analytics', label: 'Analytics' },
    { to: '/dashboard/settings', label: 'Settings' },
    { to: '/dashboard/help', label: 'Help' },
  ]

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <NavLink to="/dashboard" className="navbar-brand" onClick={handleLinkClick}>
          SupaApp
        </NavLink>

        <button
          type="button"
          className={`navbar-toggle${isOpen ? ' open' : ''}`}
          aria-expanded={isOpen}
          aria-label="Toggle navigation"
          onClick={() => setIsOpen((prev) => !prev)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav className={`navbar-nav${isOpen ? ' open' : ''}`}>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/dashboard'}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              onClick={handleLinkClick}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className={`navbar-actions${isOpen ? ' open' : ''}`}>
          <NavLink
            to="/dashboard/profile"
            className="nav-profile"
            onClick={handleLinkClick}
          >
            <span className="nav-avatar">
              {(user?.user_metadata?.full_name || user?.email || '?').charAt(0).toUpperCase()}
            </span>
            <span className="nav-email">{user?.email}</span>
          </NavLink>
          <button type="button" className="btn-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}
