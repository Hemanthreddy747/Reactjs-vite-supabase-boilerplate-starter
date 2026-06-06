export default function HelpPage() {
  return (
    <div className="page-dummy">
      <div className="page-header">
        <h1>Help</h1>
        <p className="page-subtitle">Documentation and support</p>
      </div>

      <div className="dash-card">
        <h2>Getting Started</h2>
        <p className="text-muted">
          This is a Supabase Auth starter template built with React and Vite.
          Use the navigation to explore different sections of the app.
        </p>
      </div>

      <div className="dash-card">
        <h2>FAQ</h2>
        <div className="faq-list">
          <div className="faq-item">
            <strong>How do I reset my password?</strong>
            <p className="text-muted">Click "Forgot Password" on the login page and follow the email instructions.</p>
          </div>
          <div className="faq-item">
            <strong>How do I add more features?</strong>
            <p className="text-muted">Extend the app by adding new routes in App.jsx and components in the features/ directory.</p>
          </div>
          <div className="faq-item">
            <strong>How is data secured?</strong>
            <p className="text-muted">Row Level Security (RLS) policies ensure users can only access their own data.</p>
          </div>
        </div>
      </div>

      <div className="dash-card">
        <h2>Support</h2>
        <p className="text-muted">
          For issues and questions, refer to the{' '}
          <a href="https://supabase.com/docs" target="_blank" rel="noopener noreferrer">Supabase Documentation</a>.
        </p>
      </div>
    </div>
  )
}
