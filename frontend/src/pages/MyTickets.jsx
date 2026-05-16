import { useEffect, useState, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Layout from '../components/Layout';
import { api } from '../api/client';

function formatTime(t) {
  if (!t) return '';
  return t.slice(0, 5);
}

function getEndDateTime(bookingDate, endTime) {
  const time = endTime?.length === 5 ? `${endTime}:00` : endTime;
  return new Date(`${bookingDate}T${time}`);
}

export default function MyTickets() {
  const [tickets, setTickets] = useState([]);
  const [tab, setTab] = useState('upcoming');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const now = new Date();

  const loadTickets = useCallback(() => {
    setLoading(true);
    api
      .getMyTickets()
      .then(({ tickets: data }) => setTickets(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const upcoming = tickets.filter(
    (t) => t.payment_status === 'paid' && getEndDateTime(t.booking_date, t.end_time) > now
  );
  const past = tickets.filter(
    (t) =>
      t.payment_status === 'cancelled' || getEndDateTime(t.booking_date, t.end_time) <= now
  );
  const shown = tab === 'upcoming' ? upcoming : past;

  const handleCancel = async (ticketId) => {
    if (!window.confirm('Cancel this active ticket? The slot will be released for others.')) {
      return;
    }
    setCancellingId(ticketId);
    setError('');
    try {
      await api.cancelBooking(ticketId);
      loadTickets();
    } catch (err) {
      setError(err.message);
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <Layout>
      <header className="page-header">
        <h1 className="page-title">My Tickets</h1>
        <p className="page-subtitle">Digital passes with QR validation.</p>
      </header>

      <nav className="tabs" aria-label="Ticket tabs">
        <button
          type="button"
          className={`tab ${tab === 'upcoming' ? 'active' : ''}`}
          onClick={() => setTab('upcoming')}
        >
          Upcoming ({upcoming.length})
        </button>
        <button
          type="button"
          className={`tab ${tab === 'past' ? 'active' : ''}`}
          onClick={() => setTab('past')}
        >
          Past ({past.length})
        </button>
      </nav>

      {loading && <p className="page-subtitle">Loading tickets…</p>}
      {error && <p className="error-banner">{error}</p>}

      {!loading && !error && shown.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🎫</div>
          <p>No {tab} tickets yet. Book parking from the dashboard.</p>
        </div>
      )}

      {shown.map((ticket) => {
        const isCancelled = ticket.payment_status === 'cancelled';
        const isActive = tab === 'upcoming' && !isCancelled;

        return (
          <article
            key={ticket.id}
            className={`ticket-card ${tab === 'past' || isCancelled ? 'past cancelled' : ''}`}
          >
            <header
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'start',
                gap: '0.75rem',
              }}
            >
              <div>
                <h3 style={{ margin: '0 0 0.25rem' }}>{ticket.lot_name}</h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-muted)' }}>
                  {ticket.location_name} · Slot {ticket.slot_number}
                </p>
              </div>
              <span
                className={`badge ${
                  isCancelled ? 'badge--danger' : tab === 'upcoming' ? '' : 'badge--muted'
                }`}
              >
                {isCancelled ? 'Cancelled' : tab === 'upcoming' ? 'Active' : 'Expired'}
              </span>
            </header>

            {isActive && ticket.qr_code_hash && (
              <figure className="ticket-qr" aria-label="QR code for check-in">
                <QRCodeSVG value={ticket.qr_code_hash} size={168} level="M" />
              </figure>
            )}

            <dl className="ticket-times">
              <div>
                <span>Check-in</span>
                <strong>
                  {ticket.booking_date} {formatTime(ticket.start_time)}
                </strong>
              </div>
              <div>
                <span>Check-out</span>
                <strong>
                  {ticket.booking_date} {formatTime(ticket.end_time)}
                </strong>
              </div>
            </dl>

            <p style={{ margin: '0.75rem 0 0', fontWeight: 700, color: 'var(--color-primary)' }}>
              ₹{Number(ticket.total_amount).toFixed(2)}
            </p>

            {ticket.qr_code_hash && isActive && (
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--color-muted)' }}>
                {ticket.qr_code_hash}
              </p>
            )}

            {isActive && (
              <div className="ticket-actions">
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  disabled={cancellingId === ticket.id}
                  onClick={() => handleCancel(ticket.id)}
                >
                  {cancellingId === ticket.id ? 'Cancelling…' : 'Cancel ticket'}
                </button>
              </div>
            )}
          </article>
        );
      })}
    </Layout>
  );
}
