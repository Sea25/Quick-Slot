import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import Navbar from '../components/Navbar'
import { Receipt, CheckCircle, CreditCard } from 'lucide-react'

const ExitPayment = () => {
  const { sessionId } = useParams()
  const navigate = useNavigate()

  const [session, setSession] = useState(null)
  const [reservation, setReservation] = useState(null)
  const [rate, setRate] = useState(null)
  const [durationHours, setDurationHours] = useState(0)
  const [amount, setAmount] = useState(0)
  
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const calculatePayment = async () => {
      try {
        // 1. Fetch Session and Reservation
        const { data: sessionData, error: sessionError } = await supabase
          .from('parking_sessions')
          .select('*')
          .eq('id', sessionId)
          .single()

        if (sessionError) throw sessionError
        setSession(sessionData)

        const { data: resData, error: resError } = await supabase
          .from('reservations')
          .select(`
            *,
            slots(
              *,
              parking_locations(
                *,
                buildings(*)
              )
            )
          `)
          .eq('id', sessionData.reservation_id)
          .single()

        if (resError) throw resError
        setReservation(resData)

        // 2. Fetch Rate
        // Simplified: assuming global rate or rate based on category. We try returning the first one.
        const categoryId = resData.slots?.parking_locations?.buildings?.category_id
        
        let rateQuery = supabase.from('parking_rates').select('*')
        if (categoryId) {
          rateQuery = rateQuery.eq('category_id', categoryId)
        }
        
        const { data: rateData } = await rateQuery.limit(1).single()
        
        // Mock fallback if parking_rates isn't structured as expected
        const hourlyRate = rateData?.rate_per_hour || 50
        setRate(hourlyRate)

        // 3. Calculate duration
        const exitTime = new Date()
        const entryTime = new Date(sessionData.entry_time)
        const diffMs = exitTime - entryTime
        
        // Calculate hours, minimum 1 hour
        const hrs = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60)))
        setDurationHours(hrs)
        setAmount(hrs * hourlyRate)

      } catch (err) {
        setError('Failed to fetch session details calculations.')
      } finally {
        setLoading(false)
      }
    }

    calculatePayment()
  }, [sessionId])

  const handlePayment = async () => {
    setProcessing(true)
    setError('')

    try {
      const exitTime = new Date().toISOString()

      // 1. Update session exit_time
      const { error: updateSessionError } = await supabase
        .from('parking_sessions')
        .update({ exit_time: exitTime })
        .eq('id', session.id)

      if (updateSessionError) throw updateSessionError

      // 2. Insert payment
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          session_id: session.id,
          amount: amount,
          payment_time: exitTime,
          status: 'completed',
          method: 'card' // Mocking credit card selection
        })

      if (paymentError) throw paymentError

      // 3. Update slot -> 'available'
      const { error: slotError } = await supabase
        .from('slots')
        .update({ status: 'available' })
        .eq('id', reservation.slot_id)

      if (slotError) throw slotError

      // 4. Update reservation -> 'completed' (assuming this status exists, otherwise ignore)
      await supabase
        .from('reservations')
        .update({ status: 'completed' })
        .eq('id', reservation.id)

      setSuccess(true)
    } catch (err) {
      setError(err.message || 'Payment processing failed. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col pt-20 items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col pt-20 items-center px-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 max-w-md w-full text-center">
          <div className="flex justify-center mb-6">
            <CheckCircle className="w-16 h-16 text-success-500" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
          <p className="text-gray-600 mb-8">Thank you for parking with QuickSlot.</p>
          <button 
            onClick={() => navigate('/')} 
            className="w-full py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <main className="flex-1 max-w-md w-full mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">Checkout & Payment</h1>

        {error && (
          <div className="bg-danger-50 text-danger-700 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 overflow-hidden relative">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-dashed border-gray-300">
            <div className="bg-gray-100 p-3 rounded-full">
              <Receipt className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Session ID</p>
              <p className="font-mono font-medium text-gray-900">{session?.id?.substring(0, 8).toUpperCase()}</p>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex justify-between">
              <span className="text-gray-600">Entry Time</span>
              <span className="font-medium">{new Date(session?.entry_time).toLocaleTimeString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Duration</span>
              <span className="font-medium">{durationHours} hr{durationHours > 1 ? 's' : ''}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Rate (per hr)</span>
              <span className="font-medium">₹{rate}</span>
            </div>
          </div>

          <div className="border-t-2 border-dashed border-gray-200 pt-6 mb-8 flex justify-between items-center">
            <span className="text-xl font-bold text-gray-900">Total Amount</span>
            <span className="text-3xl font-bold text-primary-600">₹{amount}</span>
          </div>

          <button
            onClick={handlePayment}
            disabled={processing}
            className="w-full py-4 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 focus:ring-4 focus:ring-gray-200 transition-all flex items-center justify-center gap-2 disabled:opacity-75"
          >
            {processing ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                Pay ₹{amount}
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  )
}

export default ExitPayment
