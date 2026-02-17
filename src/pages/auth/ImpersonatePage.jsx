import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import { STORAGE_KEYS } from '../../services/api';

const ImpersonatePage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { initAuth } = useAuthStore();
    const [error, setError] = useState(null);
    const token = searchParams.get('token');

    useEffect(() => {
        const handleImpersonation = async () => {
            if (!token) {
                setError("No token provided");
                setTimeout(() => window.location.href = "/", 2000);
                return;
            }

            try {
                // Clear existing session
                localStorage.removeItem(STORAGE_KEYS.USER);
                localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);

                // Initialize auth (this will fetch user profile)
                const success = await initAuth();

                if (success) {
                    // Redirect to dashboard
                    navigate("/dashboard");
                } else {
                    setError("Failed to verify token");
                    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
                    setTimeout(() => window.location.href = "/", 2000);
                }

            } catch (err) {
                console.error("Impersonation error", err);
                setError("Failed to login");
                setTimeout(() => window.location.href = "/", 2000);
            }
        };

        handleImpersonation();
    }, [token, navigate, initAuth]);

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-red-50">
                <div className="text-center p-8 bg-white rounded-lg shadow-lg">
                    <h2 className="text-2xl font-bold text-red-600 mb-2">Login Failed</h2>
                    <p className="text-gray-600">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-t-blue-600 border-blue-200 rounded-full animate-spin mx-auto mb-4"></div>
                <h2 className="text-xl font-semibold text-gray-800">Logging in as Customer...</h2>
                <p className="text-gray-500 mt-2">Please wait while we set up your session</p>
            </div>
        </div>
    );
};

export default ImpersonatePage;
