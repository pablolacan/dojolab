import { useState } from "react";
import { MaintenanceMode } from "./components/MaintenanceMode";
import { Login } from "./components/Login";
import { Layout } from "./components/layout/Layout";
import { DashboardView } from "./components/views/DashboardView";
import { SubscriptionsView } from "./components/views/SubscriptionsView";
import { DomainsView } from "./components/views/DomainView";
import { ClientsView } from "./components/views/ClientsView";
import { InvoicesView } from "./components/views/InvoicesView";
import { PWABanner } from "./components/PWABanner";
import { createApiClient } from "./utils/api-client";
import { config } from "./utils/config";

// API CLIENT
createApiClient(config.directusUrl);

// Componentes que usan el API client
import { useMaintenance } from "./hooks/useMaintenance";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

const DashboardContent = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { 
    maintenanceData, 
    shouldShowMaintenance, 
    isAllowedIP,
    userIP,
    loading: maintenanceLoading, 
    error: maintenanceError  } = useMaintenance();
  const [activeView, setActiveView] = useState('home');

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
      case 'domains':
        return <DomainsView />;
      case 'clients':
        return <ClientsView />;
      case 'invoices':
        return <InvoicesView />;
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