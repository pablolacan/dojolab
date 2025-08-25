// src/modules/dashboard/hooks/use-system-monitoring.ts

import { useState, useEffect, useCallback } from 'react';

interface SystemIssue {
  url: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: string;
  type: 'https' | 'api' | 'ssl' | 'dns' | 'performance';
}

interface SystemStatus {
  issues: SystemIssue[];
  lastCheck: string;
  totalChecked: number;
  healthyCount: number;
}

interface UseSystemMonitoringReturn {
  systemStatus: SystemStatus | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

// Simulated monitoring data - en producción esto vendría de n8n
const simulateSystemCheck = async (): Promise<SystemStatus> => {
  // Simular delay de red
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Lista de sitios/APIs que monitoreamos
  const monitoredSites = [
    'https://dojolab.gt',
    'https://api.dojolab.gt',
    'https://cliente1.com',
    'https://cliente2.com',
    'https://api.cliente3.com'
  ];

  const issues: SystemIssue[] = [];
  
  // Simular problemas ocasionales (70% de probabilidad de estar OK)
  monitoredSites.forEach(url => {
    const hasIssue = Math.random() > 0.7; // 30% chance of issue
    
    if (hasIssue) {
      const issueTypes = [
        {
          type: 'https' as const,
          messages: [
            'HTTPS no response - timeout después de 30s',
            'SSL certificate expired hace 2 días', 
            'Connection refused en puerto 443'
          ]
        },
        {
          type: 'api' as const,
          messages: [
            'API devuelve 500 Internal Server Error',
            'API response time > 5000ms (muy lento)',
            'API devuelve 404 en endpoint principal'
          ]
        },
        {
          type: 'ssl' as const,
          messages: [
            'Certificado SSL expira en 7 días',
            'Certificado SSL no válido para este dominio',
            'SSL handshake falló'
          ]
        },
        {
          type: 'dns' as const,
          messages: [
            'DNS resolution failed',
            'DNS propagation incompleta',
            'MX records no configurados'
          ]
        },
        {
          type: 'performance' as const,
          messages: [
            'Página carga en >8 segundos',
            'Time to First Byte >3 segundos',
            'Core Web Vitals por debajo del umbral'
          ]
        }
      ];
      
      const randomIssueType = issueTypes[Math.floor(Math.random() * issueTypes.length)];
      const randomMessage = randomIssueType.messages[Math.floor(Math.random() * randomIssueType.messages.length)];
      
      // Determinar severidad basada en el tipo y mensaje
      let severity: SystemIssue['severity'] = 'warning';
      if (randomMessage.includes('expired') || randomMessage.includes('500') || randomMessage.includes('refused')) {
        severity = 'critical';
      } else if (randomMessage.includes('expira') || randomMessage.includes('lento')) {
        severity = 'warning';
      } else {
        severity = 'info';
      }
      
      issues.push({
        url,
        message: randomMessage,
        severity,
        timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(), // Random time in last hour
        type: randomIssueType.type
      });
    }
  });

  return {
    issues: issues.sort((a, b) => {
      // Sort by severity: critical -> warning -> info
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    }),
    lastCheck: new Date().toISOString(),
    totalChecked: monitoredSites.length,
    healthyCount: monitoredSites.length - issues.length
  };
};

export const useSystemMonitoring = (): UseSystemMonitoringReturn => {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSystemStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // En producción, esto sería una llamada a tu API que conecta con n8n
      // Por ahora simulamos los datos
      const status = await simulateSystemCheck();
      setSystemStatus(status);
    } catch (err: any) {
      console.error('Error checking system status:', err);
      setError(err.message || 'Error al verificar estado del sistema');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    fetchSystemStatus();
  }, [fetchSystemStatus]);

  useEffect(() => {
    fetchSystemStatus();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchSystemStatus, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [fetchSystemStatus]);

  return {
    systemStatus,
    isLoading,
    error,
    refresh
  };
};