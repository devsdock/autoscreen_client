import { User } from 'lucide-react'
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import Button from '../components/ui/Button'
import useStore from '../store/useStore'

const Toggle = ({ enabled, onChange, label, description }) => (
  <div className="flex items-center justify-between py-4 border-b border-slate-100 last:border-0">
    <div>
      <p className="text-sm font-medium text-slate-900">{label}</p>
      <p className="text-sm text-slate-500">{description}</p>
    </div>
    <button
      onClick={onChange}
      className={`
        relative w-11 h-6 rounded-full transition-colors duration-200
        ${enabled ? 'bg-blue-600' : 'bg-slate-200'}
      `}
    >
      <span
        className={`
          absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow
          transition-transform duration-200
          ${enabled ? 'translate-x-5' : 'translate-x-0'}
        `}
      />
    </button>
  </div>
)

const Settings = () => {
  const { user, darkMode, notifications, emailUpdates, toggleDarkMode, toggleNotifications, toggleEmailUpdates } = useStore()

  const handleSave = () => {
    alert('Settings saved successfully!')
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1">Manage your account settings and preferences</p>
      </div>

      {/* Profile section */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center">
              <User size={32} className="text-slate-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{user.name}</h3>
              <p className="text-sm text-slate-500">{user.email}</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Display Name
              </label>
              <input
                type="text"
                defaultValue={user.name}
                className="
                  w-full px-3 py-2
                  bg-white border border-slate-200 rounded-lg
                  text-sm text-slate-900
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  transition-all duration-200
                "
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                defaultValue={user.email}
                className="
                  w-full px-3 py-2
                  bg-white border border-slate-200 rounded-lg
                  text-sm text-slate-900
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  transition-all duration-200
                "
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preferences section */}
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <Toggle
            enabled={darkMode}
            onChange={toggleDarkMode}
            label="Dark Mode"
            description="Switch between light and dark themes"
          />
          <Toggle
            enabled={notifications}
            onChange={toggleNotifications}
            label="Push Notifications"
            description="Receive push notifications for important updates"
          />
          <Toggle
            enabled={emailUpdates}
            onChange={toggleEmailUpdates}
            label="Email Updates"
            description="Receive weekly email digests and updates"
          />
        </CardContent>
      </Card>

      {/* Save button */}
      <div className="flex justify-end">
        <Button onClick={handleSave}>
          Save Changes
        </Button>
      </div>
    </div>
  )
}

export default Settings

