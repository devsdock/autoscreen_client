import { Shield } from "lucide-react";

const Insurance = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
          Insurance
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Manage your insurance claims and policies
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 shadow-sm border border-slate-100 dark:border-slate-800 text-center">
        <div className="w-16 h-16 mx-auto bg-primary-50 dark:bg-primary-900/20 rounded-2xl flex items-center justify-center mb-4">
          <Shield size={32} className="text-primary-600 dark:text-primary-400" />
        </div>
        <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
          Coming Soon
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto">
          Insurance integration is on the way. You'll be able to submit and track insurance claims directly from here.
        </p>
      </div>
    </div>
  );
};

export default Insurance;
