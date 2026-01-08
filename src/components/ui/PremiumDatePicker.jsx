import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

const PremiumDatePicker = ({ label, value, onChange, placeholder, minDate, error, availableDates, required }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    if (value) {
      const [y, m, d] = value.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    return new Date();
  });
  const dropdownRef = useRef(null);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const isToday = (day) => {
    const today = new Date();
    return today.getDate() === day && 
           today.getMonth() === viewDate.getMonth() && 
           today.getFullYear() === viewDate.getFullYear();
  };

  const isSelected = (day) => {
    if (!value) return false;
    const [y, m, d] = value.split('-').map(Number);
    return d === day && 
           (m - 1) === viewDate.getMonth() && 
           y === viewDate.getFullYear();
  };

  // Helper to format date as YYYY-MM-DD in local timezone (prevents UTC shift)
  const formatLocalDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isDisabled = (day) => {
    const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const dateStr = formatLocalDate(date);

    // Check if date is in availableDates if provided
    if (availableDates && availableDates.length > 0) {
      if (!availableDates.includes(dateStr)) return true;
    }

    if (!minDate) return false;
    const [my, mm, md] = minDate.split('-').map(Number);
    const min = new Date(my, mm - 1, md);
    min.setHours(0, 0, 0, 0);
    return date < min;
  };

  const handleDateSelect = (day) => {
    if (isDisabled(day)) return;
    const selectedDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const formattedDate = formatLocalDate(selectedDate);
    onChange(formattedDate);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDateLabel = (dateStr) => {
    if (!dateStr) return null;
    // Parse YYYY-MM-DD string safely without timezone shift
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const totalDays = daysInMonth(viewDate.getFullYear(), viewDate.getMonth());
  const startDay = firstDayOfMonth(viewDate.getFullYear(), viewDate.getMonth());
  const calendarDays = [];

  for (let i = 0; i < startDay; i++) calendarDays.push(null);
  for (let i = 1; i <= totalDays; i++) calendarDays.push(i);

  return (
    <div className="flex flex-col gap-1.5" ref={dropdownRef}>
      {label && (
        <label className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
          <Calendar size={14} className="text-slate-400" />
          {label}
          {required && <span className="text-danger-500">*</span>}
        </label>
      )}
      
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between px-3 py-2.5 bg-white dark:bg-slate-800 border rounded-xl text-sm transition-all text-left ${
            isOpen ? 'ring-2 ring-primary-500/20 border-primary-500 bg-primary-50/10' : 
            error ? 'border-danger-500' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
          }`}
        >
          <span className={`${!value ? 'text-slate-400' : 'text-slate-700 dark:text-slate-200 font-medium'}`}>
            {formatDateLabel(value) || placeholder}
          </span>
          <Calendar size={18} className={isOpen ? 'text-primary-500' : 'text-slate-400'} />
        </button>

        {isOpen && (
          <div className="absolute left-0 top-full mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-[100] p-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-6">
              <button 
                type="button"
                onClick={handlePrevMonth} 
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-500 hover:text-primary-600"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="text-base font-bold text-slate-800 dark:text-white">
                {months[viewDate.getMonth()]} {viewDate.getFullYear()}
              </div>
              <button 
                type="button"
                onClick={handleNextMonth} 
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-500 hover:text-primary-600"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1.5 mb-2">
              {dayNames.map(day => (
                <div key={day} className="text-[11px] font-bold text-slate-400 text-center py-1 uppercase tracking-widest">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {calendarDays.map((day, idx) => (
                <div key={idx} className="aspect-square">
                  {day && (
                    <button
                      type="button"
                      disabled={isDisabled(day)}
                      onClick={() => handleDateSelect(day)}
                      className={`w-full h-full flex items-center justify-center text-sm rounded-xl transition-all ${
                        isSelected(day) ? 'bg-primary-500 text-white font-bold shadow-lg shadow-primary-500/30 scale-105' : 
                        isDisabled(day) ? 'text-slate-200 dark:text-slate-800 cursor-not-allowed' :
                        isToday(day) ? 'text-primary-600 dark:text-primary-400 font-bold bg-primary-50 dark:bg-primary-900/20 ring-1 ring-primary-500/30' :
                        'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-primary-600 dark:hover:text-primary-400'
                      }`}
                    >
                      {day}
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
              <button 
                type="button"
                onClick={() => {
                  onChange(formatLocalDate(new Date()));
                  setIsOpen(false);
                }}
                className="flex-1 py-2 text-xs font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
              >
                Today
              </button>
              <button 
                type="button"
                onClick={() => {
                  onChange('');
                  setIsOpen(false);
                }}
                className="flex-1 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>
      {error && <p className="text-xs text-danger-500 ml-1">{error}</p>}
    </div>
  );
};

export default PremiumDatePicker;
