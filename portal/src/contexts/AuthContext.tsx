import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { getApiClient } from '../utils/api-client';
import type { AuthState, DirectusUser, LoginCredentials, AuthTokens } from '../types';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: DirectusUser; tokens: AuthTokens } }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean };

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

  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      const apiClient = getApiClient();
      const { user, tokens } = await apiClient.login(credentials);
      
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

  const logout = async (): Promise<void> => {
    try {
      const apiClient = getApiClient();
      await apiClient.logout();
    } catch (error) {
      console.warn('Error during logout:', error);
    } finally {
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  };

  const checkAuth = async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const apiClient = getApiClient();
      
      // Verificar tokens almacenados
      const storedAccessToken = localStorage.getItem('directus_access_token');
      const storedRefreshToken = localStorage.getItem('directus_refresh_token');
      
      if (!storedAccessToken || !storedRefreshToken) {
        dispatch({ type: 'AUTH_LOGOUT' });
        return;
      }

      // Verificar que el ApiClient tenga los tokens cargados
      const apiClientStatus = apiClient.getTokenStatus();
      if (!apiClientStatus.hasAccessToken || !apiClientStatus.hasRefreshToken) {
        apiClient.reloadTokens();
      }

      try {
        const user = await apiClient.getCurrentUser();
        
        // Verificar permisos de admin
        let isAdmin = false;
        
        if (typeof user.role === 'object') {
          const adminChecks = [
            user.role.admin_access === true,
            user.role.name?.toLowerCase().includes('administrator'),
            user.role.name?.toLowerCase().includes('admin'),
            user.role.description?.includes('admin'),
            user.role.id === '7690c14b-4036-4cf9-9af7-9b3215a6cf58'
          ];
          
          isAdmin = adminChecks.some(check => check);
        } else if (typeof user.role === 'string') {
          isAdmin = user.role === '7690c14b-4036-4cf9-9af7-9b3215a6cf58';
        }
        
        if (!isAdmin) {
          await logout();
          throw new Error('Acceso denegado: Se requieren permisos de administrador');
        }

        dispatch({ 
          type: 'AUTH_SUCCESS', 
          payload: { 
            user, 
            tokens: { 
              access_token: apiClient.getAccessToken() || '', 
              expires: 0, 
              refresh_token: '' 
            } 
          } 
        });
      } catch (authError) {
        apiClient.clearTokens();
        dispatch({ type: 'AUTH_LOGOUT' });
      }
    } catch (error) {
      console.error('Error in checkAuth:', error);
      dispatch({ type: 'AUTH_LOGOUT' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Verificar autenticación al montar el componente
  useEffect(() => {
    checkAuth();
  }, []);

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    checkAuth,
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