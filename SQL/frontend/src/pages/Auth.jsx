import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export default function Auth() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { user: userData } = await api.login({
        name,
        mobile_number: mobile,
      });
      login(userData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <section className="auth-card-wrap">
        <header className="auth-brand">
          <span className="logo">
            Quick<span>Slot</span>
          </span>
          <p className="page-subtitle">Smart parking, pre-booked.</p>
        </header>

        <article className="card card-glow">
          <h1 className="page-title">Welcome</h1>
          <p className="page-subtitle" style={{ marginBottom: '1.25rem' }}>
            Sign in with your name and mobile number.
          </p>

          {error && <p className="error-banner">{error}</p>}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="name">Full name</label>
              <input
                id="name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="mobile">Mobile number</label>
              <input
                id="mobile"
                type="tel"
                placeholder="10-digit mobile"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                required
                pattern="[0-9]{10,15}"
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Please wait…' : 'Continue'}
            </button>
          </form>
        </article>
      </section>
    </div>
  );
}
