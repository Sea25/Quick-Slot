import { useState, useEffect } from 'react';
import { reportsService } from '../services/api';
import { BarChart3, CarFront, IndianRupee } from 'lucide-react';

export default function Reports() {
  const [report, setReport] = useState({
    totalVehicles: 0,
    totalCollection: 0,
    vehicles: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await reportsService.getTodayReport();
        setReport({
          totalVehicles: res.data.totalVehicles || 0,
          totalCollection: res.data.totalCollection || 0,
          vehicles: res.data.vehicles || []
        });
      } catch (err) {
        setError('Failed to load today\'s report. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, []);

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <div className="flex-col gap-6 w-full">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 size={28} className="text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Today's Report</h1>
            <p className="text-primary font-medium">{todayStr}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-muted">Loading report data...</div>
      ) : error ? (
        <div className="p-4 rounded-md text-danger bg-danger-light text-center font-medium">
          {error}
        </div>
      ) : (
        <div className="flex flex-col gap-6 animate-fade-in">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="card p-6 flex items-center gap-4 bg-primary text-white" style={{ borderColor: 'transparent' }}>
              <div className="p-3 bg-white/20 rounded-full">
                <CarFront size={32} />
              </div>
              <div>
                <p className="text-primary-light font-medium uppercase tracking-wider text-sm mb-1">Total Vehicles</p>
                <div className="text-4xl font-bold">{report.totalVehicles}</div>
              </div>
            </div>
            
            <div className="card p-6 flex items-center gap-4 border-success bg-success-light">
              <div className="p-3 bg-success/20 rounded-full text-success">
                <IndianRupee size={32} />
              </div>
              <div>
                <p className="text-success font-medium uppercase tracking-wider text-sm mb-1">Total Collection</p>
                <div className="text-4xl font-bold text-success-dark">₹{report.totalCollection}</div>
              </div>
            </div>
          </div>

          {/* Records Table */}
          <div className="card p-6">
            <h2 className="text-xl font-bold mb-6">Today's Parking Records</h2>
            
            {report.vehicles && report.vehicles.length > 0 ? (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Vehicle No</th>
                      <th>Entry Time</th>
                      <th>Exit Time</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.vehicles.map((v, i) => (
                      <tr key={i}>
                        <td className="font-medium">{v.vehicle_no || v.vehicleNo}</td>
                        <td>{v.entry_time || v.entryTime}</td>
                        <td>{v.exit_time || v.exitTime || '-'}</td>
                        <td>
                          {v.amount || v.fee ? (
                            <span className="font-semibold text-success">₹{(v.amount || v.fee)}</span>
                          ) : (
                            <span className="badge badge-primary">Active</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-muted border border-dashed rounded-lg">
                No vehicles have parked today.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}