const Card = ({ children, className = '', padding = true }) => {
  return (
    <div
      className={`
        bg-white rounded-lg border border-slate-200 shadow-sm
        ${padding ? 'p-6' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  )
}

export const CardHeader = ({ children, className = '' }) => (
  <div className={`mb-4 ${className}`}>{children}</div>
)

export const CardTitle = ({ children, className = '' }) => (
  <h3 className={`text-lg font-semibold text-slate-900 ${className}`}>{children}</h3>
)

export const CardContent = ({ children, className = '' }) => (
  <div className={className}>{children}</div>
)

export default Card

