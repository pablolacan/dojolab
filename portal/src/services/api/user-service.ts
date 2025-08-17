// src/services/api/user-service.ts

import type { HttpClient } from '../../utils/http-client';
import type { DirectusUser } from '../../types';
import type { 
  UserUpdateData, 
  UserQueryOptions, 
  PaginatedResponse
} from './types';
import { API_ENDPOINTS, buildDirectusQuery, buildUrlWithParams } from './endpoints';

export class UserService {
  private httpClient: HttpClient;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
  }

  /**
   * Obtener usuario actual con opciones de expansión
   */
  async getCurrentUser(options: UserQueryOptions = {}): Promise<DirectusUser> {
    try {
      const fields = this.buildUserFields(options);
      const endpoint = buildUrlWithParams(API_ENDPOINTS.USERS.ME, { fields });
      
      const response = await this.httpClient.get<{ data: DirectusUser }>(endpoint);
      return response.data;
    } catch (error) {
      throw this.handleUserError(error, 'Error fetching current user');
    }
  }

  /**
   * Obtener usuario por ID
   */
  async getUserById(id: string, options: UserQueryOptions = {}): Promise<DirectusUser> {
    try {
      const fields = this.buildUserFields(options);
      const endpoint = buildUrlWithParams(API_ENDPOINTS.USERS.BY_ID(id), { fields });
      
      const response = await this.httpClient.get<{ data: DirectusUser }>(endpoint);
      return response.data;
    } catch (error) {
      throw this.handleUserError(error, `Error fetching user ${id}`);
    }
  }

  /**
   * Obtener lista de usuarios con paginación y filtros
   */
  async getUsers(options: UserQueryOptions = {}): Promise<PaginatedResponse<DirectusUser>> {
    try {
      const queryParams = this.buildUserQuery(options);
      const endpoint = buildUrlWithParams(API_ENDPOINTS.USERS.BASE, queryParams);
      
      const response = await this.httpClient.get<PaginatedResponse<DirectusUser>>(endpoint);
      return response;
    } catch (error) {
      throw this.handleUserError(error, 'Error fetching users');
    }
  }

  /**
   * Actualizar usuario actual
   */
  async updateCurrentUser(data: UserUpdateData): Promise<DirectusUser> {
    try {
      this.validateUserUpdateData(data);
      
      const updateData = {
        ...data,
        date_updated: new Date().toISOString()
      };

      const response = await this.httpClient.patch<{ data: DirectusUser }>(
        API_ENDPOINTS.USERS.ME,
        updateData
      );
      
      return response.data;
    } catch (error) {
      throw this.handleUserError(error, 'Error updating current user');
    }
  }

  /**
   * Actualizar usuario por ID
   */
  async updateUser(id: string, data: UserUpdateData): Promise<DirectusUser> {
    try {
      this.validateUserUpdateData(data);
      
      const updateData = {
        ...data,
        date_updated: new Date().toISOString()
      };

      const response = await this.httpClient.patch<{ data: DirectusUser }>(
        API_ENDPOINTS.USERS.BY_ID(id),
        updateData
      );
      
      return response.data;
    } catch (error) {
      throw this.handleUserError(error, `Error updating user ${id}`);
    }
  }

  /**
   * Actualizar avatar del usuario actual
   */
  async updateCurrentUserAvatar(fileId: string): Promise<DirectusUser> {
    try {
      return this.updateCurrentUser({ avatar: fileId });
    } catch (error) {
      throw this.handleUserError(error, 'Error updating user avatar');
    }
  }

  /**
   * Eliminar avatar del usuario actual
   */
  async removeCurrentUserAvatar(): Promise<DirectusUser> {
    try {
      return this.updateCurrentUser({ avatar: null as any });
    } catch (error) {
      throw this.handleUserError(error, 'Error removing user avatar');
    }
  }

  /**
   * Verificar si un email está disponible
   */
  async checkEmailAvailability(email: string, excludeUserId?: string): Promise<boolean> {
    try {
      const filters: Record<string, any> = { email };
      
      if (excludeUserId) {
        filters['id[_neq]'] = excludeUserId;
      }

      const queryParams = buildDirectusQuery({
        filters,
        limit: 1,
        fields: ['id']
      });

      const endpoint = buildUrlWithParams(API_ENDPOINTS.USERS.BASE, queryParams);
      const response = await this.httpClient.get<PaginatedResponse<{ id: string }>>(endpoint);
      
      return response.data.length === 0;
    } catch (error) {
      throw this.handleUserError(error, 'Error checking email availability');
    }
  }

  /**
   * Buscar usuarios por término de búsqueda
   */
  async searchUsers(searchTerm: string, options: UserQueryOptions = {}): Promise<DirectusUser[]> {
    try {
      const queryParams = this.buildUserQuery({
        ...options,
        search: searchTerm,
        limit: options.limit || 50
      });

      const endpoint = buildUrlWithParams(API_ENDPOINTS.USERS.BASE, queryParams);
      const response = await this.httpClient.get<PaginatedResponse<DirectusUser>>(endpoint);
      
      return response.data;
    } catch (error) {
      throw this.handleUserError(error, 'Error searching users');
    }
  }

  /**
   * Obtener usuarios por rol
   */
  async getUsersByRole(roleId: string, options: UserQueryOptions = {}): Promise<DirectusUser[]> {
    try {
      const queryParams = this.buildUserQuery({
        ...options,
        filters: {
          ...options.filters,
          role: roleId
        }
      });

      const endpoint = buildUrlWithParams(API_ENDPOINTS.USERS.BASE, queryParams);
      const response = await this.httpClient.get<PaginatedResponse<DirectusUser>>(endpoint);
      
      return response.data;
    } catch (error) {
      throw this.handleUserError(error, `Error fetching users by role ${roleId}`);
    }
  }

  /**
   * Verificar permisos de administrador de un usuario
   */
  isUserAdmin(user: DirectusUser): boolean {
    try {
      if (typeof user.role === 'object') {
        const adminChecks = [
          user.role.admin_access === true,
          user.role.name?.toLowerCase().includes('administrator'),
          user.role.name?.toLowerCase().includes('admin'),
          user.role.description?.toLowerCase().includes('admin'),
          user.role.id === '7690c14b-4036-4cf9-9af7-9b3215a6cf58'
        ];
        
        return adminChecks.some(check => check);
      } else if (typeof user.role === 'string') {
        return user.role === '7690c14b-4036-4cf9-9af7-9b3215a6cf58';
      }
      
      return false;
    } catch (error) {
      console.error('Error checking admin permissions:', error);
      return false;
    }
  }

  /**
   * Construir campos para query de usuario
   */
  private buildUserFields(options: UserQueryOptions): string {
    let fields = ['*'];
    
    if (options.includeRole) {
      fields.push('role.*');
    }
    
    if (options.includePolicies) {
      fields.push('role.policies.*');
    }
    
    return fields.join(',');
  }

  /**
   * Construir query completa para usuarios
   */
  private buildUserQuery(options: UserQueryOptions): Record<string, string> {
    const query = buildDirectusQuery({
      filters: options.filters,
      search: options.search,
      limit: options.limit,
      offset: options.offset,
      page: options.page,
      sort: options.sort,
      fields: [this.buildUserFields(options)]
    });

    return query;
  }

  /**
   * Validar datos de actualización de usuario
   */
  private validateUserUpdateData(data: UserUpdateData): void {
    const errors: string[] = [];

    if (data.email && !this.isValidEmail(data.email)) {
      errors.push('Invalid email format');
    }

    if (data.first_name && data.first_name.trim().length < 1) {
      errors.push('First name cannot be empty');
    }

    if (data.last_name && data.last_name.trim().length < 1) {
      errors.push('Last name cannot be empty');
    }

    if (errors.length > 0) {
      throw new Error(`Validation errors: ${errors.join(', ')}`);
    }
  }

  /**
   * Validar formato de email
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Manejo centralizado de errores de usuario
   */
  private handleUserError(error: any, defaultMessage: string): Error {
    if (error instanceof Error) {
      return error;
    }
    
    if (typeof error === 'object' && error.message) {
      return new Error(error.message);
    }
    
    return new Error(defaultMessage);
  }

  /**
   * Formatear nombre completo del usuario
   */
  static formatFullName(user: DirectusUser): string {
    const firstName = user.first_name?.trim() || '';
    const lastName = user.last_name?.trim() || '';
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    
    return firstName || lastName || user.email || 'Usuario';
  }

  /**
   * Obtener iniciales del usuario para avatares
   */
  static getUserInitials(user: DirectusUser): string {
    const firstName = user.first_name?.trim() || '';
    const lastName = user.last_name?.trim() || '';
    
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    
    if (firstName) {
      return firstName.substring(0, 2).toUpperCase();
    }
    
    if (lastName) {
      return lastName.substring(0, 2).toUpperCase();
    }
    
    if (user.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    
    return 'U';
  }

  /**
   * Verificar si un usuario está activo
   */
  static isUserActive(user: DirectusUser): boolean {
    return user.status === 'active';
  }
}