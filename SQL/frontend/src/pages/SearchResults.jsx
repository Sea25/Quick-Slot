import { useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';

function loadResults(location) {
  if (location.state?.lots) {
    return { lots: location.state.lots, meta: location.state.meta };
  }
  try {
    const lots = JSON.parse(sessionStorage.getItem('quickslot_search_results') || '[]');
    const meta = JSON.parse(sessionStorage.getItem('quickslot_search') || '{}');
    return { lots, meta };
  } catch {
    return { lots: [], meta: {} };
  }
}

export default function SearchResults() {
  const navigate = useNavigate();
  const location = useLocation();
  const { lots, meta } = useMemo(() => loadResults(location), [location]);

  useEffect(() => {
    if (!lots?.length && !meta?.date) {
      navigate('/search', { replace: true });
    }
  }, [lots, meta, navigate]);

  const openLot = (lotId) => {
    navigate(`/lot/${lotId}`);
  };

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d + 'T12:00:00').toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <Layout>
      <button type="button" className="back-link" onClick={() => navigate('/search')}>
        ← Modify search
      </button>

      <header className="page-header">
        <h1 className="page-title">Available parking</h1>
        <p className="page-subtitle">
          {lots.length
            ? `${lots.length} lot${lots.length > 1 ? 's' : ''} with free slots`
            : 'No lots available for this time'}
        </p>
      </header>

      {meta?.date && (
        <div className="search-summary-bar">
          <span className="meta-pill">📅 {formatDate(meta.date)}</span>
          <span className="meta-pill">🕐 {meta.startTime}</span>
          <span className="meta-pill">
            ⏱ {meta.duration} hr{Number(meta.duration) > 1 ? 's' : ''}
          </span>
        </div>
      )}

      {lots.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🅿️</div>
          <p>No parking lots available. Try a different time or date.</p>
          <button
            type="button"
            className="btn btn-primary"
            style={{ marginTop: '1.25rem', maxWidth: 280 }}
            onClick={() => navigate('/search')}
          >
            Search again
          </button>
        </div>
      ) : (
        <section className="results-grid">
          {lots.map((lot) => (
            <button
              key={lot.id}
              type="button"
              className="list-item"
              onClick={() => openLot(lot.id)}
            >
              <h3>{lot.name}</h3>
              <p className="list-item-location">{lot.location_name}</p>
              <div className="list-item-meta">
                <span className="meta-pill">
                  📍 <strong>{Number(lot.distance_km).toFixed(1)}</strong> km
                </span>
                <span className="meta-pill">
                  ₹<strong>{Number(lot.hourly_rate).toFixed(0)}</strong>/hr
                </span>
                <span className="meta-pill">
                  {lot.available_slots} slot{lot.available_slots !== 1 ? 's' : ''} free
                </span>
              </div>
            </button>
          ))}
        </section>
      )}
    </Layout>
  );
}
