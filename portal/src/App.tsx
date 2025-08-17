import { useEffect, useState } from "react";
import { MaintenanceMode } from "./components/MaintenanceMode";
import { Login } from "./components/Login";
import { Layout } from "./components/layout/Layout";
import { DashboardView } from "./components/views/DashboardView";
import { SubscriptionsView } from "./components/views/SubscriptionsView";
import { PWABanner } from "./components/PWABanner";
import { useMaintenance } from "./hooks/useMaintenance";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { createApiClient } from "./utils/api-client";
import { config } from "./utils/config";

createApiClient(config.directusUrl);

const DashboardContent = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { 
    maintenanceData, 
    shouldShowMaintenance, 
    isAllowedIP,
    userIP,
    loading: maintenanceLoading, 
    error: maintenanceError,
    debugInfo 
  } = useMaintenance();
  const [activeView, setActiveView] = useState('home');

  useEffect(() => {
    if (config.isDevelopment && isAuthenticated) {
      console.log('🚀 Dashboard iniciado', {
        apiUrl: config.directusUrl,
        version: config.appVersion,
        user: user?.email,
        shouldShowMaintenance,
        isAllowedIP,
        userIP
      });
    }
  }, [shouldShowMaintenance, isAuthenticated, user, isAllowedIP, userIP]);

  useEffect(() => {
    if (config.isDevelopment) {
      (window as any).maintenanceDebug = debugInfo;
      console.log('🔧 Para debug de mantenimiento, ejecuta: window.maintenanceDebug()');
    }
  }, [debugInfo]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-[#c9f31d] rounded-full animate-spin"></div>
          <p className="text-gray-600 text-sm">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (maintenanceLoading) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-8 h-8 border-2 border-gray-200 border-t-[#c9f31d] rounded-full animate-spin"></div>
            <p className="text-gray-600 text-sm">Verificando estado del sistema...</p>
          </div>
        </div>
      );
    }

    if (shouldShowMaintenance && maintenanceData) {
      return <MaintenanceMode data={maintenanceData} />;
    }

    return (
      <>
        <PWABanner />
        <Login />
      </>
    );
  }

  if (maintenanceLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-[#c9f31d] rounded-full animate-spin"></div>
          <p className="text-gray-600 text-sm">Verificando estado del sistema...</p>
        </div>
      </div>
    );
  }

  if (maintenanceError) {
    console.warn('⚠️ Error verificando mantenimiento:', maintenanceError);
  }

  if (shouldShowMaintenance && maintenanceData) {
    return <MaintenanceMode data={maintenanceData} userIP={userIP} isAllowedIP={isAllowedIP} />;
  }

  const getPageTitle = () => {
    const titles = {
      home: 'Dashboard',
      subscriptions: 'Suscripciones',
      maintenance: 'Modo Mantenimiento',
      settings: 'Configuración'
    };
    return titles[activeView as keyof typeof titles] || 'Dashboard';
  };

  const renderActiveView = () => {
    switch (activeView) {
      case 'home':
        return <DashboardView user={user} />;
      case 'subscriptions':
        return <SubscriptionsView />;
      case 'maintenance':
        return (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Modo Mantenimiento</h2>
            <p className="text-gray-600">Gestión del modo mantenimiento en desarrollo...</p>
            {config.isDevelopment && (
              <div className="mt-6 p-4 bg-gray-100 rounded-2xl text-left max-w-md mx-auto">
                <h3 className="font-semibold mb-2">Debug Info:</h3>
                <p className="text-sm text-gray-600">Tu IP: {userIP}</p>
                <p className="text-sm text-gray-600">¿IP Permitida?: {isAllowedIP ? 'Sí' : 'No'}</p>
                <p className="text-sm text-gray-600">¿Mostrar Mantenimiento?: {shouldShowMaintenance ? 'Sí' : 'No'}</p>
                <button 
                  onClick={() => debugInfo().then(console.table)}
                  className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-xs"
                >
                  Ver Debug Completo
                </button>
              </div>
            )}
          </div>
        );
      case 'settings':
        return (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Configuración</h2>
            <p className="text-gray-600">Panel de configuración en desarrollo...</p>
          </div>
        );
      default:
        return <DashboardView user={user} />;
    }
  };

  return (
    <>
      <PWABanner />
      <Layout
        activeView={activeView}
        onViewChange={setActiveView}
        title={getPageTitle()}
      >
        {renderActiveView()}
      </Layout>
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <DashboardContent />
    </AuthProvider>
  );
}

export default App;