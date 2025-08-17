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
      
      console.log('🔄 Iniciando checkAuth...');
      
      const apiClient = getApiClient();
      
      // Debug: Log de tokens en localStorage
      const storedAccessToken = localStorage.getItem('directus_access_token');
      const storedRefreshToken = localStorage.getItem('directus_refresh_token');
      const storedExpiresAt = localStorage.getItem('directus_token_expires_at');
      
      console.log('🔍 Verificando tokens almacenados:', {
        hasAccessToken: !!storedAccessToken,
        hasRefreshToken: !!storedRefreshToken,
        expiresAt: storedExpiresAt,
        isExpired: storedExpiresAt ? Date.now() >= (parseInt(storedExpiresAt) - 60000) : true,
        currentTime: Date.now()
      });
      
      // Si no hay tokens guardados, logout
      if (!storedAccessToken || !storedRefreshToken) {
        console.log('❌ No hay tokens guardados');
        dispatch({ type: 'AUTH_LOGOUT' });
        return;
      }

      console.log('✅ Tokens encontrados en localStorage');
      
      // Verificar que el ApiClient también tenga los tokens cargados
      const apiClientStatus = apiClient.getTokenStatus();
      console.log('🔧 Estado del ApiClient:', apiClientStatus);
      
      // Si el ApiClient no tiene los tokens, forzar recarga
      if (!apiClientStatus.hasAccessToken || !apiClientStatus.hasRefreshToken) {
        console.log('⚠️ ApiClient no tiene tokens cargados, forzando recarga...');
        apiClient.reloadTokens();
        console.log('🔄 Tokens recargados, nuevo estado:', apiClient.getTokenStatus());
      }

      try {
        console.log('🌐 Intentando obtener usuario actual...');
        const user = await apiClient.getCurrentUser();
        
        console.log('✅ Usuario obtenido (RAW):', user);
        console.log('📧 Email:', user.email);
        console.log('🎭 Role completo:', user.role);
        
        // Verificar que el usuario sea admin
        let isAdmin = false;
        
        if (typeof user.role === 'object') {
          // Múltiples formas de detectar admin en Directus:
          const adminChecks = [
            // 1. Campo admin_access explícito
            user.role.admin_access === true,
            // 2. Nombre del rol contiene "Administrator" o "Admin"
            user.role.name?.toLowerCase().includes('administrator'),
            user.role.name?.toLowerCase().includes('admin'),
            // 3. Descripción contiene admin
            user.role.description?.includes('admin'),
            // 4. ID específico del rol de admin (puedes ajustar si conoces el UUID)
            user.role.id === '7690c14b-4036-4cf9-9af7-9b3215a6cf58'
          ];
          
          isAdmin = adminChecks.some(check => check);
          
          console.log('🔍 Verificaciones de admin:', {
            admin_access: user.role.admin_access,
            name: user.role.name,
            nameIncludesAdmin: user.role.name?.toLowerCase().includes('admin'),
            description: user.role.description,
            roleId: user.role.id,
            isSpecificAdminId: user.role.id === '7690c14b-4036-4cf9-9af7-9b3215a6cf58'
          });
          
        } else if (typeof user.role === 'string') {
          // Si solo tenemos el UUID del rol de admin conocido
          isAdmin = user.role === '7690c14b-4036-4cf9-9af7-9b3215a6cf58';
          console.log('⚠️ Role es UUID, verificando si es el admin UUID...');
        }
        
        console.log('🔐 Es admin?', isAdmin);
        
        if (!isAdmin) {
          console.log('❌ Usuario sin permisos de admin');
          await logout();
          throw new Error('Acceso denegado: Se requieren permisos de administrador');
        }

        console.log('🎉 Autenticación exitosa');
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
        console.log('❌ Error en autenticación:', authError);
        
        // Si falla la autenticación, limpiar tokens y hacer logout
        apiClient.clearTokens();
        dispatch({ type: 'AUTH_LOGOUT' });
      }
    } catch (error) {
      console.error('💥 Error crítico en checkAuth:', error);
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