import { useState } from 'react';
import { Search, Filter, MapPin, Star, ShieldCheck } from 'lucide-react';
import useDashboardStore from '../../store/useDashboardStore';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Rating from '../../components/ui/Rating';
import { useNavigate } from 'react-router-dom';

const ProviderList = () => {
  const navigate = useNavigate();
  const { providers, searchProviders } = useDashboardStore();
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredProviders = providers.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.address.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Find Providers"
        subtitle="Browse top-rated auto glass specialists in your area"
      />

      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search by name or city..."
          icon={Search}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <Button variant="secondary">
          <Filter size={18} />
          Filters
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProviders.map((provider) => (
          <Card 
            key={provider.id}
            className="flex flex-col h-full hover:shadow-lg transition-shadow"
          >
            <div className="flex-1 space-y-4">
              <div className="flex items-start justify-between">
                <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center text-primary-700 font-bold text-2xl">
                  {provider.name.charAt(0)}
                </div>
                {provider.isVerified && (
                  <div className="flex items-center gap-1 text-xs font-bold text-primary-600 bg-primary-50 px-2 py-1 rounded-full border border-primary-100">
                    <ShieldCheck size={14} />
                    Verified
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900">{provider.name}</h3>
                <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                  <MapPin size={14} />
                  {provider.address.city}
                </div>
              </div>

              <Rating 
                value={provider.rating} 
                reviewCount={provider.reviewsCount} 
              />

              <div className="flex flex-wrap gap-2">
                {provider.services.slice(0, 3).map((service, idx) => (
                  <span 
                    key={idx}
                    className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md"
                  >
                    {service.name}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-50">
              <Button 
                className="w-full"
                onClick={() => navigate(`/dashboard/providers/${provider.id}`)}
              >
                View Profile
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ProviderList;
