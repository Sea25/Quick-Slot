import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import Navbar from '../components/Navbar'
import Card from '../components/Card'
import { Building2, ShoppingBag, Stethoscope, Video, LayoutList } from 'lucide-react'

// Map category names to icons
const getCategoryIcon = (name) => {
  const lowername = name.toLowerCase()
  if (lowername.includes('mall')) return ShoppingBag
  if (lowername.includes('hospital')) return Stethoscope
  if (lowername.includes('theatre') || lowername.includes('theater')) return Video
  if (lowername.includes('office')) return Building2
  return LayoutList
}

const Dashboard = () => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')

      if (error) {
        setError('Failed to load categories.')
      } else {
        setCategories(data)
      }
      setLoading(false)
    }

    fetchCategories()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Where are you parking today?</h1>
          <p className="mt-2 text-gray-600">Select a category to find available parking buildings.</p>
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
            {categories.map((category) => (
              <Card
                key={category.id}
                title={category.name}
                subtitle={category.description || 'View locations'}
                icon={getCategoryIcon(category.name)}
                onClick={() => navigate(`/category/${category.id}/buildings`)}
              />
            ))}
            {categories.length === 0 && !error && (
              <p className="text-gray-500 col-span-3 text-center py-12">
                No categories found. Please add data to your database.
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default Dashboard
