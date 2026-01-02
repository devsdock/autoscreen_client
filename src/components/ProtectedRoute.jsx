import { useEffect, useState } from 'react'
import useAuthStore from '../store/useAuthStore'
import useDashboardStore from '../store/useDashboardStore'
import { AUTH_WEB_URL, STORAGE_KEYS } from '../services/api'


/**
 * Protected Route wrapper component
 * Ensures user is authenticated before rendering children
 * Redirects to login if not authenticated
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading, initAuth, setAuth, user: currentUser } = useAuthStore()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('[ProtectedRoute] Starting auth check...');
        
        // First, check if auth data is passed in URL (from cross-port redirect)
        const urlParams = new URLSearchParams(window.location.search)
        const authDataStr = urlParams.get('authData')
        
        if (authDataStr) {
          try {
            const authData = JSON.parse(decodeURIComponent(authDataStr))
            console.log('[ProtectedRoute] Found auth data in URL:', authData)
            
            if (authData.token && authData.user) {
              // 1. Check if this is a DIFFERENT user than before (by comparing to localStorage, not store)
              // This prevents false "new user" detection when the persist middleware hasn't hydrated yet
              const storedUserStr = localStorage.getItem(STORAGE_KEYS.USER);
              let storedUser = null;
              try {
                storedUser = storedUserStr ? JSON.parse(storedUserStr) : null;
              } catch (e) {
                console.error('[ProtectedRoute] Failed to parse stored user:', e);
              }

              // Only clear dashboard if the user ID has ACTUALLY changed
              const isDifferentUser = storedUser && (
                (storedUser.id && authData.user.id && storedUser.id !== authData.user.id) ||
                (storedUser._id && authData.user._id && storedUser._id !== authData.user._id)
              );

              if (isDifferentUser) {
                console.log('[ProtectedRoute] Different user detected, clearing stale dashboard data...');
                const dashboardStore = useDashboardStore.getState();
                dashboardStore.clearData();
              }

              // 2. Store in localStorage for this domain
              localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, authData.token)
              localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(authData.user))
              
              // 3. Clean the URL
              try {
                const url = new URL(window.location.href)
                url.searchParams.delete('authData')
                window.history.replaceState({}, document.title, url.pathname + url.search)
              } catch (e) {
                console.error('[ProtectedRoute] URL cleanup failed:', e)
              }

              // 4. Update the auth store immediately
              setAuth(authData.token, authData.user)
              setChecking(false)
              return
            }
          } catch (e) {
            console.error('[ProtectedRoute] Failed to parse auth data from URL:', e)
          }
        }
        
        // 4. Fallback: check if token exists in localStorage
        const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
        console.log('[ProtectedRoute] Token in localStorage:', !!token)
        
        if (!token) {
          console.log('[ProtectedRoute] No token found, redirecting to login')
          window.location.href = `${AUTH_WEB_URL}/auth`
          return
        }
        
        // 5. Token exists, initialize auth store (validates session if needed)
        console.log('[ProtectedRoute] Token found, initializing auth store...')
        await initAuth()
        setChecking(false)
      } catch (error) {
        console.error('[ProtectedRoute] Critical error during auth check:', error)
        // If everything fails, redirect to login
        window.location.href = `${AUTH_WEB_URL}/auth`
      }
    }
    
    checkAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Show loading state while checking auth
  if (checking || isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if still not authenticated after check
  if (!isAuthenticated) {
    console.log('[ProtectedRoute] Not authenticated after check, redirecting to login')
    // Show a small loader while the browser triggers the jump
    setTimeout(() => {
      window.location.href = `${AUTH_WEB_URL}/auth`
    }, 0);
    
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  console.log('[ProtectedRoute] Authenticated, rendering children')
  // User is authenticated, render children
  return children
}

export default ProtectedRoute
