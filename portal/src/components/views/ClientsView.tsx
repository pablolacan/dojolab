// src/components/views/ClientsView.tsx

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";

// Importar servicios y tipos
import { getApiServices } from "../../utils/api-client";
import type { Client, CreateClientData, ClientFilters, ClientStats } from "../../types/client";

// Importar formatters
import { 
  formatClientForDisplay, 
  formatClientStats,
  getClientFormOptions
} from "../../utils/formatters/client-formatter";

// Importar componentes UI
import { DataTable } from "../ui/DataTable";
import { Modal } from "../ui/Modal";
import { StatsGrid } from "../ui/StatsGrid";
import { StatusBadge } from "../ui/StatusBadge";
import { LoadingState } from "../ui/LoadingState";
import { ErrorState } from "../ui/ErrorState";
import { ClientForm } from "../forms/ClientForm";

type ViewMode = 'list' | 'create' | 'edit' | 'view';

export const ClientsView = () => {
  // Obtener servicios
  const { client: apiService } = useMemo(() => getApiServices(), []);

  // Estados principales
  const [clients, setClients] = useState<Client[]>([]);
  const [stats, setStats] = useState<ClientStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados de UI
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estados de filtrado y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<ClientFilters>({});

  // Obtener opciones del formulario
  const formOptions = getClientFormOptions();

  // Función de fetch de datos
  const fetchData = useCallback(async (force = false) => {
    if (loading && !force) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const [clientsResponse, statsData] = await Promise.all([
        apiService.getAll({ 
          search: searchTerm, 
          filters,
          limit: -1,
          includeRelations: false
        }),
        apiService.getStats()
      ]);
      
      setClients(clientsResponse.data);
      setStats(statsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error loading data';
      setError(errorMessage);
      console.error('Error fetching clients:', err);
    } finally {
      setLoading(false);
    }
  }, [apiService, searchTerm, filters]);

  // Cargar datos iniciales
  useEffect(() => {
    fetchData(true);
  }, []);

  // Búsqueda con debounce
  useEffect(() => {
    if (clients.length === 0) return;
    
    const timeoutId = setTimeout(() => {
      fetchData();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, filters, fetchData]);

  // Handlers CRUD
  const handleCreate = async (data: CreateClientData) => {
    try {
      setIsSubmitting(true);
      await apiService.create(data);
      await fetchData(true);
      setViewMode('list');
    } catch (error) {
      console.error('Error creating client:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (data: CreateClientData) => {
    if (!selectedClient) return;
    
    try {
      setIsSubmitting(true);
      await apiService.update(selectedClient.id, data);
      await fetchData(true);
      setViewMode('list');
      setSelectedClient(null);
    } catch (error) {
      console.error('Error updating client:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = async (data: CreateClientData) => {
    if (viewMode === 'create') {
      await handleCreate(data);
    } else {
      await handleEdit(data);
    }
  };

  const handleDelete = async () => {
    if (!selectedClient) return;

    try {
      setIsSubmitting(true);
      await apiService.delete(selectedClient.id);
      await fetchData(true);
      setShowDeleteModal(false);
      setSelectedClient(null);
    } catch (error) {
      console.error('Error deleting client:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error deleting client';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (id: number, status: Client['status']) => {
    try {
      await apiService.changeStatus(id, status);
      await fetchData(true);
    } catch (error) {
      console.error('Error changing status:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error changing status';
      setError(errorMessage);
    }
  };

  // Handlers de UI
  const openCreateModal = () => {
    setSelectedClient(null);
    setViewMode('create');
  };

  const openEditModal = (client: Client) => {
    setSelectedClient(client);
    setViewMode('edit');
  };

  const openViewModal = (client: Client) => {
    setSelectedClient(client);
    setViewMode('view');
  };

  const openDeleteModal = (client: Client) => {
    setSelectedClient(client);
    setShowDeleteModal(true);
  };

  const closeModals = () => {
    setViewMode('list');
    setSelectedClient(null);
    setShowDeleteModal(false);
  };

  // Configuración de estadísticas
  const statsConfig = useMemo(() => {
    if (!stats) return [];
    
    const formattedStats = formatClientStats(stats);
    
    return [
      {
        label: "Total",
        value: formattedStats.totalFormatted,
        icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
      },
      {
        label: "Activos",
        value: stats.active,
        icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      },
      {
        label: "Prospectos",
        value: stats.prospect,
        icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
      },
      {
        label: "Revenue Total",
        value: formattedStats.totalRevenueFormatted,
        icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" /></svg>
      }
    ];
  }, [stats]);

  // Configuración de columnas de la tabla
  const columns = useMemo(() => [
    {
      id: 'client',
      label: 'Cliente',
      accessor: 'name' as keyof Client,
      render: (_, item: Client) => { 
        const formatted = formatClientForDisplay(item);
        return (
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#c9f31d] rounded-full flex items-center justify-center">
              <span className="text-gray-900 font-semibold text-sm">
                {formatted.initials}
              </span>
            </div>
            <div>
              <p className="text-gray-900 font-medium text-caption">{formatted.name}</p>
              <p className="text-gray-500 text-xs text-body">{formatted.email.email}</p>
            </div>
          </div>
        );
      }
    },
    {
      id: 'status',
      label: 'Estado',
      accessor: 'status' as keyof Client,
      render: (value: string, item: Client) => {
        const formatted = formatClientForDisplay(item);
        return (
          <div className="flex items-center space-x-2">
            <StatusBadge 
              status={formatted.status} 
              variant={formatted.statusVariant} 
            />
            <select
              value={value}
              onChange={(e) => handleStatusChange(item.id, e.target.value as Client['status'])}
              className="text-xs border-none bg-transparent focus:outline-none"
            >
              {formOptions.statuses.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        );
      }
    },
    {
      id: 'contact',
      label: 'Contacto',
      accessor: 'phone' as keyof Client,
      render: (_: any, item: Client) => {
        const formatted = formatClientForDisplay(item);
        return (
          <div>
            <p className="text-gray-900 text-body">{formatted.phone}</p>
            {formatted.websites.length > 0 && (
              <p className="text-gray-500 text-xs">
                {formatted.websites[0].domain}
              </p>
            )}
          </div>
        );
      }
    },
    {
      id: 'created',
      label: 'Creado',
      accessor: 'date_created' as keyof Client,
      render: (_: any, item: Client) => {
        const formatted = formatClientForDisplay(item);
        return (
          <div>
            <p className="text-gray-900 text-body">{formatted.createdDate}</p>
            <p className="text-gray-500 text-xs">{formatted.relativeDate}</p>
          </div>
        );
      }
    },
    {
      id: 'actions',
      label: 'Acciones',
      accessor: (() => null) as any,
      render: (_: any, item: Client) => (
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
  ], [formOptions.statuses, handleStatusChange]);

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
        <span>Nuevo Cliente</span>
      </button>
    </div>
  ), [loading]);

  if (loading && clients.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingState message="Cargando clientes..." />
      </div>
    );
  }

  if (error && clients.length === 0) {
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2 text-heading">Clientes</h1>
            <p className="text-gray-600 text-body">Gestión completa de clientes y relaciones comerciales</p>
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
                placeholder="Buscar clientes..."
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
              {formOptions.statuses.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            
            <select
              value={filters.has_domains ? 'true' : ''}
              onChange={(e) => setFilters(prev => ({ ...prev, has_domains: e.target.value === 'true' || undefined }))}
              className="px-3 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-[#c9f31d]"
            >
              <option value="">Todos los clientes</option>
              <option value="true">Con dominios</option>
              <option value="false">Sin dominios</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Error banner */}
      {error && clients.length > 0 && (
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

      {/* Clients Table */}
      <DataTable
        title="Lista de Clientes"
        columns={columns}
        data={clients}
        loading={loading}
        onRowClick={openViewModal}
        emptyMessage="No hay clientes disponibles"
        headerActions={
          <div className="text-sm text-gray-600">
            {clients.length} clientes
          </div>
        }
      />

      {/* Modal para Crear/Editar */}
      <Modal
        isOpen={viewMode === 'create' || viewMode === 'edit'}
        onClose={closeModals}
        title={viewMode === 'create' ? 'Nuevo Cliente' : 'Editar Cliente'}
        size="lg"
      >
        <ClientForm
          client={selectedClient || undefined}
          onSubmit={handleFormSubmit}
          onCancel={closeModals}
          isLoading={isSubmitting}
          mode={viewMode === 'create' ? 'create' : 'edit'}
        />
      </Modal>

      {/* Modal de vista/detalles */}
      <Modal
        isOpen={viewMode === 'view'}
        onClose={closeModals}
        title="Detalles del Cliente"
        footer={
          <div className="flex space-x-3">
            <button
              onClick={() => selectedClient && openEditModal(selectedClient)}
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
        {selectedClient && (
          <div className="space-y-4">
            {/* Información básica */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-2xl">
                <label className="text-gray-600 text-sm text-caption">Nombre</label>
                <p className="text-gray-900 font-medium text-body">{selectedClient.name}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl">
                <label className="text-gray-600 text-sm text-caption">Estado</label>
                <div className="mt-1">
                  {(() => {
                    const formatted = formatClientForDisplay(selectedClient);
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
            
            {/* Contacto */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-2xl">
                <label className="text-gray-600 text-sm text-caption">Email</label>
                <p className="text-gray-900 text-body">{selectedClient.email}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl">
                <label className="text-gray-600 text-sm text-caption">Teléfono</label>
                <p className="text-gray-900 text-body">
                  {formatClientForDisplay(selectedClient).phone}
                </p>
              </div>
            </div>

            {/* Websites */}
            {selectedClient.websites && selectedClient.websites.length > 0 && (
              <div className="p-4 bg-gray-50 rounded-2xl">
                <label className="text-gray-600 text-sm text-caption">Sitios Web</label>
                <div className="mt-2 space-y-2">
                  {formatClientForDisplay(selectedClient).websites.map((website, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <a 
                        href={website.formattedUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 text-body"
                      >
                        {website.domain}
                      </a>
                      {website.isPrimary && (
                        <span className="bg-[#c9f31d] text-gray-900 px-2 py-1 rounded text-xs">
                          Principal
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fechas */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-2xl">
                <label className="text-gray-600 text-sm text-caption">Fecha de Creación</label>
                <p className="text-gray-900 text-body">
                  {formatClientForDisplay(selectedClient).createdDate}
                </p>
              </div>
              {selectedClient.date_updated && (
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <label className="text-gray-600 text-sm text-caption">Última Actualización</label>
                  <p className="text-gray-900 text-body">
                    {formatClientForDisplay(selectedClient).relativeDate}
                  </p>
                </div>
              )}
            </div>

            {/* Notas */}
            {selectedClient.notes && (
              <div className="p-4 bg-gray-50 rounded-2xl">
                <label className="text-gray-600 text-sm text-caption">Notas</label>
                <p className="text-gray-900 text-body whitespace-pre-wrap">{selectedClient.notes}</p>
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
            Esta acción eliminará el cliente <strong>{selectedClient?.name}</strong> y toda su información.
          </p>
          
          <p className="text-sm text-gray-500">
            Esta acción no se puede deshacer.
          </p>
        </div>
      </Modal>
    </div>
  );
};