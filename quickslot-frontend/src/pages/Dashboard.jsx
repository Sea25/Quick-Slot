import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CarFront, IndianRupee, Disc, Disc3, ArrowRight, ArrowDownLeft } from 'lucide-react';
import { parkingService, slotsService, reportsService } from '../services/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    todayVehicles: 0,
    totalCollection: 0,
    freeSlots: 0,
    occupiedSlots: 0,
  });
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [reportsRes, slotsRes] = await Promise.all([
          reportsService.getTodayReport().catch(() => ({ data: { totalVehicles: 0, totalCollection: 0 } })),
          slotsService.getSlots().catch(() => ({ data: Array.from({ length: 20 }, (_, i) => ({ id: `A${i+1}`, is_empty: true })) })),
        ]);

        const todayVehicles = reportsRes.data.totalVehicles || 0;
        const totalCollection = reportsRes.data.totalCollection || 0;
        const slotsData = slotsRes.data || [];
        
        let free = 0;
        let occupied = 0;
        slotsData.forEach((s) => {
          if (s.is_empty) free++;
          else occupied++;
        });

        setStats({ todayVehicles, totalCollection, freeSlots: free, occupiedSlots: occupied });
        setSlots(slotsData);
      } catch (error) {
        console.error("Dashboard error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  return (
    <div className="flex-col gap-8 w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted">Overview of your parking operations</p>
        </div>
        <div className="flex gap-4">
          <button className="btn btn-primary" onClick={() => navigate('/entry')}>
            <ArrowRight size={18} /> New Entry
          </button>
          <button className="btn btn-outline" onClick={() => navigate('/exit')}>
            <ArrowDownLeft size={18} /> Process Exit
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-muted">Loading dashboard...</div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 w-full" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
            <div className="card p-6 flex flex-col gap-2">
              <div className="flex items-center justify-between text-muted">
                <span className="font-semibold text-sm uppercase tracking-wider">Today's Vehicles</span>
                <CarFront size={20} className="text-primary" />
              </div>
              <div className="text-3xl font-bold">{stats.todayVehicles}</div>
            </div>
            
            <div className="card p-6 flex flex-col gap-2">
              <div className="flex items-center justify-between text-muted">
                <span className="font-semibold text-sm uppercase tracking-wider">Total Collection</span>
                <IndianRupee size={20} className="text-warning" />
              </div>
              <div className="text-3xl font-bold">₹{stats.totalCollection}</div>
            </div>

            <div className="card p-6 flex flex-col gap-2">
              <div className="flex items-center justify-between text-muted">
                <span className="font-semibold text-sm uppercase tracking-wider">Free Slots</span>
                <Disc size={20} className="text-success" />
              </div>
              <div className="text-3xl font-bold">{stats.freeSlots}</div>
            </div>

            <div className="card p-6 flex flex-col gap-2">
              <div className="flex items-center justify-between text-muted">
                <span className="font-semibold text-sm uppercase tracking-wider">Occupied Slots</span>
                <Disc3 size={20} className="text-danger" />
              </div>
              <div className="text-3xl font-bold">{stats.occupiedSlots}</div>
            </div>
          </div>

          {/* Parking Slot Grid */}
          <div className="card p-6 w-full">
            <h2 className="text-xl font-bold mb-4">Parking Slots Status</h2>
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))' }}>
              {slots.map((slot) => {
                const isFree = slot.is_empty ?? true;
                return (
                  <div 
                    key={slot.id || slot.slot_id} 
                    title={isFree ? 'Free' : `Occupied${slot.vehicle_no ? ' by ' + slot.vehicle_no : ''}`}
                    className={`flex items-center justify-center h-20 rounded-md font-bold text-lg cursor-default transition-all shadow-sm ${
                      isFree 
                        ? 'bg-transparent text-text' 
                        : 'bg-danger text-white border-transparent'
                    }`}
                    style={isFree ? { border: '1px solid var(--color-border)' } : {}}
                  >
                    {slot.id || slot.slot_id}
                  </div>
                )
              })}
            </div>
            {slots.length === 0 && (
              <div className="py-8 text-center text-muted">
                No slots configured. Check database or API connection.
              </div>
            )}
            <div className="flex gap-6 mt-6 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-4 h-4 rounded-sm bg-transparent shadow-sm" style={{ border: '1px solid var(--color-border)' }}></div>
                <span className="text-muted font-medium">Available</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-4 h-4 rounded-sm bg-danger shadow-sm"></div>
                <span className="text-muted text-danger font-medium">Occupied</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
