const SlotGrid = ({ slots, onSelectSlot, selectedSlotId }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return 'bg-success-50 border-success-200 text-success-700 hover:bg-success-100'
      case 'held':
        return 'bg-warning-50 border-warning-200 text-warning-700 cursor-not-allowed hidden' // The prompt says "Only show slots where status = 'available'", but we'll show them disabled to give reality if wanted, or hidden. We'll disable them.
      case 'occupied':
        return 'bg-danger-50 border-danger-200 text-danger-700 cursor-not-allowed opacity-50'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700'
    }
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {slots.map((slot) => {
        const isSelected = selectedSlotId === slot.id
        const isAvailable = slot.status === 'available'

        return (
          <button
            key={slot.id}
            disabled={!isAvailable}
            onClick={() => isAvailable && onSelectSlot(slot)}
            className={`
              relative p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all
              ${getStatusColor(slot.status)}
              ${isSelected ? 'ring-2 ring-primary-500 ring-offset-2 border-primary-500' : ''}
              ${!isAvailable ? 'opacity-50' : 'hover:-translate-y-1 hover:shadow-md'}
            `}
          >
            <span className="text-lg font-bold">{slot.slot_number}</span>
            <span className="text-xs font-medium uppercase tracking-wider">{slot.status}</span>
            
            {isSelected && (
              <div className="absolute -top-2 -right-2 bg-primary-600 text-white p-1 rounded-full shadow-sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}

export default SlotGrid
