import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../api/client';

const VEHICLE_TYPES = ['Car', 'SUV', 'Bike', 'Hatchback', 'Sedan', 'Truck', 'Other'];

export default function AddVehicle() {
  const navigate = useNavigate();
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('Car');
  const [color, setColor] = useState('');
  const [vehicles, setVehicles] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);

  useEffect(() => {
    api
      .getVehicles()
      .then(({ vehicles: list }) => setVehicles(list))
      .catch(() => {})
      .finally(() => setListLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const { vehicle } = await api.addVehicle({
        vehicle_number: vehicleNumber,
        vehicle_type: vehicleType,
        color,
      });
      setVehicles((prev) => [vehicle, ...prev]);
      setVehicleNumber('');
      setColor('');
      setVehicleType('Car');
      setSuccess('Vehicle added successfully!');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <button type="button" className="back-link" onClick={() => navigate('/dashboard')}>
        ← Back to dashboard
      </button>

      <header className="page-header">
        <h1 className="page-title">My vehicles</h1>
        <p className="page-subtitle">Add your vehicle number, type, and colour.</p>
      </header>

      <div className="page-grid page-grid--sidebar">
        <article className="card card-glow">
          <h3 style={{ margin: '0 0 1rem', fontSize: '1rem' }}>Add new vehicle</h3>

          {error && <p className="error-banner">{error}</p>}
          {success && <p className="success-banner">{success}</p>}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="vehicleNumber">Vehicle number</label>
              <input
                id="vehicleNumber"
                type="text"
                placeholder="e.g. KL 07 AB 1234"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="vehicleType">Vehicle type</label>
              <select
                id="vehicleType"
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
              >
                {VEHICLE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="color">Colour</label>
              <input
                id="color"
                type="text"
                placeholder="e.g. White, Black, Red"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving…' : 'Add vehicle'}
            </button>
          </form>
        </article>

        <aside className="card">
          <h3 style={{ margin: '0 0 1rem', fontSize: '1rem' }}>Saved vehicles</h3>
          {listLoading && <p className="page-subtitle">Loading…</p>}
          {!listLoading && vehicles.length === 0 && (
            <p className="page-subtitle">No vehicles yet. Add one using the form.</p>
          )}
          {vehicles.map((v) => (
            <div key={v.id} className="vehicle-chip">
              <div>
                <strong>{v.vehicle_number}</strong>
                <br />
                <span>
                  {v.vehicle_type} · {v.color}
                </span>
              </div>
            </div>
          ))}
        </aside>
      </div>
    </Layout>
  );
}
