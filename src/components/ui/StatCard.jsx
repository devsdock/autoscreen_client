import { ArrowRight, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const StatCard = ({
  icon: Icon,
  label,
  value,
  subValue,
  trend,
  trendValue,
  linkTo,
  linkLabel = 'View More',
  iconBgColor = 'bg-primary-50',
  iconColor = 'text-primary-600',
  borderColor = 'border-primary',
  className = ''
}) => {
  return (
    <div className={`bg-white rounded-2xl border-t-4 ${borderColor} p-5 shadow-sm hover:shadow-md transition-all ${className}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-3xl font-bold text-slate-900">{value}</p>
          <p className="text-sm text-slate-500 mt-1">{label}</p>
          {subValue && (
            <p className="text-xs text-slate-400 mt-0.5">{subValue}</p>
          )}
        </div>
        <div className="flex items-center gap-1 text-primary">
          <TrendingUp size={20} />
        </div>
      </div>
      
      {linkTo && (
        <Link 
          to={linkTo}
          className="inline-flex items-center gap-2 mt-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-dark-blue transition-colors"
        >
          {linkLabel}
          <ArrowRight size={16} />
        </Link>
      )}
    </div>
  );
};

export default StatCard;
