import { useState } from 'react';
import { parkingService } from '../services/api';
import { LogIn, Car, CheckCircle } from 'lucide-react';

export default function EntryPage() {
  const [formData, setFormData] = useState({
    vehicleNo: '',
    vehicleType: 'Car',
    ownerName: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await parkingService.createEntry({
        vehicle_no: formData.vehicleNo.toUpperCase(),
        vehicle_type: formData.vehicleType,
        owner_name: formData.ownerName,
        phone_no: formData.phone,
      });
      setSuccess({
        message: 'Vehicle parked successfully!',
        slot: response.data.slot || response.data.slot_id,
      });
      setFormData({ vehicleNo: '', vehicleType: 'Car', ownerName: '', phone: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create new entry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  return (
    <div className="flex-col gap-6 max-w-2xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <LogIn size={28} className="text-primary" />
          New Parking Entry
        </h1>
        <p className="text-muted mt-2">Register a new vehicle into the parking lot.</p>
      </div>

      <div className="card p-6 md:p-8">
        {success && (
          <div className="mb-6 p-4 rounded-md border text-success bg-success-light border-success/30 flex items-center gap-3 animate-fade-in">
            <CheckCircle size={24} />
            <div>
              <p className="font-bold">{success.message}</p>
              <p>Assigned Slot: <strong className="text-lg">{success.slot}</strong></p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-md border text-danger bg-danger-light border-danger/30">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="input-group">
              <label htmlFor="vehicleNo" className="input-label">Vehicle Number *</label>
              <input
                id="vehicleNo"
                name="vehicleNo"
                type="text"
                placeholder="e.g. MH01AB1234"
                required
                className="input-field uppercase"
                value={formData.vehicleNo}
                onChange={handleChange}
              />
            </div>
            
            <div className="input-group">
              <label htmlFor="vehicleType" className="input-label">Vehicle Type *</label>
              <select
                id="vehicleType"
                name="vehicleType"
                className="input-field"
                value={formData.vehicleType}
                onChange={handleChange}
              >
                <option value="Bike">Bike</option>
                <option value="Car">Car</option>
                <option value="Truck">Truck</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="input-group">
              <label htmlFor="ownerName" className="input-label">Owner Name (Optional)</label>
              <input
                id="ownerName"
                name="ownerName"
                type="text"
                placeholder="e.g. John Doe"
                className="input-field"
                value={formData.ownerName}
                onChange={handleChange}
              />
            </div>

            <div className="input-group">
              <label htmlFor="phone" className="input-label">Phone Number (Optional)</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="e.g. 9876543210"
                className="input-field"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary mt-4 w-full md:w-auto md:self-end" 
            disabled={loading}
          >
            {loading ? 'Processing...' : (
              <>
                <Car size={18} /> Park Vehicle
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
