import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import Navbar from '../components/Navbar'
import Card from '../components/Card'
import { MapPin, ArrowLeft } from 'lucide-react'

const Locations = () => {
  const { buildingId } = useParams()
  const [locations, setLocations] = useState([])
  const [building, setBuilding] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const fetchLocations = async () => {
      // Fetch building details
      const { data: bldgData } = await supabase
        .from('buildings')
        .select('*')
        .eq('id', buildingId)
        .single()
      
      if (bldgData) setBuilding(bldgData)

      // Fetch locations
      const { data, error } = await supabase
        .from('parking_locations')
        .select('*')
        .eq('building_id', buildingId)
        .order('name')

      if (error) {
        setError('Failed to load parking locations.')
      } else {
        setLocations(data)
      }
      setLoading(false)
    }

    fetchLocations()
  }, [buildingId])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button 
          onClick={() => navigate(building ? `/category/${building.category_id}/buildings` : -1)}
          className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-primary-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Buildings
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {building ? building.name : 'Parking Locations'}
          </h1>
          <p className="mt-2 text-gray-600">Select a floor or area to view available slots.</p>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {locations.map((loc) => (
              <Card
                key={loc.id}
                title={loc.name}
                subtitle={`Floor/Area: ${loc.floor_level || 'N/A'}`}
                icon={MapPin}
                onClick={() => navigate(`/location/${loc.id}/slots`)}
              />
            ))}
            {locations.length === 0 && !error && (
              <div className="col-span-full py-12 bg-white rounded-xl border border-gray-200 border-dashed text-center">
                <p className="text-gray-500">No parking locations found for this building.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default Locations
