import type {
  DirectusResponse,
  DirectusFile,
  MaintenanceModeData,
  ApiError,
  LoginCredentials,
  AuthTokens,
  DirectusUser,
  Subscription,
  DirectusListResponse
} from '../types';

class ApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiresAt: number | null = null;
  private refreshPromise: Promise<AuthTokens> | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.loadTokensFromStorage();
  }

  private loadTokensFromStorage(): void {
    this.accessToken = localStorage.getItem('directus_access_token');
    this.refreshToken = localStorage.getItem('directus_refresh_token');
    const expiresAt = localStorage.getItem('directus_token_expires_at');
    this.tokenExpiresAt = expiresAt ? parseInt(expiresAt) : null;
    
    console.log('🔄 Tokens cargados desde localStorage:', {
      hasAccessToken: !!this.accessToken,
      hasRefreshToken: !!this.refreshToken,
      tokenExpiresAt: this.tokenExpiresAt,
      currentTime: Date.now()
    });
  }

  private saveTokensToStorage(tokens: AuthTokens): void {
    const expiresAt = Date.now() + (tokens.expires);
    
    localStorage.setItem('directus_access_token', tokens.access_token);
    localStorage.setItem('directus_refresh_token', tokens.refresh_token);
    localStorage.setItem('directus_token_expires_at', expiresAt.toString());
    
    this.accessToken = tokens.access_token;
    this.refreshToken = tokens.refresh_token;
    this.tokenExpiresAt = expiresAt;
  }

  private removeTokensFromStorage(): void {
    localStorage.removeItem('directus_access_token');
    localStorage.removeItem('directus_refresh_token');
    localStorage.removeItem('directus_token_expires_at');
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiresAt = null;
  }

  private isTokenExpired(): boolean {
    if (!this.tokenExpiresAt) return true;
    // Considerar el token expirado 1 minuto antes para prevenir errores
    return Date.now() >= (this.tokenExpiresAt - 60000);
  }

  private async ensureValidToken(): Promise<void> {
    if (!this.accessToken || !this.refreshToken) {
      throw new Error('No tokens available');
    }

    if (this.isTokenExpired()) {
      // Si ya hay un refresh en progreso, esperarlo
      if (this.refreshPromise) {
        await this.refreshPromise;
        return;
      }

      // Iniciar nuevo refresh
      this.refreshPromise = this.refreshAccessToken();
      try {
        await this.refreshPromise;
      } finally {
        this.refreshPromise = null;
      }
    }
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.errors?.[0]?.message || errorData.message || errorMessage;
      } catch {
        // Si no se puede parsear el JSON, usar el mensaje HTTP
      }

      const error: ApiError = {
        message: errorMessage,
        status: response.status
      };
      
      throw error;
    }

    return response.json();
  }

  // Método genérico para hacer requests con auto-refresh
  public async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Para endpoints públicos y de auth, no verificar token
    const isAuthEndpoint = endpoint.startsWith('/auth/') || endpoint === '/items/maintenance_mode' || endpoint === '/server/ping';
    
    console.log(`🌐 API Request: ${endpoint}`, {
      isAuthEndpoint,
      hasAccessToken: !!this.accessToken,
      hasRefreshToken: !!this.refreshToken,
      isExpired: this.isTokenExpired()
    });

    if (!isAuthEndpoint) {
      try {
        await this.ensureValidToken();
      } catch (tokenError) {
        console.error('❌ Token validation failed:', tokenError);
        throw tokenError;
      }
    }

    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
      ...options,
    });

    console.log(`📡 Response for ${endpoint}:`, {
      status: response.status,
      ok: response.ok,
      statusText: response.statusText
    });

    return this.handleResponse<T>(response);
  }

  // AUTH METHODS
  async login(credentials: LoginCredentials): Promise<{ user: DirectusUser; tokens: AuthTokens }> {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.errors?.[0]?.message || 'Error de autenticación');
    }

    const result = await response.json();
    
    // Guardar tokens
    this.saveTokensToStorage(result.data);
    
    // Obtener información del usuario
    const user = await this.getCurrentUser();
    
    return {
      user,
      tokens: result.data
    };
  }

  async logout(): Promise<void> {
    try {
      if (this.refreshToken) {
        await fetch(`${this.baseUrl}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            refresh_token: this.refreshToken 
          }),
        });
      }
    } catch (error) {
      console.warn('Error during logout:', error);
    } finally {
      this.removeTokensFromStorage();
    }
  }

  async refreshAccessToken(): Promise<AuthTokens> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${this.baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh_token: this.refreshToken,
      }),
    });

    if (!response.ok) {
      // Si el refresh token también expiró, limpiar todo
      this.removeTokensFromStorage();
      throw new Error('Session expired. Please login again.');
    }

    const result = await response.json();
    this.saveTokensToStorage(result.data);
    
    return result.data;
  }

  async getCurrentUser(): Promise<DirectusUser> {
    console.log('🔍 Obteniendo usuario actual...');
    
    // Obtener usuario con rol expandido
    const result = await this.request<DirectusResponse<DirectusUser>>('/users/me?fields=*,role.*');
    
    console.log('📦 Respuesta completa de /users/me:', result);
    console.log('👤 Datos del usuario:', result.data);
    console.log('🎭 Role expandido:', result.data.role);
    
    return result.data;
  }

  // Verificar si está autenticado y el token es válido
  isAuthenticated(): boolean {
    return !!(this.accessToken && this.refreshToken && !this.isTokenExpired());
  }

  // Verificar si hay tokens guardados (aunque estén expirados)
  hasStoredTokens(): boolean {
    return !!(this.accessToken && this.refreshToken);
  }

  // Obtener token actual
  getAccessToken(): string | null {
    return this.accessToken;
  }

  // Obtener tiempo restante del token en minutos
  getTokenTimeRemaining(): number {
    if (!this.tokenExpiresAt) return 0;
    return Math.max(0, Math.floor((this.tokenExpiresAt - Date.now()) / 60000));
  }

  // Limpiar todos los tokens
  clearTokens(): void {
    this.removeTokensFromStorage();
  }

  // Debug: Ver estado actual de tokens
  getTokenStatus() {
    return {
      hasAccessToken: !!this.accessToken,
      hasRefreshToken: !!this.refreshToken,
      tokenExpiresAt: this.tokenExpiresAt,
      isExpired: this.isTokenExpired(),
      timeRemaining: this.getTokenTimeRemaining()
    };
  }

  // Forzar recarga de tokens desde localStorage
  reloadTokens(): void {
    this.loadTokensFromStorage();
  }

  // Obtener archivo por ID
  async getFile(fileId: string): Promise<DirectusFile> {
    const result = await this.request<DirectusResponse<DirectusFile>>(`/files/${fileId}`);
    return result.data;
  }

  // Generar URL del asset
  getAssetUrl(fileId: string): string {
    return `${this.baseUrl}/assets/${fileId}`;
  }

  // Generar URL del asset con transformaciones
  getAssetUrlWithTransform(
    fileId: string, 
    params: Record<string, string | number> = {}
  ): string {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      searchParams.append(key, value.toString());
    });

    const queryString = searchParams.toString();
    return `${this.baseUrl}/assets/${fileId}${queryString ? `?${queryString}` : ''}`;
  }

  // Maintenance Mode
  async getMaintenanceMode(): Promise<MaintenanceModeData> {
    const result = await this.request<DirectusResponse<MaintenanceModeData>>('/items/maintenance_mode');
    return result.data;
  }

  // Health check
  async ping(): Promise<{ status: string }> {
    return this.request('/server/ping');
  }

  // SUBSCRIPTIONS METHODS
  async getSubscriptions(): Promise<Subscription[]> {
    const result = await this.request<DirectusListResponse<Subscription>>('/items/subscriptions');
    return result.data;
  }

  async getSubscription(id: number): Promise<Subscription> {
    const result = await this.request<DirectusResponse<Subscription>>(`/items/subscriptions/${id}`);
    return result.data;
  }
}

// Singleton instance
let apiClient: ApiClient | null = null;

export const createApiClient = (baseUrl: string): ApiClient => {
  if (!apiClient) {
    apiClient = new ApiClient(baseUrl);
  }
  return apiClient;
};

export const getApiClient = (): ApiClient => {
  if (!apiClient) {
    throw new Error('API client not initialized. Call createApiClient first.');
  }
  return apiClient;
};

export { ApiClient };