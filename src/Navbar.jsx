import { useState } from 'react'

export default function Navbar({ userEmail, onLogout }) {
  const [isOpen, setIsOpen] = useState(false)

  const handleLinkClick = () => setIsOpen(false)

  return (
    <header className="site-header">
      <div className="header-inner">
        <a href="/" className="brand" onClick={handleLinkClick}>SupaApp</a>

        <button
          type="button"
          className="menu-toggle"
          aria-expanded={isOpen}
          aria-controls="main-navigation"
          onClick={() => setIsOpen((prev) => !prev)}
        >
          Menu
        </button>

        <nav id="main-navigation" className={`nav-links${isOpen ? ' open' : ''}`}>
          <a href="#features" onClick={handleLinkClick}>Features</a>
          <a href="#account" onClick={handleLinkClick}>Account</a>
        </nav>

        <div className={`header-actions${isOpen ? ' open' : ''}`}>
          <span className="user-email">{userEmail}</span>
          <button
            className="btn-outline"
            type="button"
            onClick={() => {
              setIsOpen(false)
              onLogout()
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}
