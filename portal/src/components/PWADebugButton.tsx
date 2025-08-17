import { usePWA } from '../hooks/usePWA';
import { config } from '../utils/config';

export const PWADebugButton = () => {
  const { isInstallable, isInstalled, isOnline, hasUpdate, install, checkForUpdates } = usePWA();

  // Solo mostrar en desarrollo
  if (!config.isDevelopment) return null;

  const handleResetBanner = () => {
    localStorage.removeItem('pwa-install-dismissed');
    window.location.reload();
  };

  const handleDebugInfo = () => {
    const swState = navigator.serviceWorker.controller ? 'Activo' : 'Inactivo';
    const beforeInstallPrompt = (window as any).beforeInstallPromptEvent ? 'Disponible' : 'No disponible';
    
    console.table({
      'Es Instalable': isInstallable,
      'Está Instalada': isInstalled,
      'Está Online': isOnline,
      'Tiene Actualización': hasUpdate,
      'Banner Descartado': localStorage.getItem('pwa-install-dismissed') === 'true',
      'Display Mode': window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser',
      'Navigator Standalone': (window.navigator as any).standalone || false,
      'Service Worker': swState,
      'Install Prompt': beforeInstallPrompt,
      'User Agent': navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Otro'
    });
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      <div className="bg-gray-900 text-white p-3 rounded-xl shadow-lg text-xs space-y-2">
        <div className="font-semibold">🔧 PWA Debug</div>
        
        <div className="space-y-1">
          <div>Instalable: {isInstallable ? '✅' : '❌'}</div>
          <div>Instalada: {isInstalled ? '✅' : '❌'}</div>
          <div>Online: {isOnline ? '✅' : '❌'}</div>
          <div>Actualización: {hasUpdate ? '✅' : '❌'}</div>
        </div>

        <div className="space-y-1">
          <button
            onClick={handleDebugInfo}
            className="w-full px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs transition-colors"
          >
            Ver Info Completa
          </button>
          
          <button
            onClick={handleResetBanner}
            className="w-full px-2 py-1 bg-orange-600 hover:bg-orange-700 rounded text-xs transition-colors"
          >
            Reset Banner
          </button>

          {isInstallable && (
            <button
              onClick={install}
              className="w-full px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs transition-colors"
            >
              Forzar Instalación
            </button>
          )}

          <button
            onClick={checkForUpdates}
            className="w-full px-2 py-1 bg-purple-600 hover:bg-purple-700 rounded text-xs transition-colors"
          >
            Verificar Updates
          </button>
        </div>
      </div>
    </div>
  );
};