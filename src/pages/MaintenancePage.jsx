import { Hammer, Mail } from "lucide-react";
import { useSettingsStore } from "../store/useSettingsStore";

const MaintenancePage = () => {
  const { settings } = useSettingsStore();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6 animate-fade-in text-gray-900">
        <div className="w-20 h-20 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-8 animate-bounce">
          <Hammer size={40} className="text-primary-600" />
        </div>

        <h1 className="text-3xl font-bold leading-tight">Under Maintenance</h1>

        <p className="text-gray-600 text-lg leading-relaxed">
          We're currently performing some essential updates to the platform.
          We'll be back online shortly!
        </p>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center gap-3 text-left text-sm text-gray-500">
            <Mail size={16} className="text-gray-400" />
            <span>
              Need urgent support?{" "}
              <a
                href={`mailto:${settings?.supportEmail}`}
                className="text-primary-600 font-medium"
              >
                {settings?.supportEmail}
              </a>
            </span>
          </div>
        </div>

        <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">
          AutoScreen Platform
        </p>
      </div>
    </div>
  );
};

export default MaintenancePage;
