import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../api/client';

export default function Payment() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    setError('');
    setLoading(true);
    try {
      await api.payBooking(bookingId);
      navigate('/tickets');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <header className="page-header">
        <h1 className="page-title">Payment</h1>
        <p className="page-subtitle">Simulated secure checkout — no real charge.</p>
      </header>

      <section className="card card-glow">
        <p style={{ margin: '0 0 1rem', color: 'var(--color-muted)', lineHeight: 1.6 }}>
          Your slot is reserved. Complete payment to generate your digital ticket with QR
          code.
        </p>

        <p className="price-summary" style={{ textAlign: 'center', fontWeight: 600 }}>
          Demo mode: tap Pay to confirm
        </p>

        {error && <p className="error-banner">{error}</p>}

        <button type="button" className="btn btn-primary" disabled={loading} onClick={handlePay}>
          {loading ? 'Processing…' : 'Pay now'}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          style={{ marginTop: '0.75rem' }}
          onClick={() => navigate('/dashboard')}
        >
          Cancel
        </button>
      </section>
    </Layout>
  );
}
