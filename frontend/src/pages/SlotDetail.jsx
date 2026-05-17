import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../api/client';

function getSearchParams() {
  try {
    return JSON.parse(sessionStorage.getItem('quickslot_search') || '{}');
  } catch {
    return {};
  }
}

function formatTime(t) {
  if (!t) return '';
  return t.slice(0, 5);
}

function computeEndTime(start, durationHours) {
  const [h, m] = start.split(':').map(Number);
  const total = h * 60 + m + durationHours * 60;
  const eh = Math.floor(total / 60) % 24;
  const em = total % 60;
  return `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;
}

export default function SlotDetail() {
  const { lotId } = useParams();
  const navigate = useNavigate();
  const search = getSearchParams();

  const [lot, setLot] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  const duration = parseInt(search.duration || '1', 10);
  const endTime = computeEndTime(search.startTime || '10:00', duration);
  const total = lot ? Number(lot.hourly_rate) * duration : 0;

  useEffect(() => {
    if (!search.date) {
      navigate('/search', { replace: true });
      return;
    }

    Promise.all([api.getLot(lotId), api.getVehicles()])
      .then(([{ lot: lotData }, { vehicles: vehicleList }]) => {
        setLot(lotData);
        setVehicles(vehicleList || []);
        if (vehicleList?.length === 1) {
          setSelectedVehicleId(vehicleList[0].id);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [lotId, navigate, search.date]);

  const handleConfirm = async () => {
    if (!selectedVehicleId) {
      setError('Please select which vehicle you are bringing.');
      return;
    }

    setError('');
    setBooking(true);
    try {
      const { booking: created } = await api.createBooking({
        lot_id: lotId,
        vehicle_id: selectedVehicleId,
        booking_date: search.date,
        start_time: search.startTime,
        duration_hours: duration,
      });
      navigate(`/payment/${created.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <p className="page-subtitle">Loading…</p>
      </Layout>
    );
  }

  if (!lot) {
    return (
      <Layout>
        <p className="error-banner">{error || 'Lot not found'}</p>
        <button type="button" className="btn btn-ghost" onClick={() => navigate('/search')}>
          Back to search
        </button>
      </Layout>
    );
  }

  return (
    <Layout>
      <button type="button" className="back-link" onClick={() => navigate('/search/results')}>
        ← Back to results
      </button>

      <header className="page-header">
        <h1 className="page-title">{lot.name}</h1>
        <p className="page-subtitle">{lot.location_name}</p>
      </header>

      <section className="card card-glow">
        <p style={{ margin: '0 0 1rem', lineHeight: 1.6, color: 'var(--color-muted)' }}>
          {lot.description || 'Secure parking with pre-booking and digital QR check-in.'}
        </p>
        <p className="list-item-meta" style={{ marginBottom: '1.25rem' }}>
          <span>
            <strong>{Number(lot.distance_km).toFixed(1)} km</strong>
          </span>
          <span>
            ₹<strong>{Number(lot.hourly_rate).toFixed(0)}</strong>/hr
          </span>
        </p>

        <h3 style={{ fontSize: '0.9rem', margin: '0 0 0.75rem' }}>Your booking</h3>
        <dl className="price-summary">
          <p className="price-row">
            <span>Date</span>
            <span>{search.date}</span>
          </p>
          <p className="price-row">
            <span>Check-in</span>
            <span>{formatTime(search.startTime)}</span>
          </p>
          <p className="price-row">
            <span>Check-out</span>
            <span>{endTime}</span>
          </p>
          <p className="price-row">
            <span>Duration</span>
            <span>
              {duration} hr{duration > 1 ? 's' : ''}
            </span>
          </p>
          <p className="price-row total">
            <span>Total</span>
            <span>₹{total.toFixed(2)}</span>
          </p>
        </dl>

        <h3 style={{ fontSize: '0.9rem', margin: '1.25rem 0 0.75rem' }}>
          Which vehicle are you bringing?
        </h3>

        {vehicles.length === 0 ? (
          <div className="empty-state" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
            <p style={{ margin: '0 0 1rem' }}>No vehicles saved yet.</p>
            <button type="button" className="btn btn-ghost" onClick={() => navigate('/vehicle')}>
              Add a vehicle first
            </button>
          </div>
        ) : (
          <div className="vehicle-pick-list">
            {vehicles.map((v) => (
              <label
                key={v.id}
                className={`vehicle-pick ${selectedVehicleId === v.id ? 'vehicle-pick--selected' : ''}`}
              >
                <input
                  type="radio"
                  name="vehicle"
                  value={v.id}
                  checked={selectedVehicleId === v.id}
                  onChange={() => setSelectedVehicleId(v.id)}
                />
                <span className="vehicle-pick-body">
                  <strong>{v.vehicle_number}</strong>
                  <span>
                    {v.vehicle_type} · {v.color}
                  </span>
                </span>
              </label>
            ))}
          </div>
        )}

        {error && <p className="error-banner" style={{ marginTop: '1rem' }}>{error}</p>}

        <button
          type="button"
          className="btn btn-primary"
          style={{ marginTop: '1.25rem' }}
          disabled={booking || vehicles.length === 0 || !selectedVehicleId}
          onClick={handleConfirm}
        >
          {booking ? 'Confirming…' : 'Confirm booking & pay'}
        </button>
      </section>
    </Layout>
  );
}