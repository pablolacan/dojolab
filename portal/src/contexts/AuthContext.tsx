import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { getApiClient } from '../utils/api-client';
import type { AuthState, DirectusUser, LoginCredentials, AuthTokens } from '../types';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  refreshToken: () => Promise<void>;
  getTokenTimeRemaining: () => number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: DirectusUser; tokens: AuthTokens } }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'TOKEN_REFRESHED'; payload: AuthTokens };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, isLoading: true };
    case 'AUTH_SUCCESS':
      return {
        user: action.payload.user,
        tokens: action.payload.tokens,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'AUTH_FAILURE':
      return {
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'AUTH_LOGOUT':
      return {
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'TOKEN_REFRESHED':
      return {
        ...state,
        tokens: action.payload,
        isAuthenticated: true
      };
    default:
      return state;
  }
};

const initialState: AuthState = {
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: true,
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Obtener AuthService una vez al inicio
  const getAuthService = () => {
    const apiClient = getApiClient();
    return apiClient.getAuthService();
  };

  /**
   * Iniciar sesión usando AuthService
   */
  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      const authService = getAuthService();
      const { user, tokens } = await authService.login(credentials);
      
      dispatch({ 
        type: 'AUTH_SUCCESS', 
        payload: { user, tokens } 
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error de autenticación';
      dispatch({ type: 'AUTH_FAILURE', payload: message });
      throw error;
    }
  };

  /**
   * Cerrar sesión usando AuthService
   */
  const logout = async (): Promise<void> => {
    try {
      const authService = getAuthService();
      await authService.logout();
    } catch (error) {
      console.warn('Error during logout:', error);
    } finally {
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  };

  /**
   * Refrescar token manualmente
   */
  const refreshToken = async (): Promise<void> => {
    try {
      const authService = getAuthService();
      const newTokens = await authService.refreshAccessToken();
      
      dispatch({ 
        type: 'TOKEN_REFRESHED', 
        payload: newTokens 
      });
    } catch (error) {
      console.error('Error refreshing token:', error);
      dispatch({ type: 'AUTH_LOGOUT' });
      throw error;
    }
  };

  /**
   * Obtener tiempo restante del token
   */
  const getTokenTimeRemaining = (): number => {
    try {
      const authService = getAuthService();
      const tokenStatus = authService.getTokenStatus();
      return tokenStatus.timeRemaining;
    } catch (error) {
      return 0;
    }
  };

  /**
   * Verificar autenticación usando AuthService
   * ✅ Ahora mucho más simple - delegamos la lógica compleja al AuthService
   */
  const checkAuth = async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const authService = getAuthService();
      
      // ✅ Una sola llamada que maneja todo:
      // - Verificación de tokens
      // - Reload de tokens
      // - Refresh automático si es necesario
      // - Obtención de usuario
      // - Validación de permisos de admin
      const { user, isValid } = await authService.checkAuthentication();
      
      if (isValid && user) {
        // Crear tokens mock para mantener compatibilidad con el estado
        const tokenManager = getApiClient().getApiFactory().getUtility('tokenManager');
        const mockTokens: AuthTokens = {
          access_token: tokenManager.getAccessToken() || '',
          expires: tokenManager.getTokenTimeRemaining() * 60 * 1000, // convertir a ms
          refresh_token: tokenManager.getRefreshToken() || ''
        };

        dispatch({ 
          type: 'AUTH_SUCCESS', 
          payload: { user, tokens: mockTokens } 
        });
      } else {
        dispatch({ type: 'AUTH_LOGOUT' });
      }
    } catch (error) {
      console.error('Error in checkAuth:', error);
      dispatch({ type: 'AUTH_LOGOUT' });
      
      // Si el error es de permisos, lo propagamos para mostrar mensaje específico
      if (error instanceof Error && error.message.includes('Administrator permissions required')) {
        throw error;
      }
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  /**
   * Configurar auto-refresh y verificación inicial
   */
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Configurar auto-refresh de tokens
        const authService = getAuthService();
        authService.startTokenAutoRefresh();
        
        // Verificar autenticación inicial
        if (mounted) {
          await checkAuth();
        }
      } catch (error) {
        if (mounted) {
          console.error('Error during auth initialization:', error);
          dispatch({ type: 'AUTH_LOGOUT' });
        }
      }
    };

    initializeAuth();

    // Cleanup
    return () => {
      mounted = false;
    };
  }, []);

  /**
   * Escuchar cambios de visibilidad para re-verificar auth
   */
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && state.isAuthenticated) {
        try {
          // Re-verificar autenticación cuando el usuario regresa a la pestaña
          const authService = getAuthService();
          const tokenStatus = authService.getTokenStatus();
          
          // Si el token está próximo a expirar, refrescarlo
          if (tokenStatus.timeRemaining < 5) { // Menos de 5 minutos
            await refreshToken();
          }
        } catch (error) {
          console.warn('Error re-checking auth on visibility change:', error);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [state.isAuthenticated]);

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    checkAuth,
    refreshToken,
    getTokenTimeRemaining,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};