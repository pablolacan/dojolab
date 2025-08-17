// src/services/api/auth-service.ts

import type { HttpClient } from '../../utils/http-client';
import type { TokenManager } from '../../utils/token-manager';
import type { 
  DirectusUser, 
  AuthTokens, 
  LoginCredentials 
} from '../../types';
import type { 
  AuthServiceResponse, 
  RefreshTokenRequest, 
  LogoutRequest,
  AuthServiceConfig 
} from './types';
import { API_ENDPOINTS } from './endpoints';

export class AuthService {
  private httpClient: HttpClient;
  private tokenManager: TokenManager;
  private config: AuthServiceConfig;
  private refreshPromise: Promise<AuthTokens> | null = null;

  constructor(
    httpClient: HttpClient, 
    tokenManager: TokenManager, 
    config: AuthServiceConfig
  ) {
    this.httpClient = httpClient;
    this.tokenManager = tokenManager;
    this.config = config;
  }

  /**
   * Iniciar sesión con credenciales
   */
  async login(credentials: LoginCredentials): Promise<AuthServiceResponse> {
    try {
      const response = await this.httpClient.post<{ data: AuthTokens }>(
        API_ENDPOINTS.AUTH.LOGIN,
        credentials
      );

      // Guardar tokens
      this.tokenManager.saveTokens(response.data);
      this.updateHttpClientAuth(response.data.access_token);

      // Obtener información del usuario
      const user = await this.getCurrentUser();

      return {
        user,
        tokens: response.data
      };
    } catch (error) {
      throw this.handleAuthError(error, 'Error during login');
    }
  }

  /**
   * Cerrar sesión
   */
  async logout(): Promise<void> {
    try {
      const refreshToken = this.tokenManager.getRefreshToken();
      
      if (refreshToken) {
        const logoutData: LogoutRequest = { refresh_token: refreshToken };
        
        // Intentar logout en el servidor
        await this.httpClient.post(API_ENDPOINTS.AUTH.LOGOUT, logoutData);
      }
    } catch (error) {
      // Log warning pero no fallar - el logout local debe continuar
      console.warn('Warning during server logout:', error);
    } finally {
      // Siempre limpiar tokens localmente
      this.tokenManager.clearTokens();
      this.httpClient.removeDefaultHeader('Authorization');
    }
  }

  /**
   * Refrescar token de acceso
   */
  async refreshAccessToken(): Promise<AuthTokens> {
    // Si ya hay un refresh en progreso, esperarlo
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    const refreshToken = this.tokenManager.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    // Iniciar nuevo refresh
    this.refreshPromise = this.performTokenRefresh(refreshToken);
    
    try {
      const tokens = await this.refreshPromise;
      return tokens;
    } finally {
      this.refreshPromise = null;
    }
  }

  /**
   * Realizar el refresh de token
   */
  private async performTokenRefresh(refreshToken: string): Promise<AuthTokens> {
    try {
      const refreshData: RefreshTokenRequest = { refresh_token: refreshToken };
      
      const response = await this.httpClient.post<{ data: AuthTokens }>(
        API_ENDPOINTS.AUTH.REFRESH,
        refreshData
      );

      // Guardar nuevos tokens
      this.tokenManager.saveTokens(response.data);
      this.updateHttpClientAuth(response.data.access_token);

      return response.data;
    } catch (error) {
      // Si el refresh falla, limpiar tokens
      this.tokenManager.clearTokens();
      this.httpClient.removeDefaultHeader('Authorization');
      throw new Error('Session expired. Please login again.');
    }
  }

  /**
   * Obtener usuario actual con información del rol
   */
  async getCurrentUser(): Promise<DirectusUser> {
    try {
      const response = await this.httpClient.get<{ data: DirectusUser }>(
        API_ENDPOINTS.USERS.ME_WITH_ROLE
      );
      
      return response.data;
    } catch (error) {
      throw this.handleAuthError(error, 'Error fetching current user');
    }
  }

  /**
   * Verificar si está autenticado
   */
  isAuthenticated(): boolean {
    return this.tokenManager.isAuthenticated();
  }

  /**
   * Verificar si hay tokens almacenados (aunque estén expirados)
   */
  hasStoredTokens(): boolean {
    return this.tokenManager.hasStoredTokens();
  }

  /**
   * Asegurar que el token es válido antes de hacer requests
   */
  async ensureValidToken(): Promise<void> {
    // Validar que existen tokens
    this.tokenManager.validateTokens();

    // Si el token está próximo a expirar, refrescarlo
    if (this.tokenManager.isTokenExpired()) {
      await this.refreshAccessToken();
    }
  }

  /**
   * Verificar permisos de administrador
   */
  async validateAdminPermissions(user: DirectusUser): Promise<boolean> {
    try {
      if (typeof user.role === 'object') {
        const adminChecks = [
          user.role.admin_access === true,
          user.role.name?.toLowerCase().includes('administrator'),
          user.role.name?.toLowerCase().includes('admin'),
          user.role.description?.includes('admin'),
          user.role.id === '7690c14b-4036-4cf9-9af7-9b3215a6cf58'
        ];
        
        return adminChecks.some(check => check);
      } else if (typeof user.role === 'string') {
        return user.role === '7690c14b-4036-4cf9-9af7-9b3215a6cf58';
      }
      
      return false;
    } catch (error) {
      console.error('Error validating admin permissions:', error);
      return false;
    }
  }

  /**
   * Verificar autenticación completa (token válido + permisos)
   */
  async checkAuthentication(): Promise<{ user: DirectusUser; isValid: boolean }> {
    try {
      // Verificar tokens almacenados
      if (!this.hasStoredTokens()) {
        return { user: null as any, isValid: false };
      }

      // Recargar tokens si es necesario
      this.tokenManager.reloadFromStorage();
      
      // Actualizar HTTP client con token actual
      const accessToken = this.tokenManager.getAccessToken();
      if (accessToken) {
        this.updateHttpClientAuth(accessToken);
      }

      // Asegurar token válido
      await this.ensureValidToken();

      // Obtener usuario actual
      const user = await this.getCurrentUser();
      
      // Verificar permisos de admin
      const hasAdminPermissions = await this.validateAdminPermissions(user);
      
      if (!hasAdminPermissions) {
        await this.logout();
        throw new Error('Access denied: Administrator permissions required');
      }

      return { user, isValid: true };
    } catch (error) {
      // En caso de error, limpiar todo
      this.tokenManager.clearTokens();
      this.httpClient.removeDefaultHeader('Authorization');
      throw error;
    }
  }

  /**
   * Obtener información del estado de los tokens
   */
  getTokenStatus() {
    return this.tokenManager.getTokenStatus();
  }

  /**
   * Forzar recarga de tokens desde storage
   */
  reloadTokens(): void {
    this.tokenManager.reloadFromStorage();
    const accessToken = this.tokenManager.getAccessToken();
    if (accessToken) {
      this.updateHttpClientAuth(accessToken);
    }
  }

  /**
   * Limpiar todos los tokens
   */
  clearTokens(): void {
    this.tokenManager.clearTokens();
    this.httpClient.removeDefaultHeader('Authorization');
  }

  /**
   * Actualizar header de autorización en HTTP client
   */
  private updateHttpClientAuth(accessToken: string): void {
    this.httpClient.setDefaultHeader('Authorization', `Bearer ${accessToken}`);
  }

  /**
   * Manejo centralizado de errores de autenticación
   */
  private handleAuthError(error: any, defaultMessage: string): Error {
    if (error instanceof Error) {
      return error;
    }
    
    if (typeof error === 'object' && error.message) {
      return new Error(error.message);
    }
    
    return new Error(defaultMessage);
  }

  /**
   * Configurar auto-refresh de tokens
   */
  startTokenAutoRefresh(): void {
    const checkInterval = this.config.tokenRefreshBuffer * 60 * 1000; // convertir a ms
    
    setInterval(async () => {
      try {
        if (this.isAuthenticated()) {
          const timeRemaining = this.tokenManager.getTokenTimeRemaining();
          
          // Si queda menos tiempo que el buffer configurado, refrescar
          if (timeRemaining <= this.config.tokenRefreshBuffer) {
            await this.refreshAccessToken();
          }
        }
      } catch (error) {
        console.warn('Auto token refresh failed:', error);
      }
    }, checkInterval);
  }
}