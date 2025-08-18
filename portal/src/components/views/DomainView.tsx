// src/components/views/DomainsView.tsx

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";

// Importar servicios y tipos
import { getApiServices } from "../../utils/api-client";
import type { Domain, Client, Provider, CreateDomainData, DomainFilters, DomainStats } from "../../types/domain";

// Importar formatters
import { 
  formatDomainForDisplay, 
  formatDomainStats, 
  formatDomainPrice,
  formatExpirationDate
} from "../../utils/formatters/domain-formatter";

// Importar componentes UI
import { DataTable } from "../ui/DataTable";
import { Modal } from "../ui/Modal";
import { StatsGrid } from "../ui/StatsGrid";
import { StatusBadge } from "../ui/StatusBadge";
import { LoadingState } from "../ui/LoadingState";
import { ErrorState } from "../ui/ErrorState";
import { DomainForm } from "../forms/DomainForm";

type ViewMode = 'list' | 'create' | 'edit' | 'view';

export const DomainsView = () => {
  // Obtener servicios
  const { domain: apiService } = useMemo(() => getApiServices(), []);

  // Estados principales
  const [domains, setDomains] = useState<Domain[]>([]);
  const [stats, setStats] = useState<DomainStats | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados de UI
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estados de filtrado y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<DomainFilters>({});

  // Función de fetch de datos
  const fetchData = useCallback(async (force = false) => {
    if (loading && !force) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const [domainsResponse, statsData] = await Promise.all([
        apiService.getAll({ 
          search: searchTerm, 
          filters,
          limit: -1,
          includeRelations: true
        }),
        apiService.getStats()
      ]);
      
      setDomains(domainsResponse.data);
      setStats(statsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error loading data';
      setError(errorMessage);
      console.error('Error fetching domains:', err);
    } finally {
      setLoading(false);
    }
  }, [apiService, searchTerm, filters]);

  // Cargar opciones para formularios
  const fetchFormOptions = useCallback(async () => {
    try {
      console.log('🔍 Fetching form options...');
      
      const [clientsData, providersData] = await Promise.all([
        apiService.getClients(),
        apiService.getProviders()
      ]);
      
      console.log('🔍 Clients response:', clientsData);
      console.log('🔍 Providers response:', providersData);
      
      setClients(clientsData);
      setProviders(providersData);
    } catch (err) {
      console.error('Error fetching form options:', err);
    }
  }, [apiService]);

  // Cargar datos iniciales
  useEffect(() => {
    fetchData(true);
    fetchFormOptions();
  }, []);

  // Búsqueda con debounce
  useEffect(() => {
    if (domains.length === 0) return;
    
    const timeoutId = setTimeout(() => {
      fetchData();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, filters, fetchData]);

  // Handlers CRUD
  const handleCreate = async (data: CreateDomainData) => {
    try {
      setIsSubmitting(true);
      await apiService.create(data);
      await fetchData(true);
      setViewMode('list');
    } catch (error) {
      console.error('Error creating domain:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (data: CreateDomainData) => {
    if (!selectedDomain) return;
    
    try {
      setIsSubmitting(true);
      await apiService.update(selectedDomain.id, data);
      await fetchData(true);
      setViewMode('list');
      setSelectedDomain(null);
    } catch (error) {
      console.error('Error updating domain:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = async (data: CreateDomainData) => {
    if (viewMode === 'create') {
      await handleCreate(data);
    } else {
      await handleEdit(data);
    }
  };

  const handleDelete = async () => {
    if (!selectedDomain) return;

    try {
      setIsSubmitting(true);
      await apiService.delete(selectedDomain.id);
      await fetchData(true);
      setShowDeleteModal(false);
      setSelectedDomain(null);
    } catch (error) {
      console.error('Error deleting domain:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error deleting domain';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handlers de UI
  const openCreateModal = () => {
    setSelectedDomain(null);
    setViewMode('create');
  };

  const openEditModal = (domain: Domain) => {
    setSelectedDomain(domain);
    setViewMode('edit');
  };

  const openViewModal = (domain: Domain) => {
    setSelectedDomain(domain);
    setViewMode('view');
  };

  const openDeleteModal = (domain: Domain) => {
    setSelectedDomain(domain);
    setShowDeleteModal(true);
  };

  const closeModals = () => {
    setViewMode('list');
    setSelectedDomain(null);
    setShowDeleteModal(false);
  };

  // Configuración de estadísticas
  const statsConfig = useMemo(() => {
    if (!stats) return [];
    
    const formattedStats = formatDomainStats(stats);
    
    return [
      {
        label: "Total",
        value: formattedStats.totalFormatted,
        icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" /></svg>
      },
      {
        label: "Activos",
        value: stats.active,
        icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      },
      {
        label: "Expiran Pronto",
        value: formattedStats.expirationAlerts.critical + formattedStats.expirationAlerts.warning,
        icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      },
      {
        label: "Costo Total",
        value: formattedStats.totalCostFormatted,
        icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" /></svg>
      }
    ];
  }, [stats]);

  // Configuración de columnas de la tabla
  const columns = useMemo(() => [
    {
      id: 'domain',
      label: 'Dominio',
      accessor: 'domain_' as keyof Domain,
      render: (value: string, item: Domain) => {
        const formatted = formatDomainForDisplay(item);
        return (
          <div>
            <p className="text-gray-900 font-medium text-caption">{value}</p>
            <p className="text-gray-500 text-xs text-body">Cliente: {formatted.clientName}</p>
          </div>
        );
      }
    },
    {
      id: 'status',
      label: 'Estado',
      accessor: 'status' as keyof Domain,
      render: (_: any, item: Domain) => {
        const formatted = formatDomainForDisplay(item);
        return (
          <StatusBadge 
            status={formatted.status} 
            variant={formatted.statusVariant} 
          />
        );
      }
    },
    {
      id: 'provider',
      label: 'Proveedor',
      accessor: 'provider_id' as keyof Domain,
      render: (_: any, item: Domain) => {
        const formatted = formatDomainForDisplay(item);
        return (
          <span className="text-gray-900 text-body">{formatted.providerName}</span>
        );
      }
    },
    {
      id: 'expiration',
      label: 'Expiración',
      accessor: 'expiration_date' as keyof Domain,
      render: (_: any, item: Domain) => {
        const formatted = formatDomainForDisplay(item);
        const { expirationStatus } = formatted;
        
        return (
          <div>
            <p className="text-gray-900 text-body">{formatted.expirationDate}</p>
            <p className={`text-xs font-medium`} style={{ color: expirationStatus.color }}>
              {expirationStatus.message}
            </p>
          </div>
        );
      }
    },
    {
      id: 'price',
      label: 'Precio',
      accessor: 'renewal_price' as keyof Domain,
      render: (value: string) => (
        <span className="text-gray-900 font-medium text-caption">{formatDomainPrice(value)}</span>
      )
    },
    {
      id: 'actions',
      label: 'Acciones',
      accessor: (() => null) as any,
      render: (_: any, item: Domain) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => openViewModal(item)}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded text-xs"
          >
            Ver
          </button>
          <button
            onClick={() => openEditModal(item)}
            className="text-green-600 hover:text-green-700 hover:bg-green-50 px-2 py-1 rounded text-xs"
          >
            Editar
          </button>
          <button
            onClick={() => openDeleteModal(item)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded text-xs"
          >
            Eliminar
          </button>
        </div>
      )
    }
  ], []);

  // Actions del header
  const headerActions = useMemo(() => (
    <div className="flex items-center space-x-3">
      <button 
        onClick={() => fetchData(true)}
        disabled={loading}
        className="bg-gray-100 text-gray-700 px-4 py-2 rounded-full hover:bg-gray-200 transition-all duration-200 flex items-center space-x-2 text-sm disabled:opacity-50"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span>Actualizar</span>
      </button>

      <button 
        onClick={openCreateModal}
        className="bg-[#c9f31d] text-gray-900 px-6 py-2 rounded-full hover:bg-[#b8e019] transition-all duration-200 flex items-center space-x-2 shadow-card hover:shadow-card-hover hover-lift text-sm font-medium"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        <span>Nuevo Dominio</span>
      </button>
    </div>
  ), [loading]);

  if (loading && domains.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingState message="Cargando dominios..." />
      </div>
    );
  }

  if (error && domains.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <ErrorState 
          message={error}
          onRetry={() => fetchData(true)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl p-6 border border-gray-100 shadow-card"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2 text-heading">Dominios</h1>
            <p className="text-gray-600 text-body">Gestión de dominios y fechas de expiración</p>
          </div>
          {headerActions}
        </div>

        {/* Barra de búsqueda y filtros */}
        <div className="mt-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Buscar dominios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:border-[#c9f31d] transition-all duration-200"
              />
            </div>
          </div>
          
          {/* Filtros rápidos */}
          <div className="flex gap-2">
            <select
              value={filters.status || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value || undefined }))}
              className="px-3 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-[#c9f31d]"
            >
              <option value="">Todos los estados</option>
              <option value="active">Activo</option>
              <option value="expired">Expirado</option>
              <option value="pending_transfer">Transferencia Pendiente</option>
            </select>
            
            <select
              value={filters.client_id || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, client_id: e.target.value ? parseInt(e.target.value) : undefined }))}
              className="px-3 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-[#c9f31d]"
            >
              <option value="">Todos los clientes</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      {/* Error banner */}
      {error && domains.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-red-50 border border-red-200 rounded-2xl p-4"
        >
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span className="text-red-700 text-sm">{error}</span>
            <button 
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </motion.div>
      )}

      {/* Stats */}
      {stats && <StatsGrid stats={statsConfig} />}

      {/* Domains Table */}
      <DataTable
        title="Lista de Dominios"
        columns={columns}
        data={domains}
        loading={loading}
        onRowClick={openViewModal}
        emptyMessage="No hay dominios disponibles"
        headerActions={
          <div className="text-sm text-gray-600">
            {domains.length} dominios
          </div>
        }
      />

      {/* Modal para Crear/Editar */}
      <Modal
        isOpen={viewMode === 'create' || viewMode === 'edit'}
        onClose={closeModals}
        title={viewMode === 'create' ? 'Nuevo Dominio' : 'Editar Dominio'}
        size="lg"
      >
        <DomainForm
          domain={selectedDomain || undefined}
          onSubmit={handleFormSubmit}
          onCancel={closeModals}
          isLoading={isSubmitting}
          mode={viewMode === 'create' ? 'create' : 'edit'}
          clients={clients}
          providers={providers}
        />
      </Modal>

      {/* Modal de vista/detalles */}
      <Modal
        isOpen={viewMode === 'view'}
        onClose={closeModals}
        title="Detalles del Dominio"
        footer={
          <div className="flex space-x-3">
            <button
              onClick={() => selectedDomain && openEditModal(selectedDomain)}
              className="bg-[#c9f31d] text-gray-900 px-6 py-2 rounded-full hover:bg-[#b8e019] transition-all duration-200 font-medium"
            >
              Editar
            </button>
            <button
              onClick={closeModals}
              className="bg-gray-100 text-gray-700 px-6 py-2 rounded-full hover:bg-gray-200 transition-all duration-200 font-medium"
            >
              Cerrar
            </button>
          </div>
        }
      >
        {selectedDomain && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-2xl">
                <label className="text-gray-600 text-sm text-caption">Dominio</label>
                <p className="text-gray-900 font-medium text-body">{selectedDomain.domain_}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl">
                <label className="text-gray-600 text-sm text-caption">Estado</label>
                <div className="mt-1">
                  {(() => {
                    const formatted = formatDomainForDisplay(selectedDomain);
                    return (
                      <StatusBadge 
                        status={formatted.status} 
                        variant={formatted.statusVariant} 
                      />
                    );
                  })()}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-2xl">
                <label className="text-gray-600 text-sm text-caption">Cliente</label>
                <p className="text-gray-900 text-body">
                  {formatDomainForDisplay(selectedDomain).clientName}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl">
                <label className="text-gray-600 text-sm text-caption">Proveedor</label>
                <p className="text-gray-900 text-body">
                  {formatDomainForDisplay(selectedDomain).providerName}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-2xl">
                <label className="text-gray-600 text-sm text-caption">Fecha de Expiración</label>
                <p className="text-gray-900 text-body">{formatExpirationDate(selectedDomain.expiration_date)}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl">
                <label className="text-gray-600 text-sm text-caption">Precio de Renovación</label>
                <p className="text-gray-900 font-medium text-body">{formatDomainPrice(selectedDomain.renewal_price)}</p>
              </div>
            </div>

            {selectedDomain.purchase_date && (
              <div className="p-4 bg-gray-50 rounded-2xl">
                <label className="text-gray-600 text-sm text-caption">Fecha de Compra</label>
                <p className="text-gray-900 text-body">{formatExpirationDate(selectedDomain.purchase_date)}</p>
              </div>
            )}

            {selectedDomain.dns_provider && (
              <div className="p-4 bg-gray-50 rounded-2xl">
                <label className="text-gray-600 text-sm text-caption">Proveedor DNS</label>
                <p className="text-gray-900 text-body">{selectedDomain.dns_provider}</p>
              </div>
            )}

            {selectedDomain.notes && (
              <div className="p-4 bg-gray-50 rounded-2xl">
                <label className="text-gray-600 text-sm text-caption">Notas</label>
                <p className="text-gray-900 text-body">{selectedDomain.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal de confirmación de eliminación */}
      <Modal
        isOpen={showDeleteModal}
        onClose={closeModals}
        title="Confirmar Eliminación"
        footer={
          <div className="flex space-x-3">
            <button
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-red-600 text-white px-6 py-2 rounded-full hover:bg-red-700 disabled:opacity-50 transition-all duration-200 font-medium"
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  <span>Eliminando...</span>
                </div>
              ) : (
                'Eliminar'
              )}
            </button>
            <button
              onClick={closeModals}
              disabled={isSubmitting}
              className="bg-gray-100 text-gray-700 px-6 py-2 rounded-full hover:bg-gray-200 disabled:opacity-50 transition-all duration-200 font-medium"
            >
              Cancelar
            </button>
          </div>
        }
      >
        <div className="text-center py-4">
          <div className="w-12 h-12 mx-auto bg-red-100 rounded-2xl flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            ¿Estás seguro?
          </h3>
          
          <p className="text-gray-600 mb-4">
            Esta acción eliminará el dominio <strong>{selectedDomain?.domain_}</strong>.
          </p>
          
          <p className="text-sm text-gray-500">
            Esta acción no se puede deshacer.
          </p>
        </div>
      </Modal>
    </div>
  );
};