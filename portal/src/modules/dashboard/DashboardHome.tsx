// src/modules/dashboard/DashboardHome.tsx

import React from 'react';
import { AlertTriangle, CheckCircle, Globe, Clock } from 'lucide-react';
import { useAuth } from '../../stores/auth-store';
import { useDashboardStats } from './hooks/use-dashboard-stats';
import { useSystemMonitoring } from './hooks/use-system-monitoring';
import { LoadingSpinner, Skeleton } from '../../components/ui/Pagination';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

const DashboardHome: React.FC = () => {
  const { user } = useAuth();
  const { 
    stats, 
    isLoading: statsLoading, 
    error: statsError,
    refresh: refreshStats 
  } = useDashboardStats();
  
  const { 
    systemStatus, 
    isLoading: monitoringLoading, 
    error: monitoringError,
    refresh: refreshMonitoring 
  } = useSystemMonitoring();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-heading text-white">
          Bienvenido de nuevo, {user?.first_name || user?.email}!
        </h1>
        <p className="text-zinc-400 mt-1">
          Aquí está el resumen de tu negocio hoy.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-12" />
            </div>
          ))
        ) : statsError ? (
          <div className="col-span-full bg-red-950/50 border border-red-800 rounded-lg p-4">
            <p className="text-red-400">Error cargando estadísticas: {statsError}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshStats}
              className="mt-2"
            >
              Reintentar
            </Button>
          </div>
        ) : (
          [
            { 
              title: 'Total Clientes', 
              value: stats?.totalClients || 0, 
              color: 'text-blue-400',
              change: stats?.clientsChange
            },
            { 
              title: 'Servicios Activos', 
              value: stats?.activeServices || 0, 
              color: 'text-green-400',
              change: stats?.servicesChange
            },
            { 
              title: 'Facturas Pendientes', 
              value: stats?.pendingInvoices || 0, 
              color: 'text-yellow-400',
              change: stats?.invoicesChange
            },
            { 
              title: 'Dominios por Vencer', 
              value: stats?.expiringDomains || 0, 
              color: 'text-red-400',
              urgent: (stats?.expiringDomains || 0) > 0
            },
          ].map((stat, index) => (
            <div key={index} className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-400">
                    {stat.title}
                  </p>
                  <p className={`text-2xl font-bold ${stat.color}`}>
                    {stat.value}
                  </p>
                  {stat.change && (
                    <p className={`text-xs mt-1 ${
                      stat.change > 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {stat.change > 0 ? '+' : ''}{stat.change} este mes
                    </p>
                  )}
                </div>
                {stat.urgent && (
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* System Monitoring */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg">
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Estado del Sistema
            </h3>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={refreshMonitoring}
              disabled={monitoringLoading}
            >
              {monitoringLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <Clock className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="p-6">
          {monitoringLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : monitoringError ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
              <p className="text-zinc-400">Error al verificar sistemas</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refreshMonitoring}
                className="mt-2"
              >
                Reintentar
              </Button>
            </div>
          ) : !systemStatus?.issues || systemStatus.issues.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-white mb-2">
                Todo funciona correctamente
              </h4>
              <p className="text-zinc-400">
                Todos los sistemas están operativos
              </p>
              <p className="text-xs text-zinc-500 mt-2">
                Última verificación: {systemStatus?.lastCheck 
                  ? new Date(systemStatus.lastCheck).toLocaleString('es-ES')
                  : 'Nunca'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
                <h4 className="font-semibold text-white">
                  Problemas Detectados ({systemStatus.issues.length})
                </h4>
              </div>

              {systemStatus.issues.map((issue, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-4 bg-zinc-800 border border-zinc-700 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <AlertTriangle className={`h-5 w-5 ${
                        issue.severity === 'critical' ? 'text-red-400' : 
                        issue.severity === 'warning' ? 'text-yellow-400' : 
                        'text-blue-400'
                      }`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="font-medium text-white">
                          {issue.url}
                        </h5>
                        <Badge variant={
                          issue.severity === 'critical' ? 'destructive' : 
                          issue.severity === 'warning' ? 'warning' : 
                          'info'
                        }>
                          {issue.severity === 'critical' ? 'Crítico' : 
                           issue.severity === 'warning' ? 'Advertencia' : 
                           'Info'}
                        </Badge>
                      </div>
                      <p className="text-sm text-zinc-400 mt-1">
                        {issue.message}
                      </p>
                      <p className="text-xs text-zinc-500">
                        Detectado: {new Date(issue.timestamp).toLocaleString('es-ES')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(issue.url, '_blank')}
                    >
                      Verificar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Acciones Rápidas
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Nuevo Cliente', href: '/clients/new' },
            { label: 'Crear Factura', href: '/invoices/new' }, 
            { label: 'Agregar Servicio', href: '/services/new' },
            { label: 'Registrar Dominio', href: '/domains/new' }
          ].map((action, index) => (
            <button
              key={index}
              className="p-4 border border-zinc-700 rounded-lg hover:border-lime-300 hover:bg-zinc-800 transition-colors text-left group"
              onClick={() => {
                // TODO: Implementar navegación o modales
                console.log(`Navigate to ${action.href}`);
              }}
            >
              <p className="text-sm font-medium text-white group-hover:text-lime-300">
                {action.label}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;