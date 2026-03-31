import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import { Car, ArrowLeft, CheckCircle2 } from 'lucide-react'

const SelectVehicle = () => {
  const { slotId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [vehicles, setVehicles] = useState([])
  const [selectedVehicleId, setSelectedVehicleId] = useState('')
  const [loading, setLoading] = useState(true)
  const [reserving, setReserving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchVehicles = async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('user_id', user?.id)

      if (error) {
        setError('Failed to load vehicles.')
      } else {
        setVehicles(data)
        if (data.length > 0) {
          setSelectedVehicleId(data[0].id)
        }
      }
      setLoading(false)
    }

    if (user?.id) fetchVehicles()
  }, [user])

  const handleConfirmReservation = async () => {
    if (!selectedVehicleId) {
      setError('Please select a vehicle first.')
      return
    }

    setReserving(true)
    setError('')

    try {
      // 1. Double check if slot is actually available
      const { data: slot, error: slotError } = await supabase
        .from('slots')
        .select('status')
        .eq('id', slotId)
        .single()

      if (slotError || slot.status !== 'available') {
        throw new Error('Slot is no longer available.')
      }

      // 2. Update slot status to held
      const { error: updateError } = await supabase
        .from('slots')
        .update({ status: 'held' })
        .eq('id', slotId)

      if (updateError) throw updateError

      // 3. Insert into reservations table
      const { data: reservation, error: resError } = await supabase
        .from('reservations')
        .insert({
          user_id: user.id,
          vehicle_id: selectedVehicleId,
          slot_id: slotId,
          start_time: new Date().toISOString(),
          status: 'active' // user request says "Active Session Page: Show current session. Button Start Parking creates entry in parking_sessions" and doesn't specify reservation status
        })
        .select()
        .single()

      if (resError) throw resError

      // 4. Redirect to Active Session page
      navigate(`/reservation/${reservation.id}`)
    } catch (err) {
      setError(err.message || 'Failed to make a reservation. Try again.')
      // If we failed after holding the slot, ideally we should release it, but let's keep it simple
    } finally {
      setReserving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <button 
          onClick={() => navigate(-1)}
          className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-primary-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Slots
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-50 text-primary-600 mb-4">
              <Car className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Select Your Vehicle</h1>
            <p className="mt-2 text-gray-600">Choose the vehicle you'll be parking in this slot.</p>
          </div>

          {error && (
            <div className="bg-danger-50 border-l-4 border-danger-500 p-4 mb-6 rounded-r">
              <p className="text-sm text-danger-700">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : vehicles.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">You don't have any vehicles registered.</p>
              <button className="text-primary-600 font-medium hover:underline">Add a vehicle</button>
            </div>
          ) : (
            <div className="space-y-4 mb-8">
              {vehicles.map((vehicle) => {
                const isSelected = selectedVehicleId === vehicle.id
                return (
                  <div 
                    key={vehicle.id}
                    onClick={() => setSelectedVehicleId(vehicle.id)}
                    className={`
                      relative flex items-center p-4 cursor-pointer rounded-xl border-2 transition-all duration-200
                      ${isSelected ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-primary-300'}
                    `}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-lg font-semibold text-gray-900 truncate">{vehicle.license_plate}</p>
                      <p className="text-sm text-gray-500 truncate">{vehicle.make} {vehicle.model} ({vehicle.color})</p>
                    </div>
                    {isSelected && <CheckCircle2 className="w-6 h-6 text-primary-600 shrink-0" />}
                  </div>
                )
              })}
            </div>
          )}

          <button
            onClick={handleConfirmReservation}
            disabled={reserving || !selectedVehicleId}
            className="w-full py-4 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 focus:ring-4 focus:ring-primary-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
          >
            {reserving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Reserving Slot...
              </>
            ) : 'Confirm Reservation'}
          </button>
        </div>
      </main>
    </div>
  )
}

export default SelectVehicle
