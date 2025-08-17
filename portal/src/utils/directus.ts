// utils/directus.ts

const DIRECTUS_URL = 'https://api.thedojolab.com';

export interface DirectusResponse<T> {
  data: T;
}

export interface DirectusFile {
  id: string;
  storage: string;
  filename_disk: string;
  filename_download: string;
  title: string;
  type: string;
  filesize: string;
  width?: number;
  height?: number;
  duration?: number;
}

class DirectusClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }


  // Obtener información de un archivo
  async getFile(fileId: string): Promise<DirectusFile> {
    try {
      const response = await fetch(`${this.baseUrl}/files/${fileId}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching file: ${response.status}`);
      }

      const result: DirectusResponse<DirectusFile> = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching file:', error);
      throw error;
    }
  }

  // Generar URL del asset
  getAssetUrl(fileId: string): string {
    return `${this.baseUrl}/assets/${fileId}`;
  }

  // Generar URL del asset con transformaciones (para imágenes)
  getAssetUrlWithTransform(fileId: string, params: Record<string, string | number> = {}): string {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      searchParams.append(key, value.toString());
    });

    const queryString = searchParams.toString();
    return `${this.baseUrl}/assets/${fileId}${queryString ? `?${queryString}` : ''}`;
  }

}

// Instancia del cliente
export const directusClient = new DirectusClient(DIRECTUS_URL);

// Funciones de conveniencia
export const getAssetUrl = (fileId: string) => directusClient.getAssetUrl(fileId);
export const getFile = (fileId: string) => directusClient.getFile(fileId);