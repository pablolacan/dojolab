// src/utils/notifications.ts

type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface NotificationOptions {
  title?: string;
  message: string;
  type: NotificationType;
  duration?: number;
}

// Simple notification system - en una aplicación real usarías una librería como react-hot-toast
export const showNotification = ({ title, message, type }: NotificationOptions) => {
  // Por ahora solo console.log, pero aquí integrarías tu sistema de notificaciones
  const icon = {
    success: '✅',
    error: '❌', 
    warning: '⚠️',
    info: 'ℹ️'
  }[type];

  console.log(`${icon} ${title ? `${title}: ` : ''}${message}`);
  
  // En una implementación real crearías elementos DOM o usarías un estado global
  // Ejemplo simple con alert para demostración:
  if (type === 'error') {
    // Solo mostrar errores críticos
    console.error(message);
  }
};

// Helpers específicos
export const notifySuccess = (message: string, title?: string) => 
  showNotification({ message, title, type: 'success' });

export const notifyError = (message: string, title?: string) => 
  showNotification({ message, title, type: 'error' });

export const notifyWarning = (message: string, title?: string) => 
  showNotification({ message, title, type: 'warning' });

export const notifyInfo = (message: string, title?: string) => 
  showNotification({ message, title, type: 'info' });

// Notificaciones específicas para suscripciones
export const subscriptionNotifications = {
  created: (serviceName: string) => 
    notifySuccess(`Suscripción "${serviceName}" creada exitosamente`, 'Creada'),
  
  updated: (serviceName: string) => 
    notifySuccess(`Suscripción "${serviceName}" actualizada exitosamente`, 'Actualizada'),
  
  deleted: (serviceName: string) => 
    notifySuccess(`Suscripción "${serviceName}" eliminada exitosamente`, 'Eliminada'),
    
  bulkDeleted: (count: number) => 
    notifySuccess(`${count} suscripciones eliminadas exitosamente`, 'Eliminadas'),
  
  statusChanged: (serviceName: string, newStatus: string) => 
    notifyInfo(`Estado de "${serviceName}" cambiado a "${newStatus}"`, 'Estado actualizado'),
  
  createError: (error: string) => 
    notifyError(`Error al crear suscripción: ${error}`, 'Error de creación'),
  
  updateError: (error: string) => 
    notifyError(`Error al actualizar suscripción: ${error}`, 'Error de actualización'),
  
  deleteError: (error: string) => 
    notifyError(`Error al eliminar suscripción: ${error}`, 'Error de eliminación'),
  
  loadError: (error: string) => 
    notifyError(`Error al cargar suscripciones: ${error}`, 'Error de carga')
};