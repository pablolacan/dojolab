import { readMe } from '@directus/sdk';
import { directus } from './client';
import type { DirectusUser, ApiResponse, LoginCredentials } from '../types/directus';

/**
 * Funciones de autenticación para Directus
 */
export const auth = {
  /**
   * Login con email y password
   */
  async login(credentials: LoginCredentials): Promise<ApiResponse<DirectusUser>> {
    try {
      console.log('🔐 Attempting login for:', credentials.email);
      
      const result = await directus.login({
        email: credentials.email,
        password: credentials.password
      });
      
      if (result) {
        console.log('✅ Login successful');
        
        // Obtener datos del usuario después del login
        const user = await this.getCurrentUser();
        
        if (user.success && user.data) {
          return {
            success: true,
            data: user.data
          };
        }
      }
      
      return {
        success: false,
        error: 'Login successful but failed to fetch user data'
      };
      
    } catch (error: any) {
      console.error('❌ Login error:', error);
      
      // Mapear errores comunes de Directus
      let errorMessage = 'Login failed';
      let errorCode = 'LOGIN_FAILED';
      
      if (error.message?.includes('Invalid credentials')) {
        errorMessage = 'Invalid email or password';
        errorCode = 'INVALID_CREDENTIALS';
      } else if (error.message?.includes('User suspended')) {
        errorMessage = 'Account suspended. Contact administrator';
        errorCode = 'ACCOUNT_SUSPENDED';
      } else if (error.message?.includes('Too many requests')) {
        errorMessage = 'Too many login attempts. Please try again later';
        errorCode = 'RATE_LIMITED';
      }
      
      return {
        success: false,
        error: errorMessage,
        code: errorCode
      };
    }
  },

  /**
   * Logout del usuario actual
   */
  async logout(): Promise<ApiResponse> {
    try {
      console.log('🚪 Logging out...');
      
      await directus.logout();
      
      console.log('✅ Logout successful');
      return { success: true };
      
    } catch (error: any) {
      console.error('❌ Logout error:', error);
      
      // Incluso si el logout falla en el servidor, 
      // limpiamos el estado local
      return {
        success: false,
        error: error.message || 'Logout failed'
      };
    }
  },

  /**
   * Obtener usuario actual autenticado
   */
  async getCurrentUser(): Promise<ApiResponse<DirectusUser>> {
    try {
      console.log('👤 Fetching current user...');
      
      const user = await directus.request(readMe({
        fields: [
          'id',
          'first_name', 
          'last_name', 
          'email', 
          'avatar',
          'role.name',
          'role.admin_access',
          'role.app_access',
          'status',
          'last_access',
          'timezone',
          'locale',
          'theme'
        ]
      }));
      
      if (user) {
        console.log('✅ User data fetched:', user.email);
        return {
          success: true,
          data: user as DirectusUser
        };
      }
      
      return {
        success: false,
        error: 'No user data received'
      };
      
    } catch (error: any) {
      console.error('❌ Get current user error:', error);
      
      return {
        success: false,
        error: error.message || 'Failed to fetch user data',
        code: 'USER_FETCH_FAILED'
      };
    }
  },

  /**
   * Refresh del token de autenticación
   */
  async refresh(): Promise<ApiResponse> {
    try {
      console.log('🔄 Refreshing token...');
      
      const result = await directus.refresh();
      
      if (result) {
        console.log('✅ Token refreshed successfully');
        return { success: true };
      }
      
      return {
        success: false,
        error: 'Token refresh failed'
      };
      
    } catch (error: any) {
      console.error('❌ Token refresh error:', error);
      
      return {
        success: false,
        error: error.message || 'Token refresh failed',
        code: 'REFRESH_FAILED'
      };
    }
  },

  /**
   * Verificar si el usuario está autenticado
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const userResult = await this.getCurrentUser();
      return userResult.success && 
             userResult.data?.status === 'active';
    } catch {
      return false;
    }
  },

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<ApiResponse> {
    try {
      console.log('📧 Requesting password reset for:', email);
      
      // Directus password reset endpoint
      const response = await fetch(`${import.meta.env.VITE_DIRECTUS_URL}/auth/password/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      if (response.ok) {
        console.log('✅ Password reset email sent');
        return { success: true };
      }
      
      const errorData = await response.json().catch(() => ({}));
      
      return {
        success: false,
        error: errorData.message || 'Failed to send password reset email'
      };
      
    } catch (error: any) {
      console.error('❌ Password reset request error:', error);
      
      return {
        success: false,
        error: error.message || 'Password reset request failed'
      };
    }
  }
};