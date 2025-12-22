import { useState } from 'react';
import { 
  MessageSquare, 
  Mail, 
  Phone, 
  Clock,
  Send,
  Upload,
  HelpCircle
} from 'lucide-react';
import useDashboardStore from '../../store/useDashboardStore';
import PageHeader from '../../components/ui/PageHeader';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import Accordion from '../../components/ui/Accordion';
import { faqData } from '../../data/faq';

const Support = () => {
  const { bookings, addToast } = useDashboardStore();
  const [issueForm, setIssueForm] = useState({
    type: '',
    bookingId: '',
    subject: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  
  const issueTypes = [
    { value: 'booking', label: 'Booking issue' },
    { value: 'payment', label: 'Payment issue' },
    { value: 'provider', label: 'Provider complaint' },
    { value: 'technical', label: 'Technical problem' },
    { value: 'other', label: 'Other' }
  ];
  
  const recentBookings = bookings.slice(0, 5).map(b => ({
    value: b.id,
    label: `${b.id} - ${b.service}`
  }));
  
  const handleSubmitIssue = async (e) => {
    e.preventDefault();
    
    if (!issueForm.type || !issueForm.subject || !issueForm.description) {
      addToast({ type: 'error', message: 'Please fill in all required fields' });
      return;
    }
    
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    addToast({ 
      type: 'success', 
      message: 'Issue submitted. We\'ll respond within 24 hours.' 
    });
    
    setIssueForm({
      type: '',
      bookingId: '',
      subject: '',
      description: ''
    });
    setLoading(false);
  };
  
  const handleWhatsAppClick = () => {
    window.open('https://wa.me/27800288645', '_blank');
  };
  
  const handleEmailClick = () => {
    window.location.href = 'mailto:support@autoscreen.co.za';
  };
  
  const handlePhoneClick = () => {
    window.location.href = 'tel:0800288645';
  };
  
  return (
    <div className="space-y-6">
      <PageHeader
        title="Help & Support"
        subtitle="Get help with your bookings and account"
      />
      
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Contact & FAQ */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Options */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Us</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-3 gap-4">
                <button
                  onClick={handleWhatsAppClick}
                  className="flex flex-col items-center p-6 bg-green-50 rounded-xl hover:bg-green-100 transition-colors group"
                >
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <MessageSquare size={24} className="text-white" />
                  </div>
                  <span className="font-semibold text-slate-900">WhatsApp</span>
                  <span className="text-sm text-slate-500 mt-1">Chat with us</span>
                </button>
                
                <button
                  onClick={handleEmailClick}
                  className="flex flex-col items-center p-6 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors group"
                >
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Mail size={24} className="text-white" />
                  </div>
                  <span className="font-semibold text-slate-900">Email</span>
                  <span className="text-sm text-slate-500 mt-1">support@autoscreen.co.za</span>
                </button>
                
                <button
                  onClick={handlePhoneClick}
                  className="flex flex-col items-center p-6 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors group"
                >
                  <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Phone size={24} className="text-white" />
                  </div>
                  <span className="font-semibold text-slate-900">Phone</span>
                  <span className="text-sm text-slate-500 mt-1">0800 AUTO GLASS</span>
                </button>
              </div>
              
              <div className="mt-6 p-4 bg-slate-50 rounded-xl flex items-center gap-3">
                <Clock size={20} className="text-slate-400" />
                <div className="text-sm">
                  <span className="font-medium text-slate-700">Business Hours: </span>
                  <span className="text-slate-600">
                    Mon – Fri: 08:00 – 17:00 | Sat: 09:00 – 13:00
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* FAQ Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle size={20} />
                Frequently Asked Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion items={faqData} />
            </CardContent>
          </Card>
        </div>
        
        {/* Right Column - Report Issue */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Report an Issue</CardTitle>
              <p className="text-sm text-slate-500 mt-1">
                Describe your issue and we'll get back to you within 24 hours
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitIssue} className="space-y-4">
                <Select
                  label="Issue Type"
                  options={issueTypes}
                  value={issueForm.type}
                  onChange={(e) => setIssueForm(prev => ({ ...prev, type: e.target.value }))}
                  required
                />
                
                {recentBookings.length > 0 && (
                  <Select
                    label="Related Booking (optional)"
                    options={[{ value: '', label: 'Select a booking...' }, ...recentBookings]}
                    value={issueForm.bookingId}
                    onChange={(e) => setIssueForm(prev => ({ ...prev, bookingId: e.target.value }))}
                  />
                )}
                
                <Input
                  label="Subject"
                  placeholder="Brief description of the issue"
                  value={issueForm.subject}
                  onChange={(e) => setIssueForm(prev => ({ ...prev, subject: e.target.value }))}
                  required
                />
                
                <Textarea
                  label="Description"
                  placeholder="Please provide as much detail as possible..."
                  value={issueForm.description}
                  onChange={(e) => setIssueForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={5}
                  required
                />
                
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-slate-300 transition-colors cursor-pointer">
                  <Upload size={24} className="mx-auto text-slate-400 mb-2" />
                  <p className="text-sm text-slate-600">
                    Drag & drop files here or <span className="text-primary-600">browse</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Max 5 files, 10MB each
                  </p>
                </div>
                
                <Button type="submit" className="w-full" loading={loading}>
                  <Send size={16} />
                  Submit Issue
                </Button>
              </form>
            </CardContent>
          </Card>
          
          {/* Quick Tips */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">Quick Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                  1
                </span>
                <p className="text-sm text-slate-600">
                  Check the FAQ section first – your question might already be answered
                </p>
              </div>
              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                  2
                </span>
                <p className="text-sm text-slate-600">
                  Include your booking ID when reporting issues for faster resolution
                </p>
              </div>
              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                  3
                </span>
                <p className="text-sm text-slate-600">
                  For urgent matters, WhatsApp is the fastest way to reach us
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Support;

