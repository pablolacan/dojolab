// src/services/api/file-service.ts

import type { HttpClient } from '../../utils/http-client';
import type { DirectusFile } from '../../types';
import type { 
  FileUploadOptions, 
  AssetUrlOptions,
  PaginatedResponse,
  QueryOptions,
  FileServiceConfig 
} from './types';
import { API_ENDPOINTS, buildDirectusQuery, buildUrlWithParams } from './endpoints';

export class FileService {
  private httpClient: HttpClient;
  private config: FileServiceConfig;
  private baseUrl: string;

  constructor(httpClient: HttpClient, config: FileServiceConfig) {
    this.httpClient = httpClient;
    this.config = config;
    this.baseUrl = httpClient.getBaseUrl();
  }

  /**
   * Obtener archivo por ID
   */
  async getFile(fileId: string): Promise<DirectusFile> {
    try {
      const response = await this.httpClient.get<{ data: DirectusFile }>(
        API_ENDPOINTS.FILES.BY_ID(fileId)
      );
      
      return response.data;
    } catch (error) {
      throw this.handleFileError(error, `Error fetching file ${fileId}`);
    }
  }

  /**
   * Obtener lista de archivos con filtros y paginación
   */
  async getFiles(options: QueryOptions = {}): Promise<PaginatedResponse<DirectusFile>> {
    try {
      const queryParams = buildDirectusQuery({
        filters: options.filters,
        search: options.search,
        limit: options.limit,
        offset: options.offset,
        page: options.page,
        sort: options.sort,
        fields: options.fields
      });

      const endpoint = buildUrlWithParams(API_ENDPOINTS.FILES.BASE, queryParams);
      const response = await this.httpClient.get<PaginatedResponse<DirectusFile>>(endpoint);
      
      return response;
    } catch (error) {
      throw this.handleFileError(error, 'Error fetching files');
    }
  }

  /**
   * Subir archivo
   */
  async uploadFile(file: File, options: FileUploadOptions = {}): Promise<DirectusFile> {
    try {
      // Validar archivo antes de subir
      this.validateFile(file);

      const formData = new FormData();
      formData.append('file', file);

      // Agregar opciones adicionales
      if (options.title) {
        formData.append('title', options.title);
      }
      if (options.description) {
        formData.append('description', options.description);
      }
      if (options.folder) {
        formData.append('folder', options.folder);
      }
      if (options.storage) {
        formData.append('storage', options.storage);
      }

      const response = await this.httpClient.request<{ data: DirectusFile }>(
        API_ENDPOINTS.FILES.UPLOAD,
        {
          method: 'POST',
          body: formData,
          headers: {
            // No establecer Content-Type para FormData, el browser lo hace automáticamente
          }
        }
      );

      return response.data;
    } catch (error) {
      throw this.handleFileError(error, `Error uploading file ${file.name}`);
    }
  }

  /**
   * Actualizar metadatos de archivo
   */
  async updateFile(fileId: string, data: Partial<DirectusFile>): Promise<DirectusFile> {
    try {
      const updateData = {
        ...data,
        date_updated: new Date().toISOString()
      };

      const response = await this.httpClient.patch<{ data: DirectusFile }>(
        API_ENDPOINTS.FILES.BY_ID(fileId),
        updateData
      );

      return response.data;
    } catch (error) {
      throw this.handleFileError(error, `Error updating file ${fileId}`);
    }
  }

  /**
   * Eliminar archivo
   */
  async deleteFile(fileId: string): Promise<void> {
    try {
      await this.httpClient.delete(API_ENDPOINTS.FILES.BY_ID(fileId));
    } catch (error) {
      throw this.handleFileError(error, `Error deleting file ${fileId}`);
    }
  }

  /**
   * Eliminar múltiples archivos
   */
  async deleteFiles(fileIds: string[]): Promise<void> {
    try {
      if (fileIds.length === 0) {
        throw new Error('No files selected for deletion');
      }

      await this.httpClient.request(API_ENDPOINTS.FILES.BASE, {
        method: 'DELETE',
        body: JSON.stringify(fileIds)
      });
    } catch (error) {
      throw this.handleFileError(error, 'Error deleting multiple files');
    }
  }

  /**
   * Generar URL simple del asset
   */
  getAssetUrl(fileId: string): string {
    return `${this.baseUrl}${API_ENDPOINTS.ASSETS.BY_ID(fileId)}`;
  }

  /**
   * Generar URL del asset con transformaciones
   */
  getAssetUrlWithTransform(fileId: string, options: AssetUrlOptions = {}): string {
    // Separar opciones de transformación de opciones de URL
    const { download, filename, ...transformOptions } = options;
    
    // Construir parámetros de transformación
    const params: Record<string, string | number> = {};
    
    Object.entries(transformOptions).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (typeof value === 'boolean') {
          params[key] = value ? '1' : '0';
        } else {
          params[key] = value;
        }
      }
    });

    // Agregar parámetros de descarga
    if (download !== undefined) {
      if (typeof download === 'string') {
        params.download = download; // Filename personalizado
      } else if (download === true) {
        params.download = filename || '1'; // Usar filename o activar descarga
      }
    }

    return `${this.baseUrl}${API_ENDPOINTS.ASSETS.WITH_TRANSFORM(fileId, params)}`;
  }

  /**
   * Generar URL de descarga directa
   */
  getDownloadUrl(fileId: string, filename?: string): string {
    return this.getAssetUrlWithTransform(fileId, {
      download: filename || true
    });
  }

  /**
   * Generar URL de thumbnail optimizada
   */
  getThumbnailUrl(fileId: string, size: number = 200): string {
    return this.getAssetUrlWithTransform(fileId, {
      width: size,
      height: size,
      fit: 'cover',
      quality: 80,
      format: 'webp'
    });
  }

  /**
   * Generar múltiples tamaños de imagen (responsive)
   */
  getResponsiveImageUrls(fileId: string): Record<string, string> {
    const sizes = [320, 640, 768, 1024, 1280, 1920];
    const urls: Record<string, string> = {};

    sizes.forEach(size => {
      urls[`${size}w`] = this.getAssetUrlWithTransform(fileId, {
        width: size,
        quality: 80,
        format: 'webp'
      });
    });

    return urls;
  }

  /**
   * Optimizar imagen para web
   */
  getOptimizedImageUrl(fileId: string, options: {
    width?: number;
    height?: number;
    quality?: number;
  } = {}): string {
    return this.getAssetUrlWithTransform(fileId, {
      width: options.width,
      height: options.height,
      quality: options.quality || 80,
      format: 'webp',
      fit: 'cover'
    });
  }

  /**
   * Buscar archivos por tipo MIME
   */
  async getFilesByType(mimeType: string, options: QueryOptions = {}): Promise<DirectusFile[]> {
    try {
      const searchOptions = {
        ...options,
        filters: {
          ...options.filters,
          type: mimeType
        }
      };

      const response = await this.getFiles(searchOptions);
      return response.data;
    } catch (error) {
      throw this.handleFileError(error, `Error fetching files of type ${mimeType}`);
    }
  }

  /**
   * Obtener archivos de imagen
   */
  async getImages(options: QueryOptions = {}): Promise<DirectusFile[]> {
    return this.getFilesByType('image/*', options);
  }

  /**
   * Obtener archivos de video
   */
  async getVideos(options: QueryOptions = {}): Promise<DirectusFile[]> {
    return this.getFilesByType('video/*', options);
  }

  /**
   * Obtener archivos de audio
   */
  async getAudios(options: QueryOptions = {}): Promise<DirectusFile[]> {
    return this.getFilesByType('audio/*', options);
  }

  /**
   * Obtener archivos de documento
   */
  async getDocuments(options: QueryOptions = {}): Promise<DirectusFile[]> {
    try {
      const documentTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'text/csv'
      ];

      const searchOptions = {
        ...options,
        filters: {
          ...options.filters,
          'type[_in]': documentTypes.join(',')
        }
      };

      const response = await this.getFiles(searchOptions);
      return response.data;
    } catch (error) {
      throw this.handleFileError(error, 'Error fetching document files');
    }
  }

  /**
   * Validar archivo antes de subir
   */
  private validateFile(file: File): void {
    const errors: string[] = [];

    // Validar tamaño
    if (file.size > this.config.maxFileSize) {
      const maxSizeMB = Math.round(this.config.maxFileSize / (1024 * 1024));
      errors.push(`File size exceeds ${maxSizeMB}MB limit`);
    }

    // Validar tipo
    if (this.config.allowedTypes.length > 0) {
      const isAllowed = this.config.allowedTypes.some(type => {
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.replace('/*', '/'));
        }
        return file.type === type;
      });

      if (!isAllowed) {
        errors.push(`File type ${file.type} is not allowed`);
      }
    }

    if (errors.length > 0) {
      throw new Error(`File validation failed: ${errors.join(', ')}`);
    }
  }

  /**
   * Manejo centralizado de errores de archivos
   */
  private handleFileError(error: any, defaultMessage: string): Error {
    if (error instanceof Error) {
      return error;
    }
    
    if (typeof error === 'object' && error.message) {
      return new Error(error.message);
    }
    
    return new Error(defaultMessage);
  }

  /**
   * Obtener información de archivo optimizada para UI
   */
  static getFileDisplayInfo(file: DirectusFile): {
    name: string;
    size: string;
    type: string;
    isImage: boolean;
    isVideo: boolean;
    isAudio: boolean;
    isDocument: boolean;
  } {
    const sizeInBytes = parseInt(file.filesize);
    const sizeInMB = sizeInBytes / (1024 * 1024);
    
    let sizeDisplay: string;
    if (sizeInMB >= 1) {
      sizeDisplay = `${sizeInMB.toFixed(1)} MB`;
    } else {
      const sizeInKB = sizeInBytes / 1024;
      sizeDisplay = `${sizeInKB.toFixed(1)} KB`;
    }

    return {
      name: file.filename_download || file.title || 'Untitled',
      size: sizeDisplay,
      type: file.type,
      isImage: file.type.startsWith('image/'),
      isVideo: file.type.startsWith('video/'),
      isAudio: file.type.startsWith('audio/'),
      isDocument: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ].includes(file.type)
    };
  }
}