import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children, variant = 'default', showNav = true }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const mainClass =
    variant === 'narrow' ? 'app-main app-main--narrow' : 'app-main app-main--wide';

  return (
    <div className="app-page">
      {showNav && user && (
        <header className="app-nav">
          <Link to="/dashboard" className="logo">
            Quick<span>Slot</span>
          </Link>
          <nav className="nav-links">
            <Link
              to="/dashboard"
              className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
            >
              Home
            </Link>
            <Link
              to="/tickets"
              className={`nav-link ${location.pathname === '/tickets' ? 'active' : ''}`}
            >
              Tickets
            </Link>
            <button type="button" className="nav-link" onClick={logout}>
              Logout
            </button>
          </nav>
        </header>
      )}
      <main className={mainClass}>{children}</main>
    </div>
  );
}
