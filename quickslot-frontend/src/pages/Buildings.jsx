import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import Navbar from '../components/Navbar'
import Card from '../components/Card'
import { BuildingIcon, ArrowLeft } from 'lucide-react'

const Buildings = () => {
  const { categoryId } = useParams()
  const [buildings, setBuildings] = useState([])
  const [category, setCategory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const fetchBuildings = async () => {
      // Fetch category details
      const { data: catData } = await supabase
        .from('categories')
        .select('*')
        .eq('id', categoryId)
        .single()
      
      if (catData) setCategory(catData)

      // Fetch buildings
      const { data, error } = await supabase
        .from('buildings')
        .select('*')
        .eq('category_id', categoryId)
        .order('name')

      if (error) {
        setError('Failed to load buildings.')
      } else {
        setBuildings(data)
      }
      setLoading(false)
    }

    fetchBuildings()
  }, [categoryId])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button 
          onClick={() => navigate('/')}
          className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-primary-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Categories
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {category ? category.name : 'Buildings'}
          </h1>
          <p className="mt-2 text-gray-600">Select a building to view parking locations.</p>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {buildings.map((building) => (
              <Card
                key={building.id}
                title={building.name}
                subtitle={building.address}
                icon={BuildingIcon}
                onClick={() => navigate(`/building/${building.id}/locations`)}
              />
            ))}
            {buildings.length === 0 && !error && (
              <p className="text-gray-500 col-span-3 text-center py-12 bg-white rounded-xl border border-gray-200 border-dashed">
                No buildings found for this category.
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default Buildings
