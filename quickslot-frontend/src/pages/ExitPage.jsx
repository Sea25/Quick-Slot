import { useState } from 'react';
import { parkingService } from '../services/api';
import { Search, LogOut, Receipt, CheckCircle, Clock } from 'lucide-react';

export default function ExitPage() {
  const [vehicleNo, setVehicleNo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [exitInfo, setExitInfo] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!vehicleNo) return;
    setLoading(true);
    setError(null);
    setExitInfo(null);
    setSuccess(false);

    try {
      const response = await parkingService.getExitInfo(vehicleNo.toUpperCase());
      setExitInfo(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Vehicle not found or already exited.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompletePayment = async () => {
    if (!exitInfo) return;
    setProcessing(true);
    setError(null);
    try {
      await parkingService.processExit(exitInfo.id || exitInfo.parking_id);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to process exit.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="flex-col gap-6 max-w-2xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <LogOut size={28} className="text-primary" />
          Process Exit
        </h1>
        <p className="text-muted mt-2">Search for a vehicle and process its parking exit.</p>
      </div>

      {/* Search Card */}
      <div className="card p-6 mb-6">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-grow">
            <input
              type="text"
              placeholder="Enter Vehicle Number (e.g. MH01XY1234)"
              className="input-field text-lg uppercase"
              value={vehicleNo}
              onChange={(e) => setVehicleNo(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary whitespace-nowrap" disabled={loading}>
            {loading ? 'Searching...' : <><Search size={18} /> Search</>}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-3 rounded-md text-danger bg-danger-light text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Exit Info Card */}
      {exitInfo && !success && (
        <div className="card p-6 md:p-8 animate-fade-in border border-primary/20">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 border-b pb-4">
            <Receipt size={24} className="text-primary" /> 
            Exit Summary: <span className="text-primary">{exitInfo.vehicle_no}</span>
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8 mb-8">
            <div>
              <p className="text-sm font-semibold text-muted mb-1">Assigned Slot</p>
              <p className="text-lg font-bold">{exitInfo.slot || exitInfo.slot_id}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-muted mb-1 flex items-center gap-1">
                <Clock size={16} /> Duration
              </p>
              <p className="text-lg font-bold">{exitInfo.duration || exitInfo.total_time}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-muted mb-1">Entry Time</p>
              <p className="text-base font-medium">{exitInfo.entry_time}</p>
            </div>
            <div className="sm:text-right sm:col-span-2 border-t pt-6 mt-2">
              <p className="text-sm font-semibold text-muted mb-2 uppercase tracking-wide">Amount Due</p>
              <p className="text-4xl font-bold text-success font-mono">₹{exitInfo.amount || exitInfo.fee || exitInfo.total_fee || '0'}</p>
            </div>
          </div>

          <button 
            type="button" 
            className="btn btn-success w-full py-3 text-lg" 
            onClick={handleCompletePayment}
            disabled={processing}
          >
            {processing ? 'Processing...' : 'Complete Payment & Exit'}
          </button>
        </div>
      )}

      {/* Success State */}
      {success && (
        <div className="card p-8 text-center animate-fade-in border border-success/30 bg-success-light/30">
          <CheckCircle size={64} className="text-success mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-success mb-2">Exit Processed Successfully</h2>
          <p className="text-muted mb-6">The vehicle has exited the parking lot.</p>
          <button 
            className="btn btn-primary"
            onClick={() => {
              setSuccess(false);
              setExitInfo(null);
              setVehicleNo('');
            }}
          >
            Process Another Exit
          </button>
        </div>
      )}
    </div>
  );
}
