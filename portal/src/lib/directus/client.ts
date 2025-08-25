import { createDirectus, rest, authentication } from '@directus/sdk';

// Verificar URL de Directus
const DIRECTUS_URL = import.meta.env.VITE_DIRECTUS_URL;

if (!DIRECTUS_URL) {
  throw new Error('VITE_DIRECTUS_URL is required in environment variables');
}

console.log('🔌 Connecting to Directus:', DIRECTUS_URL);

// Cliente Directus básico
export const directus = createDirectus(DIRECTUS_URL)
  .with(authentication('cookie', { 
    credentials: 'include',
    autoRefresh: true 
  }))
  .with(rest({
    credentials: 'include',
    onRequest: (options) => {
      // Log requests en desarrollo
      if (import.meta.env.VITE_APP_ENV === 'development') {
        console.log('📤 Directus Request:', options.method || 'GET');
      }
      return options;
    },
    onResponse: (response) => {
      // Log responses en desarrollo
      if (import.meta.env.VITE_APP_ENV === 'development') {
        console.log('📥 Directus Response:', response.status);
      }
      
      // Error handling global
      if (!response.ok) {
        console.error('❌ Directus API Error:', {
          status: response.status,
          statusText: response.statusText
        });
      }
      
      return response;
    }
  }));

// Test de conexión
export const testConnection = async (): Promise<boolean> => {
  try {
    console.log('🧪 Testing Directus connection...');
    
    // Hacer un request simple para probar la conexión
    const response = await fetch(`${DIRECTUS_URL}/server/ping`);
    
    if (response.ok) {
      console.log('✅ Directus connection successful');
      return true;
    } else {
      console.error('❌ Directus connection failed:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Directus connection error:', error);
    return false;
  }
};

export default directus;