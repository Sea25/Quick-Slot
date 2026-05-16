import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../api/client';

export default function Search() {
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState(today);
  const [startTime, setStartTime] = useState('10:00');
  const [duration, setDuration] = useState('2');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await api.searchParking({ date, startTime, duration });
      const searchMeta = { date, startTime, duration };
      sessionStorage.setItem('quickslot_search', JSON.stringify(searchMeta));
      sessionStorage.setItem('quickslot_search_results', JSON.stringify(result.lots));
      navigate('/search/results', { state: { lots: result.lots, meta: searchMeta } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <button type="button" className="back-link" onClick={() => navigate('/dashboard')}>
        ← Back
      </button>

      <header className="page-header">
        <h1 className="page-title">Search parking</h1>
        <p className="page-subtitle">Pick your date, time, and duration.</p>
      </header>

      <div className="page-grid page-grid--2">
        <article className="card card-glow">
          <form onSubmit={handleSearch}>
            <div className="field">
              <label htmlFor="date">Date</label>
              <input
                id="date"
                type="date"
                value={date}
                min={today}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="startTime">Start time</label>
              <input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="duration">Duration (hours)</label>
              <select id="duration" value={duration} onChange={(e) => setDuration(e.target.value)}>
                {[1, 2, 3, 4, 5, 6, 8, 12].map((h) => (
                  <option key={h} value={h}>
                    {h} hour{h > 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>
            {error && <p className="error-banner">{error}</p>}
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Searching…' : 'Search available slots'}
            </button>
          </form>
        </article>

        <aside className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <p style={{ margin: 0, color: 'var(--color-muted)', lineHeight: 1.6, fontSize: '0.95rem' }}>
            We’ll show all parking lots with free slots for your chosen window on the next screen.
          </p>
        </aside>
      </div>
    </Layout>
  );
}
