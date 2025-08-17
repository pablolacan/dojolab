import { useState, useEffect } from 'react';
import { usePWA } from '../hooks/usePWA';

export const PWABanner = () => {
  const { isInstallable, isInstalled, isOnline, hasUpdate, install, skipWaiting } = usePWA();
  const [showBanner, setShowBanner] = useState(false);
  const [bannerType, setBannerType] = useState<'install' | 'update' | 'offline'>('install');

  useEffect(() => {
    if (hasUpdate) {
      setBannerType('update');
      setShowBanner(true);
    } else if (isInstallable && !isInstalled) {
      setBannerType('install');
      setShowBanner(true);
    } else if (!isOnline) {
      setBannerType('offline');
      setShowBanner(true);
    } else {
      setShowBanner(false);
    }
  }, [isInstallable, isInstalled, isOnline, hasUpdate]);

  const handleInstall = async () => {
    const success = await install();
    if (success) {
      setShowBanner(false);
    }
  };

  const handleUpdate = () => {
    skipWaiting();
    setShowBanner(false);
  };

  const handleDismiss = () => {
    setShowBanner(false);
  };

  if (!showBanner) return null;

  const bannerConfig = {
    install: {
      icon: '📱',
      title: 'Instalar Aplicación',
      message: 'Instala The Dojo Lab para acceso rápido y experiencia mejorada',
      actionText: 'Instalar',
      onAction: handleInstall,
      bgColor: 'bg-[#c9f31d]',
      textColor: 'text-gray-900'
    },
    update: {
      icon: '🔄',
      title: 'Actualización Disponible',
      message: 'Nueva versión disponible con mejoras y correcciones',
      actionText: 'Actualizar',
      onAction: handleUpdate,
      bgColor: 'bg-blue-500',
      textColor: 'text-white'
    },
    offline: {
      icon: '📡',
      title: 'Modo Offline',
      message: 'Sin conexión a internet. Funcionalidad limitada disponible',
      actionText: 'Entendido',
      onAction: handleDismiss,
      bgColor: 'bg-orange-500',
      textColor: 'text-white'
    }
  };

  const config = bannerConfig[bannerType];

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 ${config.bgColor} ${config.textColor} shadow-lg`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center space-x-3">
            <span className="text-xl" role="img" aria-label={bannerType}>
              {config.icon}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">
                {config.title}
              </p>
              <p className="text-sm opacity-90">
                {config.message}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={config.onAction}
              className={`
                px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
                ${bannerType === 'install' 
                  ? 'bg-gray-900 text-white hover:bg-gray-800' 
                  : 'bg-white bg-opacity-20 hover:bg-opacity-30'
                }
              `}
            >
              {config.actionText}
            </button>
            
            {bannerType !== 'offline' && (
              <button
                onClick={handleDismiss}
                className="p-2 rounded-lg hover:bg-black hover:bg-opacity-10 transition-colors"
                aria-label="Cerrar banner"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};