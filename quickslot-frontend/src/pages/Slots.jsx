import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import Navbar from '../components/Navbar'
import SlotGrid from '../components/SlotGrid'
import { ArrowLeft, CarFront } from 'lucide-react'

const Slots = () => {
  const { locationId } = useParams()
  const [slots, setSlots] = useState([])
  const [location, setLocation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedSlot, setSelectedSlot] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchSlots = async () => {
      // Fetch location details
      const { data: locData } = await supabase
        .from('parking_locations')
        .select('*, buildings(*)')
        .eq('id', locationId)
        .single()
      
      if (locData) setLocation(locData)

      // Fetch slots
      const { data, error } = await supabase
        .from('slots')
        .select('*')
        .eq('location_id', locationId)
        .order('slot_number')

      if (error) {
        setError('Failed to load parking slots.')
      } else {
        setSlots(data)
      }
      setLoading(false)
    }

    fetchSlots()
    
    // Setup realtime subscription to slots
    const subscription = supabase
      .channel('public:slots')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'slots', filter: `location_id=eq.${locationId}` }, payload => {
        setSlots(currentSlots => currentSlots.map(slot => 
          slot.id === payload.new.id ? payload.new : slot
        ))
      })
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [locationId])

  const handleSelectSlot = (slot) => {
    setSelectedSlot(slot)
  }

  const handleContinue = () => {
    if (selectedSlot) {
      navigate(`/slot/${selectedSlot.id}/vehicle`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button 
          onClick={() => navigate(location?.building_id ? `/building/${location.building_id}/locations` : -1)}
          className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-primary-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Locations
        </button>

        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-6 border-b border-gray-200">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {location ? `${location.name} Slots` : 'Parking Slots'}
            </h1>
            <p className="mt-2 text-gray-600">Select an available slot to reserve.</p>
          </div>
          
          <div className="mt-4 md:mt-0 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-success-500"></span>
              <span className="text-sm text-gray-600">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-warning-500"></span>
              <span className="text-sm text-gray-600">Held</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-danger-500"></span>
              <span className="text-sm text-gray-600">Occupied</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-danger-50 text-danger-700 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            {slots.length > 0 ? (
              <SlotGrid 
                slots={slots} 
                onSelectSlot={handleSelectSlot} 
                selectedSlotId={selectedSlot?.id} 
              />
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No slots created for this location yet.</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating Action Bar */}
      {selectedSlot && (
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-primary-50 p-3 rounded-lg text-primary-600">
                <CarFront className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Selected Slot</p>
                <p className="text-xl font-bold text-gray-900">{selectedSlot.slot_number}</p>
              </div>
            </div>
            <button
              onClick={handleContinue}
              className="px-6 py-3 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 focus:ring-4 focus:ring-primary-100 transition-all"
            >
              Continue to Vehicle Selection
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Slots
