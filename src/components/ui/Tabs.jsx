const Tabs = ({ 
  tabs, 
  activeTab, 
  onChange, 
  variant = 'underline',
  size = 'md',
  className = '' 
}) => {
  const variants = {
    underline: {
      container: 'border-b border-slate-200',
      tab: (active) => `
        px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors
        ${active 
          ? 'border-primary-600 text-primary-600' 
          : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
        }
      `
    },
    pills: {
      container: 'bg-slate-100 p-1 rounded-lg',
      tab: (active) => `
        px-4 py-2 text-sm font-medium rounded-md transition-all
        ${active 
          ? 'bg-white text-slate-900 shadow-sm' 
          : 'text-slate-500 hover:text-slate-700'
        }
      `
    },
    buttons: {
      container: 'flex gap-2',
      tab: (active) => `
        px-4 py-2 text-sm font-medium rounded-lg border transition-colors
        ${active 
          ? 'bg-primary-50 border-primary-200 text-primary-700' 
          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
        }
      `
    }
  };
  
  const sizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };
  
  const style = variants[variant];
  
  return (
    <div className={`flex ${style.container} ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={`${style.tab(activeTab === tab.value)} ${sizes[size]} whitespace-nowrap`}
        >
          {tab.icon && <tab.icon size={16} className="inline mr-1.5" />}
          {tab.label}
          {tab.count !== undefined && (
            <span className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-full ${
              activeTab === tab.value 
                ? 'bg-primary-100 text-primary-700' 
                : 'bg-slate-200 text-slate-600'
            }`}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

export default Tabs;



