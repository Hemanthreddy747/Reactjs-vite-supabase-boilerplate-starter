import { Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    // Keeps useful diagnostics in dev tools for debugging.
    console.error('Unhandled application error:', error, info)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="error-shell">
          <section className="error-card">
            <h1>Something went wrong</h1>
            <p>The application hit an unexpected error.</p>
            <button type="button" onClick={this.handleReload}>
              Reload Page
            </button>
          </section>
        </main>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
