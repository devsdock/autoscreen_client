import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const AccordionItem = ({ 
  title, 
  children, 
  isOpen, 
  onToggle,
  className = '' 
}) => {
  return (
    <div className={`border-b border-slate-200 last:border-b-0 ${className}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-4 px-1 text-left hover:text-primary-600 transition-colors"
        aria-expanded={isOpen}
      >
        <span className="font-medium text-slate-900 pr-4">{title}</span>
        <ChevronDown 
          size={20} 
          className={`text-slate-400 transition-transform duration-200 flex-shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>
      <div 
        className={`
          overflow-hidden transition-all duration-200
          ${isOpen ? 'max-h-96 pb-4' : 'max-h-0'}
        `}
      >
        <div className="px-1 text-slate-600 text-sm leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
};

const Accordion = ({ 
  items, 
  allowMultiple = false,
  defaultOpen = [],
  className = '' 
}) => {
  const [openItems, setOpenItems] = useState(new Set(defaultOpen));
  
  const toggleItem = (id) => {
    setOpenItems((prev) => {
      const newSet = new Set(allowMultiple ? prev : []);
      if (prev.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };
  
  return (
    <div className={`divide-y divide-slate-200 ${className}`}>
      {items.map((item) => (
        <AccordionItem
          key={item.id}
          title={item.question || item.title}
          isOpen={openItems.has(item.id)}
          onToggle={() => toggleItem(item.id)}
        >
          {item.answer || item.content}
        </AccordionItem>
      ))}
    </div>
  );
};

export { Accordion, AccordionItem };
export default Accordion;


