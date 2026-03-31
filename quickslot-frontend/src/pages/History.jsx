import { useState } from 'react';
import { historyService } from '../services/api';
import { Search, History as HistoryIcon } from 'lucide-react';

export default function History() {
  const [vehicleNo, setVehicleNo] = useState('');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!vehicleNo) return;
    
    setLoading(true);
    setError('');
    setSearched(true);
    
    try {
      const response = await historyService.getHistory(vehicleNo.toUpperCase());
      setRecords(response.data || []);
    } catch (err) {
      setError('Something went wrong while fetching history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-col gap-6 w-full">
      <div className="mb-6 flex items-center gap-3">
        <HistoryIcon size={28} className="text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Parking History</h1>
          <p className="text-muted">Search past parking records by vehicle number</p>
        </div>
      </div>

      <div className="card p-6 md:p-8">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-grow">
            <input
              type="text"
              placeholder="Enter Vehicle Number (e.g. MH01XY1234)"
              className="input-field uppercase"
              value={vehicleNo}
              onChange={(e) => setVehicleNo(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary whitespace-nowrap" disabled={loading}>
            {loading ? 'Searching...' : <><Search size={18} /> Search History</>}
          </button>
        </form>

        {/* Status Messages */}
        {error && (
          <div className="mb-6 p-4 rounded-md text-danger bg-danger-light border-danger/30 text-center">
            {error}
          </div>
        )}

        {!loading && searched && records.length === 0 && !error && (
          <div className="py-12 text-center text-muted flex flex-col items-center gap-2">
            <Search size={48} className="text-muted mb-2 opacity-50" />
            <p className="text-lg">No records found for <strong className="text-text">{vehicleNo.toUpperCase()}</strong></p>
          </div>
        )}

        {/* Results Table */}
        {!loading && records.length > 0 && (
          <div className="animate-fade-in">
            <p className="text-muted mb-4 font-medium">
              Found <strong className="text-primary">{records.length}</strong> record(s) for <strong className="text-text">{vehicleNo.toUpperCase()}</strong>
            </p>
            
            <div className="table-container card shadow-sm">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Entry Time</th>
                    <th>Exit Time</th>
                    <th>Duration</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r, i) => (
                    <tr key={i}>
                      <td>{r.date}</td>
                      <td>{r.entry_time}</td>
                      <td>{r.exit_time || '-'}</td>
                      <td>{r.duration || '-'}</td>
                      <td>
                        {r.amount ? (
                          <span className="badge badge-success">₹{r.amount}</span>
                        ) : (
                          <span className="badge badge-primary">Active</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}