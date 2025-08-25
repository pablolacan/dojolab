import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

// Store
import { useAuth } from './stores/auth-store';

// Utils
import { maintenance } from './lib/utils/maintenance';
import { testConnection } from './lib/directus';

// Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Public Route Component (redirect if authenticated)
const PublicRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

// Dashboard placeholder component
const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold font-heading text-slate-900">
          Welcome to Dashboard!
        </h1>
        <p className="text-slate-600">
          Hello {user?.first_name || user?.email}!
        </p>
        <button
          onClick={logout}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

// Maintenance page
const MaintenancePage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold font-heading text-slate-900">
          🔧 Maintenance Mode
        </h1>
        <p className="text-slate-600 max-w-md">
          We're currently performing maintenance on our systems. 
          Please check back in a few minutes.
        </p>
      </div>
    </div>
  );
};

// Error boundary fallback
const ErrorFallback: React.FC<{ error: Error }> = ({ error }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold font-heading text-red-600">
          Something went wrong
        </h1>
        <p className="text-slate-600 max-w-md">
          {error.message || 'An unexpected error occurred'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Reload Page
        </button>
      </div>
    </div>
  );
};

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App Error Boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return <ErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}

// Main App Component
const App: React.FC = () => {
  const { initialize } = useAuth();
  const [, setConnectionStatus] = React.useState<{
    isConnected: boolean;
    isChecking: boolean;
  }>({
    isConnected: true,
    isChecking: true
  });

  // Initialize auth and check connection on app start
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 Initializing app...');
        
        // Check maintenance mode
        if (maintenance.isActive()) {
          console.log('🔧 Maintenance mode is active');
          // In a real app, you'd check IP here
          // For now, we'll just show maintenance page
        }
        
        // Test Directus connection
        const isConnected = await testConnection();
        setConnectionStatus({ isConnected, isChecking: false });
        
        if (isConnected) {
          // Initialize auth store
          await initialize();
        } else {
          console.error('❌ Failed to connect to Directus');
        }
        
      } catch (error) {
        console.error('❌ App initialization failed:', error);
        setConnectionStatus({ isConnected: false, isChecking: false });
      }
    };

    initializeApp();
  }, [initialize]);

  // Show maintenance page
  if (maintenance.isActive()) {
    return (
        <MaintenancePage />
    );
  }

  // Main app routes
  return (
    <ErrorBoundary>
      <BrowserRouter>
          <AnimatePresence mode="wait">
            <Routes>
              {/* Public routes */}
              <Route 
                path="/login" 
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                } 
              />
              
              {/* Protected routes */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              
              {/* Default redirect */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              {/* 404 fallback */}
              <Route 
                path="*" 
                element={
                  <div className="min-h-screen flex items-center justify-center p-4">
                    <div className="text-center space-y-4">
                      <h1 className="text-3xl font-bold font-heading text-slate-900">
                        404 - Page Not Found
                      </h1>
                      <p className="text-slate-600">
                        The page you're looking for doesn't exist.
                      </p>
                      <a 
                        href="/dashboard"
                        className="inline-block px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        Go to Dashboard
                      </a>
                    </div>
                  </div>
                } 
              />
            </Routes>
          </AnimatePresence>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;