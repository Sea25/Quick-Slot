import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import Navbar from '../components/Navbar'
import { Clock, Play, CreditCard } from 'lucide-react'

const ActiveSession = () => {
  const { reservationId } = useParams()
  const navigate = useNavigate()
  
  const [reservation, setReservation] = useState(null)
  const [parkingSession, setParkingSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchReservationDetails = async () => {
      // 1. Fetch reservation info
      const { data: resData, error: resError } = await supabase
        .from('reservations')
        .select(`
          *,
          vehicles(*),
          slots(
            *,
            parking_locations(
              *,
              buildings(*)
            )
          )
        `)
        .eq('id', reservationId)
        .single()

      if (resError) {
        setError('Failed to load reservation details.')
        setLoading(false)
        return
      }

      setReservation(resData)

      // 2. Fetch active parking session if any
      const { data: sessionData } = await supabase
        .from('parking_sessions')
        .select('*')
        .eq('reservation_id', reservationId)
        .is('exit_time', null)
        .single()
      
      if (sessionData) {
        setParkingSession(sessionData)
      }

      setLoading(false)
    }

    fetchReservationDetails()
  }, [reservationId])

  const handleStartParking = async () => {
    setActionLoading(true)
    setError('')

    try {
      // 1. Create entry in parking_sessions
      const entryTime = new Date().toISOString()
      const { data: session, error: sessionError } = await supabase
        .from('parking_sessions')
        .insert({
          reservation_id: reservationId,
          entry_time: entryTime
        })
        .select()
        .single()

      if (sessionError) throw sessionError

      // 2. Update slot -> 'occupied'
      const { error: slotError } = await supabase
        .from('slots')
        .update({ status: 'occupied' })
        .eq('id', reservation.slot_id)

      if (slotError) throw slotError

      setParkingSession(session)
    } catch (err) {
      setError('Failed to start parking session.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleEndSession = () => {
    if (parkingSession) {
      navigate(`/session/${parkingSession.id}/payment`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  if (!reservation && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 max-w-3xl w-full mx-auto px-4 py-12 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Reservation not found</h2>
          <button onClick={() => navigate('/')} className="text-primary-600 hover:underline">Return to Dashboard</button>
        </div>
      </div>
    )
  }

  const slot = reservation.slots
  const location = slot.parking_locations
  const building = location.buildings
  const vehicle = reservation.vehicles

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">Your Parking Session</h1>

        {error && (
          <div className="bg-danger-50 text-danger-700 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="bg-gray-900 text-white p-6 relative overflow-hidden">
            <div className="absolute opacity-10 top-0 right-0 transform translate-x-1/4 -translate-y-1/4">
              <Clock className="w-64 h-64" />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row md:justify-between md:items-center">
              <div>
                <p className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-1">Status</p>
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${parkingSession ? 'bg-danger-500 animate-pulse' : 'bg-warning-500'}`}></span>
                  <p className="text-2xl font-bold">{parkingSession ? 'Parking Active' : 'Slot Reserved (Held)'}</p>
                </div>
              </div>
              <div className="mt-4 md:mt-0 text-left md:text-right">
                <p className="text-gray-400 text-sm mb-1">Entry Time</p>
                <p className="text-xl font-mono">
                  {parkingSession 
                    ? new Date(parkingSession.entry_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                    : '-- : --'}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-2 gap-y-6 gap-x-4 mb-8">
              <div>
                <p className="text-sm text-gray-500 font-medium">Building</p>
                <p className="text-lg font-semibold text-gray-900">{building.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Location</p>
                <p className="text-lg font-semibold text-gray-900">{location.name} (Floor {location.floor_level})</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Slot number</p>
                <p className="text-lg font-semibold text-primary-600">{slot.slot_number}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Vehicle info</p>
                <p className="text-lg font-semibold text-gray-900">{vehicle.license_plate}</p>
              </div>
            </div>

            {parkingSession ? (
              <button
                onClick={handleEndSession}
                className="w-full py-4 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-all flex justify-center items-center gap-2"
              >
                <CreditCard className="w-5 h-5" />
                End Session & Pay
              </button>
            ) : (
              <button
                onClick={handleStartParking}
                disabled={actionLoading}
                className="w-full py-4 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-all disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {actionLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Start Parking
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default ActiveSession
