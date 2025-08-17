import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  hasUpdate: boolean;
}

interface PWAActions {
  install: () => Promise<boolean>;
  checkForUpdates: () => void;
  skipWaiting: () => void;
}

export function usePWA(): PWAState & PWAActions {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      localStorage.removeItem('pwa-install-dismissed');
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Detectar si ya está instalada
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isFullscreen = window.matchMedia('(display-mode: fullscreen)').matches;
    const isPWAMode = isStandalone || isFullscreen || (window.navigator as any).standalone === true;
    
    setIsInstalled(isPWAMode);

    if ('serviceWorker' in navigator) {
      // Registrar el Service Worker después de que la página cargue completamente
      if (document.readyState === 'complete') {
        setTimeout(registerServiceWorker, 1000);
      } else {
        window.addEventListener('load', () => {
          setTimeout(registerServiceWorker, 1000);
        });
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const registerServiceWorker = async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      setRegistration(reg);

      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setHasUpdate(true);
            }
          });
        }
      });

      // Solo recargar si el usuario acepta la actualización
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing && sessionStorage.getItem('sw-skip-waiting') === 'true') {
          refreshing = true;
          sessionStorage.removeItem('sw-skip-waiting');
          window.location.reload();
        }
      });

    } catch (error) {
      console.error('❌ Error registrando Service Worker:', error);
    }
  };

  const install = async (): Promise<boolean> => {
    if (!installPrompt) return false;

    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setInstallPrompt(null);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error instalando PWA:', error);
      return false;
    }
  };

  const checkForUpdates = () => {
    if (registration) {
      registration.update();
    }
  };

  const skipWaiting = () => {
    if (registration && registration.waiting) {
      sessionStorage.setItem('sw-skip-waiting', 'true');
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      setHasUpdate(false);
    }
  };

  return {
    isInstallable: !!installPrompt,
    isInstalled,
    isOnline,
    hasUpdate,
    install,
    checkForUpdates,
    skipWaiting
  };
}