import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <Layout>
      <header className="page-header">
        <p className="page-subtitle" style={{ marginBottom: '0.35rem' }}>
          Hello, {user?.name?.split(' ')[0] || 'Driver'} 👋
        </p>
        <h1 className="page-title">Find parking</h1>
        <p className="page-subtitle">Pre-book a slot before you arrive.</p>
      </header>

      <section
        className="banner-hero"
        role="button"
        tabIndex={0}
        onClick={() => navigate('/search')}
        onKeyDown={(e) => e.key === 'Enter' && navigate('/search')}
      >
        <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>
          Featured
        </span>
        <h2>Park smarter with QuickSlot</h2>
        <p>
          Search nearby lots, compare rates and distance, and reserve your slot in seconds.
        </p>
        <span className="banner-cta">Search parking →</span>
      </section>

      <section className="card">
        <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 600 }}>Quick actions</h3>
        <div className="action-grid">
          <button type="button" className="action-tile" onClick={() => navigate('/search')}>
            <span className="action-tile-icon">🔍</span>
            <h4>Search parking</h4>
            <p>Find available lots near you</p>
          </button>
          <button type="button" className="action-tile" onClick={() => navigate('/vehicle')}>
            <span className="action-tile-icon action-tile-icon--accent">🚗</span>
            <h4>Add vehicle</h4>
            <p>Register your car details</p>
          </button>
          <button type="button" className="action-tile" onClick={() => navigate('/tickets')}>
            <span className="action-tile-icon">🎫</span>
            <h4>My tickets</h4>
            <p>View QR passes & history</p>
          </button>
        </div>
      </section>
    </Layout>
  );
}
