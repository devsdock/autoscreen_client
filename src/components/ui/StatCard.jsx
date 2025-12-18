const StatCard = ({
  icon: Icon,
  label,
  value,
  subValue,
  trend,
  trendValue,
  iconBgColor = 'bg-primary-50',
  iconColor = 'text-primary-600',
  className = ''
}) => {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-5 shadow-card hover:shadow-card-hover transition-shadow ${className}`}>
      <div className="flex items-start justify-between">
        <div className={`p-2.5 rounded-lg ${iconBgColor}`}>
          <Icon size={22} className={iconColor} />
        </div>
        {trend && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            trend === 'up' ? 'bg-green-50 text-green-600' : 
            trend === 'down' ? 'bg-red-50 text-red-600' : 
            'bg-slate-100 text-slate-600'
          }`}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        {subValue && (
          <p className="text-sm text-slate-500 mt-0.5">{subValue}</p>
        )}
        <p className="text-sm font-medium text-slate-600 mt-1">{label}</p>
      </div>
    </div>
  );
};

export default StatCard;

