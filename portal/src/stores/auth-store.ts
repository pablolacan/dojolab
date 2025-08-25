import React from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { auth, session, type DirectusUser, type LoginCredentials } from '../lib';

// Estados posibles de autenticación
type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated' | 'error';

// Interface principal del store
interface AuthState {
  // Estado básico
  user: DirectusUser | null;
  status: AuthStatus;
  error: string | null;
  
  // Estados de carga
  isLoading: boolean;
  isInitialized: boolean;
  
  // Acciones principales
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  
  // Acciones de estado
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  
  // Inicialización
  initialize: () => Promise<void>;
  
  // Helpers
  isAuthenticated: () => boolean;
  hasRole: (roleName: string) => boolean;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      user: null,
      status: 'idle',
      error: null,
      isLoading: false,
      isInitialized: false,

      /**
       * Login de usuario
       */
      login: async (credentials: LoginCredentials) => {
        set({ status: 'loading', isLoading: true, error: null });
        
        try {
          console.log('🔐 Starting login process...');
          
          const result = await auth.login(credentials);
          
          if (result.success && result.data) {
            // Inicializar sesión
            session.initialize();
            
            // Actualizar estado
            set({ 
              user: result.data,
              status: 'authenticated',
              isLoading: false,
              error: null
            });
            
            console.log('✅ Login successful:', result.data.email);
            return true;
          } else {
            // Error de login
            set({ 
              user: null,
              status: 'unauthenticated',
              isLoading: false,
              error: result.error || 'Login failed'
            });
            
            console.log('❌ Login failed:', result.error);
            return false;
          }
        } catch (error: any) {
          console.error('❌ Login error:', error);
          
          set({ 
            user: null,
            status: 'error',
            isLoading: false,
            error: error.message || 'Login failed'
          });
          
          return false;
        }
      },

      /**
       * Logout de usuario
       */
      logout: async () => {
        set({ isLoading: true });
        
        try {
          console.log('🚪 Starting logout process...');
          
          // Logout en Directus
          await auth.logout();
          
          // Limpiar sesión local
          session.clear();
          
          // Limpiar estado
          set({ 
            user: null,
            status: 'unauthenticated',
            isLoading: false,
            error: null
          });
          
          console.log('✅ Logout successful');
        } catch (error: any) {
          console.error('❌ Logout error:', error);
          
          // Aún así limpiamos el estado local
          session.clear();
          set({ 
            user: null,
            status: 'unauthenticated',
            isLoading: false,
            error: null
          });
        }
      },

      /**
       * Refrescar datos del usuario actual
       */
      refreshUser: async () => {
        const currentStatus = get().status;
        
        // Solo refrescar si ya estamos autenticados
        if (currentStatus !== 'authenticated') return;
        
        try {
          console.log('🔄 Refreshing user data...');
          
          const result = await auth.getCurrentUser();
          
          if (result.success && result.data) {
            set({ 
              user: result.data,
              error: null
            });
            
            console.log('✅ User data refreshed');
          } else {
            console.log('❌ Failed to refresh user data');
            // Si falla, mejor hacer logout
            get().logout();
          }
        } catch (error: any) {
          console.error('❌ Refresh user error:', error);
          // Si falla, mejor hacer logout
          get().logout();
        }
      },

      /**
       * Limpiar errores
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Establecer estado de carga
       */
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      /**
       * Inicializar store (verificar sesión existente)
       */
      initialize: async () => {
        if (get().isInitialized) return;
        
        set({ isLoading: true });
        
        try {
          console.log('🚀 Initializing auth store...');
          
          // Verificar si hay sesión válida
          const isAuthenticated = await auth.isAuthenticated();
          
          if (isAuthenticated) {
            // Verificar si la sesión local no ha expirado
            if (!session.isExpired()) {
              // Obtener datos del usuario
              const result = await auth.getCurrentUser();
              
              if (result.success && result.data) {
                set({ 
                  user: result.data,
                  status: 'authenticated',
                  isLoading: false,
                  isInitialized: true,
                  error: null
                });
                
                console.log('✅ Session restored:', result.data.email);
                return;
              }
            } else {
              console.log('⏰ Local session expired');
            }
          }
          
          // No hay sesión válida
          session.clear();
          set({ 
            user: null,
            status: 'unauthenticated',
            isLoading: false,
            isInitialized: true,
            error: null
          });
          
          console.log('ℹ️ No valid session found');
          
        } catch (error: any) {
          console.error('❌ Auth initialization error:', error);
          
          session.clear();
          set({ 
            user: null,
            status: 'error',
            isLoading: false,
            isInitialized: true,
            error: error.message || 'Initialization failed'
          });
        }
      },

      /**
       * Verificar si el usuario está autenticado
       */
      isAuthenticated: () => {
        const state = get();
        return state.status === 'authenticated' && state.user !== null;
      },

      /**
       * Verificar si el usuario tiene un rol específico
       */
      hasRole: (roleName: string) => {
        const state = get();
        if (!state.user || !state.user.role) return false;
        
        // Si role es string (ID), no podemos verificar por nombre
        if (typeof state.user.role === 'string') {
          console.warn('Cannot check role by name, role is stored as ID');
          return false;
        }
        
        return state.user.role.name === roleName;
      },

      /**
       * Verificar si el usuario es administrador
       */
      isAdmin: () => {
        const state = get();
        if (!state.user || !state.user.role) return false;
        
        // Si role es string (ID), no podemos verificar admin access
        if (typeof state.user.role === 'string') {
          console.warn('Cannot check admin access, role is stored as ID');
          return false;
        }
        
        return state.user.role.admin_access === true;
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      
      // Solo persistir datos esenciales
      partialize: (state) => ({
        user: state.user,
        status: state.status,
        isInitialized: state.isInitialized
      }),
      
      // Función de rehydration
      onRehydrateStorage: () => (state) => {
        if (state) {
          console.log('🔄 Auth state rehydrated');
          
          // Verificar integridad de la sesión al cargar
          if (state.status === 'authenticated' && session.isExpired()) {
            console.log('⏰ Stored session is expired, clearing...');
            state.logout();
          }
        }
      }
    }
  )
);

// Hook personalizado para facilitar el uso
export const useAuth = () => {
  const store = useAuthStore();
  
  // Auto-inicializar en el primer uso
  React.useEffect(() => {
    if (!store.isInitialized) {
      store.initialize();
    }
  }, [store.isInitialized]);
  
  return store;
};

// Selector hooks para evitar re-renders innecesarios
export const useAuthUser = () => useAuthStore(state => state.user);
export const useAuthStatus = () => useAuthStore(state => state.status);
export const useAuthError = () => useAuthStore(state => state.error);
export const useAuthLoading = () => useAuthStore(state => state.isLoading);

// Helper hook para auth state
export const useIsAuthenticated = () => useAuthStore(state => state.isAuthenticated());
export const useIsAdmin = () => useAuthStore(state => state.isAdmin());