const Card = ({ title, subtitle, icon: Icon, onClick, className = '' }) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col items-center justify-center gap-4 cursor-pointer hover:shadow-md hover:border-primary-500 transition-all duration-200 group ${className}`}
    >
      {Icon && (
        <div className="p-4 bg-primary-50 text-primary-600 rounded-full group-hover:bg-primary-600 group-hover:text-white transition-colors duration-200">
          <Icon className="h-8 w-8" />
        </div>
      )}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
          {title}
        </h3>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
    </div>
  )
}

export default Card
