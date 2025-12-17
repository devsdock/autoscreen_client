import { Users, DollarSign, ShoppingCart, Activity, Clock } from 'lucide-react'
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card'

const stats = [
  { label: 'Total Users', value: '2,543', icon: Users, change: '+12%', color: 'bg-blue-500' },
  { label: 'Revenue', value: '$45,231', icon: DollarSign, change: '+8%', color: 'bg-emerald-500' },
  { label: 'Orders', value: '1,234', icon: ShoppingCart, change: '+23%', color: 'bg-violet-500' },
  { label: 'Active Now', value: '573', icon: Activity, change: '+4%', color: 'bg-amber-500' },
]

const recentActivity = [
  { id: 1, action: 'New user registered', user: 'John Doe', time: '2 minutes ago' },
  { id: 2, action: 'Order #1234 completed', user: 'Jane Smith', time: '15 minutes ago' },
  { id: 3, action: 'Payment received', user: 'Bob Wilson', time: '1 hour ago' },
  { id: 4, action: 'New user registered', user: 'Alice Brown', time: '2 hours ago' },
  { id: 5, action: 'Settings updated', user: 'Admin User', time: '3 hours ago' },
]

const Dashboard = () => {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome back, Admin!</h1>
        <p className="text-slate-500 mt-1">{today}</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, change, color }) => (
          <Card key={label}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{label}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
                <p className="text-sm text-emerald-600 mt-1">{change} from last month</p>
              </div>
              <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center`}>
                <Icon size={24} className="text-white" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Recent activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-slate-100">
            {recentActivity.map(({ id, action, user, time }) => (
              <li key={id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                    <Activity size={14} className="text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{action}</p>
                    <p className="text-xs text-slate-500">by {user}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <Clock size={12} />
                  <span>{time}</span>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

export default Dashboard

