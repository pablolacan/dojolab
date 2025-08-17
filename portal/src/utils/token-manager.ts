// src/utils/token-manager.ts

import type { AuthTokens } from '../types';

export interface TokenStatus {
  hasAccessToken: boolean;
  hasRefreshToken: boolean;
  tokenExpiresAt: number | null;
  isExpired: boolean;
  timeRemaining: number;
}

export class TokenManager {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiresAt: number | null = null;

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Cargar tokens desde localStorage
   */
  private loadFromStorage(): void {
    this.accessToken = localStorage.getItem('directus_access_token');
    this.refreshToken = localStorage.getItem('directus_refresh_token');
    const expiresAt = localStorage.getItem('directus_token_expires_at');
    this.tokenExpiresAt = expiresAt ? parseInt(expiresAt) : null;
  }

  /**
   * Guardar tokens en localStorage
   */
  saveTokens(tokens: AuthTokens): void {
    const expiresAt = Date.now() + tokens.expires;
    
    localStorage.setItem('directus_access_token', tokens.access_token);
    localStorage.setItem('directus_refresh_token', tokens.refresh_token);
    localStorage.setItem('directus_token_expires_at', expiresAt.toString());
    
    this.accessToken = tokens.access_token;
    this.refreshToken = tokens.refresh_token;
    this.tokenExpiresAt = expiresAt;
  }

  /**
   * Limpiar todos los tokens
   */
  clearTokens(): void {
    localStorage.removeItem('directus_access_token');
    localStorage.removeItem('directus_refresh_token');
    localStorage.removeItem('directus_token_expires_at');
    
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiresAt = null;
  }

  /**
   * Obtener access token actual
   */
  getAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * Obtener refresh token actual
   */
  getRefreshToken(): string | null {
    return this.refreshToken;
  }

  /**
   * Verificar si el token está expirado
   * Considera expirado 1 minuto antes para prevenir errores
   */
  isTokenExpired(): boolean {
    if (!this.tokenExpiresAt) return true;
    return Date.now() >= (this.tokenExpiresAt - 60000);
  }

  /**
   * Verificar si hay tokens almacenados
   */
  hasStoredTokens(): boolean {
    return !!(this.accessToken && this.refreshToken);
  }

  /**
   * Verificar si está autenticado (tokens válidos y no expirados)
   */
  isAuthenticated(): boolean {
    return this.hasStoredTokens() && !this.isTokenExpired();
  }

  /**
   * Obtener tiempo restante del token en minutos
   */
  getTokenTimeRemaining(): number {
    if (!this.tokenExpiresAt) return 0;
    return Math.max(0, Math.floor((this.tokenExpiresAt - Date.now()) / 60000));
  }

  /**
   * Forzar recarga de tokens desde localStorage
   */
  reloadFromStorage(): void {
    this.loadFromStorage();
  }

  /**
   * Obtener estado completo de los tokens
   */
  getTokenStatus(): TokenStatus {
    return {
      hasAccessToken: !!this.accessToken,
      hasRefreshToken: !!this.refreshToken,
      tokenExpiresAt: this.tokenExpiresAt,
      isExpired: this.isTokenExpired(),
      timeRemaining: this.getTokenTimeRemaining()
    };
  }

  /**
   * Validar que los tokens existen
   */
  validateTokens(): void {
    if (!this.accessToken || !this.refreshToken) {
      throw new Error('No tokens available');
    }
  }
}