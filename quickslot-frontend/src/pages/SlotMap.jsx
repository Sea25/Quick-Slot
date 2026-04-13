import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function SlotMap() {
  const { locationId } = useParams()
  const navigate = useNavigate()

  const [building, setBuilding] = useState(null)
  const [locations, setLocations] = useState([])
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [slots, setSlots] = useState([])
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [vehicles, setVehicles] = useState([])
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [rate, setRate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState(false)
  const [error, setError] = useState('')
  const user = JSON.parse(localStorage.getItem('parking_user'))

  useEffect(() => { fetchData() }, [])
  useEffect(() => { if (selectedLocation) fetchSlots(selectedLocation.id) }, [selectedLocation])
  useEffect(() => { if (building && selectedVehicle) fetchRate() }, [building, selectedVehicle])

  async function fetchData() {
    const { data: bld } = await supabase
      .from('buildings').select('*').eq('id', locationId).single()
    setBuilding(bld)

    const { data: locs } = await supabase
      .from('parking_locations').select('*')
      .eq('building_id', locationId).eq('is_active', true)
    setLocations(locs || [])
    if (locs && locs.length > 0) setSelectedLocation(locs[0])

    const { data: vehs } = await supabase
      .from('vehicles').select('*')
      .eq('user_id', user.id).eq('is_active', true)
    setVehicles(vehs || [])
    if (vehs && vehs.length > 0) setSelectedVehicle(vehs[0])

    setLoading(false)
  }

  async function fetchSlots(locId) {
  // Release any expired held slots first
  await supabase
    .from('reservations')
    .update({ status: 'expired' })
    .lt('expires_at', new Date().toISOString())
    .eq('status', 'pending')

  // Then re-fetch slots normally
  const { data } = await supabase
    .from('slots').select('*')
    .eq('location_id', locId).order('slot_number')
  setSlots(data || [])
  setSelectedSlot(null)
}
  async function fetchSlots(locId) {
    const { data } = await supabase
      .from('slots').select('*')
      .eq('location_id', locId).order('slot_number')
    setSlots(data || [])
    setSelectedSlot(null)
  }

  async function fetchRate() {
    const { data } = await supabase
      .from('parking_rates')
      .select('*')
      .eq('building_id', building.id)
      .eq('vehicle_type', selectedVehicle.vehicle_type)
      .single()
    setRate(data)
  }

  async function handleBooking() {
    if (!selectedSlot || !selectedVehicle) return
    setError('')
    setBooking(true)

    const { data: freshSlot } = await supabase
      .from('slots').select('status').eq('id', selectedSlot.id).single()

    if (freshSlot.status !== 'available') {
      setError('Sorry! This slot was just taken. Please pick another.')
      setBooking(false)
      await fetchSlots(selectedLocation.id)
      return
    }

    const { data: reservation, error: resError } = await supabase
      .from('reservations')
      .insert({
        user_id: user.id,
        vehicle_id: selectedVehicle.id,
        slot_id: selectedSlot.id,
        expires_at: new Date(Date.now() + 60 * 60 * 1000 + (5.5 * 60 * 60 * 1000)).toISOString(),
        status: 'pending',
      })
      .select().single()

    if (resError) {
      setError('Booking failed: ' + resError.message)
      setBooking(false)
      return
    }

    await supabase.from('slots')
      .update({ status: 'held', updated_at: new Date().toISOString() })
      .eq('id', selectedSlot.id)

    setBooking(false)
    navigate(`/booking/${reservation.id}`)
  }

  function getSlotStyle(slot) {
    const isSelected = selectedSlot?.id === slot.id
    const isMatchingType = selectedVehicle
      ? slot.vehicle_type === selectedVehicle.vehicle_type : true

    if (isSelected) return { ...slotBase, ...slotSelected }
    if (slot.status === 'occupied') return { ...slotBase, ...slotOccupied }
    if (slot.status === 'held') return { ...slotBase, ...slotHeld }
    if (slot.status === 'maintenance') return { ...slotBase, ...slotMaintenance }
    if (!isMatchingType) return { ...slotBase, ...slotDimmed }
    return { ...slotBase, ...slotAvailable }
  }

  function isClickable(slot) {
    if (slot.status !== 'available') return false
    if (selectedVehicle && slot.vehicle_type !== selectedVehicle.vehicle_type) return false
    return true
  }

  const carSlots = slots.filter(s => s.vehicle_type === 'car')
  const bikeSlots = slots.filter(s => s.vehicle_type === 'bike')
  const availableCars = carSlots.filter(s => s.status === 'available').length
  const availableBikes = bikeSlots.filter(s => s.status === 'available').length

  // Split car slots into two rows for parking bay layout
  const half = Math.ceil(carSlots.length / 2)
  const topRow = carSlots.slice(0, half)
  const bottomRow = carSlots.slice(half)

  return (
    <div style={styles.page}>
      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.4); }
          50% { box-shadow: 0 0 0 6px rgba(34,197,94,0); }
        }
        .available-slot { animation: pulse 2s infinite; }
        .slot-hover:hover { transform: scale(1.1) !important; }
      `}</style>

      <div style={styles.glow1} />
      <div style={styles.glow2} />

      {/* Navbar */}
      <div style={styles.navbar}>
        <div style={styles.logoRow}>
          <div style={styles.logoIcon}>P</div>
          <span style={styles.logoText}>QuickSlot</span>
        </div>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>← Back</button>
      </div>

      {loading ? (
        <p style={styles.loadingText}>Loading parking map...</p>
      ) : (
        <div style={styles.content}>

          {/* Header */}
          <div style={styles.header}>
            <h1 style={styles.buildingName}>{building?.name}</h1>
            <p style={styles.buildingAddress}>📍 {building?.address}, {building?.city}</p>

            {/* Stats Row */}
            <div style={styles.statsRow}>
              <div style={styles.statBox}>
                <span style={styles.statNum}>{availableCars}</span>
                <span style={styles.statLabel}>🚗 Cars Free</span>
              </div>
              <div style={styles.statDivider} />
              <div style={styles.statBox}>
                <span style={styles.statNum}>{availableBikes}</span>
                <span style={styles.statLabel}>🏍️ Bikes Free</span>
              </div>
              {rate && (
                <>
                  <div style={styles.statDivider} />
                  <div style={styles.statBox}>
                    <span style={styles.statNum}>₹{rate.rate_per_hour}/hr</span>
                    <span style={styles.statLabel}>
                      {selectedVehicle?.vehicle_type === 'car' ? '🚗' : '🏍️'} Rate
                    </span>
                  </div>
                  <div style={styles.statDivider} />
                  <div style={styles.statBox}>
                    <span style={styles.statNum}>₹{rate.min_charge}</span>
                    <span style={styles.statLabel}>Min Charge</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Floor Tabs */}
          <div style={styles.floorTabs}>
            {locations.map(loc => (
              <button
                key={loc.id}
                style={{
                  ...styles.floorTab,
                  background: selectedLocation?.id === loc.id
                    ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                    : 'rgba(255,255,255,0.06)',
                  border: selectedLocation?.id === loc.id
                    ? '1px solid transparent'
                    : '1px solid rgba(255,255,255,0.12)',
                  color: selectedLocation?.id === loc.id
                    ? '#fff' : 'rgba(255,255,255,0.5)',
                }}
                onClick={() => setSelectedLocation(loc)}
              >
                🏢 {loc.name}
              </button>
            ))}
          </div>

          {/* Vehicle Selector */}
          {vehicles.length > 0 && (
            <div style={styles.vehicleBox}>
              <p style={styles.sectionLabel}>Select Your Vehicle</p>
              <div style={styles.vehicleRow}>
                {vehicles.map(v => (
                  <div
                    key={v.id}
                    style={{
                      ...styles.vehicleChip,
                      background: selectedVehicle?.id === v.id
                        ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.04)',
                      border: selectedVehicle?.id === v.id
                        ? '1px solid rgba(99,102,241,0.6)'
                        : '1px solid rgba(255,255,255,0.1)',
                    }}
                    onClick={() => { setSelectedVehicle(v); setSelectedSlot(null) }}
                  >
                    <span style={{ fontSize: '24px' }}>
                      {v.vehicle_type === 'car' ? '🚗' : '🏍️'}
                    </span>
                    <div>
                      <p style={styles.vehiclePlate}>{v.plate_number}</p>
                      <p style={styles.vehicleBrand}>{v.brand || v.vehicle_type} · {v.color}</p>
                    </div>
                    {selectedVehicle?.id === v.id && (
                      <div style={styles.selectedTick}>✓</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Legend */}
          <div style={styles.legend}>
            {[
              { style: { ...slotBase, ...slotAvailable, width: '24px', height: '24px', borderRadius: '6px' }, label: 'Available' },
              { style: { ...slotBase, ...slotSelected, width: '24px', height: '24px', borderRadius: '6px' }, label: 'Selected' },
              { style: { ...slotBase, ...slotHeld, width: '24px', height: '24px', borderRadius: '6px' }, label: 'On Hold' },
              { style: { ...slotBase, ...slotOccupied, width: '24px', height: '24px', borderRadius: '6px' }, label: 'Occupied' },
              { style: { ...slotBase, ...slotMaintenance, width: '24px', height: '24px', borderRadius: '6px' }, label: 'Maintenance' },
            ].map(item => (
              <div key={item.label} style={styles.legendItem}>
                <div style={item.style} />
                <span style={styles.legendLabel}>{item.label}</span>
              </div>
            ))}
          </div>

          {/* Parking Lot Map */}
          <div style={styles.parkingLot}>

            {/* Entry Gate */}
            <div style={styles.gateRow}>
              <div style={styles.gate}>
                <span style={styles.gateIcon}>🚧</span>
                <span style={styles.gateText}>ENTRY</span>
              </div>
              <div style={styles.gateLine} />
              <div style={styles.gate}>
                <span style={styles.gateIcon}>🚧</span>
                <span style={styles.gateText}>EXIT</span>
              </div>
            </div>

            {/* Car Parking Bays */}
            {carSlots.length > 0 && (
              <div style={styles.baySection}>
                <p style={styles.bayLabel}>🚗 Car Parking</p>

                {/* Top Row — facing down */}
                <div style={styles.slotRow}>
                  {topRow.map(slot => (
                    <div
                      key={slot.id}
                      className={`${isClickable(slot) ? 'available-slot slot-hover' : ''}`}
                      style={{ ...getSlotStyle(slot), ...styles.carSlot }}
                      onClick={() => isClickable(slot) && setSelectedSlot(slot)}
                    >
                      <div style={styles.carIcon}>🚗</div>
                      <div style={styles.slotNum}>{slot.slot_number}</div>
                      <div style={styles.slotStatusText}>
                        {slot.status === 'available' ? 'FREE' :
                         slot.status === 'held' ? 'HOLD' :
                         slot.status === 'occupied' ? 'FULL' : 'N/A'}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Driving Lane */}
                <div style={styles.drivingLane}>
                  <div style={styles.laneArrow}>→ → → → → → → → → →</div>
                  <div style={styles.laneLabel}>DRIVING LANE</div>
                  <div style={styles.laneArrow}>← ← ← ← ← ← ← ← ← ←</div>
                </div>

                {/* Bottom Row — facing up */}
                <div style={styles.slotRow}>
                  {bottomRow.map(slot => (
                    <div
                      key={slot.id}
                      className={`${isClickable(slot) ? 'available-slot slot-hover' : ''}`}
                      style={{ ...getSlotStyle(slot), ...styles.carSlot }}
                      onClick={() => isClickable(slot) && setSelectedSlot(slot)}
                    >
                      <div style={styles.carIcon}>🚗</div>
                      <div style={styles.slotNum}>{slot.slot_number}</div>
                      <div style={styles.slotStatusText}>
                        {slot.status === 'available' ? 'FREE' :
                         slot.status === 'held' ? 'HOLD' :
                         slot.status === 'occupied' ? 'FULL' : 'N/A'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Divider */}
            {carSlots.length > 0 && bikeSlots.length > 0 && (
              <div style={styles.sectionDivider} />
            )}

            {/* Bike Slots */}
            {bikeSlots.length > 0 && (
              <div style={styles.baySection}>
                <p style={styles.bayLabel}>🏍️ Bike Parking</p>
                <div style={styles.bikeRow}>
                  {bikeSlots.map(slot => (
                    <div
                      key={slot.id}
                      className={`${isClickable(slot) ? 'available-slot slot-hover' : ''}`}
                      style={{ ...getSlotStyle(slot), ...styles.bikeSlot }}
                      onClick={() => isClickable(slot) && setSelectedSlot(slot)}
                    >
                      <div style={{ fontSize: '18px' }}>🏍️</div>
                      <div style={styles.slotNum}>{slot.slot_number}</div>
                      <div style={styles.slotStatusText}>
                        {slot.status === 'available' ? 'FREE' :
                         slot.status === 'held' ? 'HOLD' :
                         slot.status === 'occupied' ? 'FULL' : 'N/A'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Booking Panel */}
          {selectedSlot && (
            <div style={styles.bookingPanel}>
              <div style={styles.bookingTop}>
                <div>
                  <p style={styles.bookingTitle}>Booking Summary</p>
                  <p style={styles.bookingSubtitle}>Slot will be held for 1 hour</p>
                </div>
                <button
                  style={styles.clearBtn}
                  onClick={() => setSelectedSlot(null)}
                >✕ Clear</button>
              </div>

              <div style={styles.bookingGrid}>
                {[
                  { label: 'Slot', value: selectedSlot.slot_number },
                  { label: 'Floor', value: selectedLocation?.name },
                  { label: 'Vehicle', value: selectedVehicle?.plate_number },
                  { label: 'Rate', value: rate ? `₹${rate.rate_per_hour}/hr` : '—' },
                  { label: 'Min Charge', value: rate ? `₹${rate.min_charge}` : '—' },
                  { label: 'Hold Time', value: '1 Hour' },
                ].map(item => (
                  <div key={item.label} style={styles.bookingItem}>
                    <p style={styles.bookingLabel}>{item.label}</p>
                    <p style={styles.bookingValue}>{item.value}</p>
                  </div>
                ))}
              </div>

              {error && <p style={styles.errorText}>⚠️ {error}</p>}

              <button
                style={{ ...styles.bookBtn, opacity: booking ? 0.7 : 1 }}
                onClick={handleBooking}
                disabled={booking}
              >
                {booking ? 'Booking...' : '✓ Confirm Booking →'}
              </button>
            </div>
          )}

        </div>
      )}
    </div>
  )
}

// Slot base and status styles
const slotBase = {
  borderRadius: '10px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '3px',
  transition: 'all 0.2s ease',
  cursor: 'pointer',
  userSelect: 'none',
}
const slotAvailable = {
  background: 'rgba(34,197,94,0.12)',
  border: '1px solid rgba(34,197,94,0.5)',
}
const slotSelected = {
  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
  border: '1px solid #8b5cf6',
  transform: 'scale(1.08)',
}
const slotOccupied = {
  background: 'rgba(239,68,68,0.15)',
  border: '1px solid rgba(239,68,68,0.4)',
  cursor: 'not-allowed',
}
const slotHeld = {
  background: 'rgba(245,158,11,0.15)',
  border: '1px solid rgba(245,158,11,0.4)',
  cursor: 'not-allowed',
}
const slotMaintenance = {
  background: 'rgba(107,114,128,0.15)',
  border: '1px solid rgba(107,114,128,0.3)',
  cursor: 'not-allowed',
}
const slotDimmed = {
  background: 'rgba(255,255,255,0.02)',
  border: '1px solid rgba(255,255,255,0.05)',
  cursor: 'not-allowed',
  opacity: 0.4,
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #0f0f1a 100%)',
    paddingBottom: '80px',
    position: 'relative',
    overflow: 'hidden',
  },
  glow1: {
    position: 'absolute', width: '500px', height: '500px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
    top: '-100px', right: '-100px', pointerEvents: 'none',
  },
  glow2: {
    position: 'absolute', width: '400px', height: '400px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)',
    bottom: '0px', left: '-100px', pointerEvents: 'none',
  },
  navbar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '20px 40px',
    background: 'rgba(255,255,255,0.03)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(255,255,255,0.07)',
    position: 'relative', zIndex: 10,
  },
  logoRow: { display: 'flex', alignItems: 'center', gap: '10px' },
  logoIcon: {
    width: '36px', height: '36px', borderRadius: '10px',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#fff', fontSize: '16px', fontWeight: '700',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  logoText: { fontSize: '20px', fontWeight: '700', color: '#fff', letterSpacing: '-0.5px' },
  backBtn: {
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '10px', color: '#fff',
    padding: '8px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
  },
  content: {
    maxWidth: '960px', margin: '0 auto',
    padding: '40px 24px', position: 'relative', zIndex: 1,
  },
  header: { textAlign: 'center', marginBottom: '32px' },
  buildingName: {
    color: '#fff', fontSize: '28px', fontWeight: '800',
    letterSpacing: '-0.5px', marginBottom: '8px',
  },
  buildingAddress: { color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: '20px' },
  statsRow: {
    display: 'inline-flex', alignItems: 'center', gap: '0',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '16px', padding: '16px 28px',
    flexWrap: 'wrap', justifyContent: 'center',
  },
  statBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '0 20px' },
  statNum: { color: '#fff', fontSize: '20px', fontWeight: '800' },
  statLabel: { color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: '600' },
  statDivider: { width: '1px', height: '36px', background: 'rgba(255,255,255,0.1)' },
  floorTabs: { display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' },
  floorTab: {
    padding: '10px 20px', borderRadius: '12px',
    fontSize: '13px', fontWeight: '600', cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  vehicleBox: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '16px', padding: '20px', marginBottom: '20px',
  },
  sectionLabel: {
    color: 'rgba(255,255,255,0.4)', fontSize: '11px',
    fontWeight: '700', letterSpacing: '0.5px',
    textTransform: 'uppercase', marginBottom: '14px',
  },
  vehicleRow: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
  vehicleChip: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '14px 18px', borderRadius: '14px',
    cursor: 'pointer', transition: 'all 0.2s ease',
    position: 'relative',
  },
  vehiclePlate: { color: '#fff', fontSize: '14px', fontWeight: '700' },
  vehicleBrand: { color: 'rgba(255,255,255,0.4)', fontSize: '11px', marginTop: '2px' },
  selectedTick: {
    position: 'absolute', top: '8px', right: '10px',
    color: '#a78bfa', fontSize: '12px', fontWeight: '700',
  },
  legend: {
    display: 'flex', gap: '20px', flexWrap: 'wrap',
    marginBottom: '24px', padding: '14px 20px',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '12px', alignItems: 'center',
  },
  legendItem: { display: 'flex', alignItems: 'center', gap: '8px' },
  legendLabel: { color: 'rgba(255,255,255,0.45)', fontSize: '12px' },
  parkingLot: {
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '20px', padding: '28px',
    marginBottom: '28px',
  },
  gateRow: {
    display: 'flex', alignItems: 'center',
    gap: '12px', marginBottom: '28px',
  },
  gate: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: '4px',
    background: 'rgba(245,158,11,0.1)',
    border: '1px solid rgba(245,158,11,0.3)',
    borderRadius: '10px', padding: '10px 20px',
  },
  gateIcon: { fontSize: '20px' },
  gateText: {
    color: '#fbbf24', fontSize: '10px',
    fontWeight: '800', letterSpacing: '1px',
  },
  gateLine: {
    flex: 1, height: '2px',
    background: 'repeating-linear-gradient(90deg, rgba(245,158,11,0.5) 0px, rgba(245,158,11,0.5) 10px, transparent 10px, transparent 20px)',
  },
  baySection: { marginBottom: '8px' },
  bayLabel: {
    color: 'rgba(255,255,255,0.5)', fontSize: '11px',
    fontWeight: '700', letterSpacing: '1px',
    textTransform: 'uppercase', marginBottom: '14px',
  },
  slotRow: {
    display: 'flex', gap: '10px',
    flexWrap: 'wrap', justifyContent: 'flex-start',
  },
  carSlot: { width: '88px', height: '88px', padding: '8px' },
  carIcon: { fontSize: '22px' },
  slotNum: { fontSize: '11px', fontWeight: '700', color: 'inherit' },
  slotStatusText: { fontSize: '9px', fontWeight: '800', letterSpacing: '0.5px', opacity: 0.8 },
  drivingLane: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px dashed rgba(255,255,255,0.1)',
    borderRadius: '8px', padding: '10px 16px',
    margin: '12px 0', textAlign: 'center',
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', gap: '12px',
  },
  laneArrow: { color: 'rgba(255,255,255,0.15)', fontSize: '11px', letterSpacing: '2px' },
  laneLabel: {
    color: 'rgba(255,255,255,0.2)', fontSize: '10px',
    fontWeight: '700', letterSpacing: '2px',
  },
  bikeRow: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  bikeSlot: { width: '72px', height: '80px', padding: '8px' },
  sectionDivider: {
    height: '1px', background: 'rgba(255,255,255,0.06)',
    margin: '24px 0',
  },
  bookingPanel: {
    background: 'rgba(99,102,241,0.08)',
    border: '1px solid rgba(99,102,241,0.3)',
    borderRadius: '20px', padding: '28px',
  },
  bookingTop: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: '20px',
  },
  bookingTitle: { color: '#fff', fontSize: '18px', fontWeight: '700', marginBottom: '4px' },
  bookingSubtitle: { color: 'rgba(255,255,255,0.4)', fontSize: '13px' },
  clearBtn: {
    background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.25)',
    borderRadius: '8px', color: '#fca5a5',
    padding: '6px 14px', fontSize: '12px',
    fontWeight: '600', cursor: 'pointer',
  },
  bookingGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '16px', marginBottom: '20px',
    padding: '20px',
    background: 'rgba(0,0,0,0.2)',
    borderRadius: '14px',
  },
  bookingItem: {},
  bookingLabel: {
    color: 'rgba(255,255,255,0.35)', fontSize: '10px',
    fontWeight: '700', letterSpacing: '0.5px',
    textTransform: 'uppercase', marginBottom: '4px',
  },
  bookingValue: { color: '#fff', fontSize: '15px', fontWeight: '700' },
  errorText: { color: '#fca5a5', fontSize: '13px', marginBottom: '12px' },
  bookBtn: {
    width: '100%', padding: '15px',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#fff', border: 'none', borderRadius: '12px',
    fontSize: '15px', fontWeight: '700', cursor: 'pointer',
  },
  loadingText: {
    textAlign: 'center', color: 'rgba(255,255,255,0.4)',
    marginTop: '100px', fontSize: '15px',
  },
}