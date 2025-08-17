// src/components/views/SubscriptionsView.tsx - Versión optimizada sin loops

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { subscriptionService } from "../../services/subscriptionService";
import type { Subscription } from "../../types";
import type { 
  SubscriptionFilters, 
  CreateSubscriptionData, 
  UpdateSubscriptionData,
  SubscriptionStats
} from "../../services/subscriptionService";
import { 
  getStatusText, 
  getPlanTypeText, 
  getBillingCycleText, 
  getStatusVariant, 
  getPlanTypeVariant 
} from "../../utils/text-mappings";
import { DataTable } from "../ui/DataTable";
import { Modal } from "../ui/Modal";
import { StatsGrid } from "../ui/StatsGrid";
import { StatusBadge } from "../ui/StatusBadge";
import { LoadingState } from "../ui/LoadingState";
import { ErrorState } from "../ui/ErrorState";
import { SubscriptionForm } from "../forms/SubscriptionForm";

type ViewMode = 'list' | 'create' | 'edit' | 'view';

export const SubscriptionsView = () => {
  // Estados principales
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [stats, setStats] = useState<SubscriptionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados de UI
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estados de filtrado y búsqueda - memoizados para evitar re-renders
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<SubscriptionFilters>({});
  const [selectedItems, setSelectedItems] = useState<number[]>([]);

  // Función de fetch optimizada con useCallback
  const fetchData = useCallback(async (force = false) => {
    if (loading && !force) return; // Evitar múltiples llamadas concurrentes
    
    try {
      setLoading(true);
      setError(null);
      
      const [subscriptionsData, statsData] = await Promise.all([
        subscriptionService.getSubscriptions({ search: searchTerm, filters }),
        subscriptionService.getSubscriptionStats()
      ]);
      
      setSubscriptions(subscriptionsData.data);
      setStats(statsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading data');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filters]); // Solo depende de searchTerm y filters

  // Cargar datos iniciales solo una vez
  useEffect(() => {
    fetchData(true);
  }, []); // Array vacío para ejecutar solo al montar

  // Búsqueda con debounce para evitar llamadas excesivas
  useEffect(() => {
    if (subscriptions.length === 0) return; // No buscar si no hay datos iniciales
    
    const timeoutId = setTimeout(() => {
      fetchData();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, filters]); // Removido fetchData de las dependencias

  // Handlers para CRUD operations
  const handleCreate = async (data: CreateSubscriptionData) => {
    try {
      setIsSubmitting(true);
      await subscriptionService.createSubscription(data);
      await fetchData(true);
      setViewMode('list');
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (data: CreateSubscriptionData) => {
    if (!selectedSubscription) return;
    
    try {
      setIsSubmitting(true);
      const updateData: UpdateSubscriptionData = { ...data };
      await subscriptionService.updateSubscription(selectedSubscription.id, updateData);
      await fetchData(true);
      setViewMode('list');
      setSelectedSubscription(null);
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = async (data: CreateSubscriptionData) => {
    if (viewMode === 'create') {
      await handleCreate(data);
    } else {
      await handleEdit(data);
    }
  };

  const handleDelete = async (id?: number) => {
    const itemsToDelete = id ? [id] : selectedItems;
    
    if (itemsToDelete.length === 0) return;

    try {
      setIsSubmitting(true);
      
      if (itemsToDelete.length === 1) {
        await subscriptionService.deleteSubscription(itemsToDelete[0]);
      } else {
        await subscriptionService.bulkDeleteSubscriptions(itemsToDelete);
      }
      
      await fetchData(true);
      setSelectedItems([]);
      setShowDeleteModal(false);
      setSelectedSubscription(null);
    } catch (error) {
      console.error('Error deleting subscription(s):', error);
      setError(error instanceof Error ? error.message : 'Error deleting items');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (id: number, status: Subscription['status']) => {
    try {
      await subscriptionService.changeSubscriptionStatus(id, status);
      await fetchData(true);
    } catch (error) {
      console.error('Error changing status:', error);
      setError(error instanceof Error ? error.message : 'Error changing status');
    }
  };

  // Handlers de UI
  const openCreateModal = () => {
    setSelectedSubscription(null);
    setViewMode('create');
  };

  const openEditModal = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setViewMode('edit');
  };

  const openViewModal = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setViewMode('view');
  };

  const openDeleteModal = (subscription?: Subscription) => {
    if (subscription) {
      setSelectedSubscription(subscription);
    }
    setShowDeleteModal(true);
  };

  const closeModals = () => {
    setViewMode('list');
    setSelectedSubscription(null);
    setShowDeleteModal(false);
  };

  // Utilidades memoizadas
  const formatCurrency = useCallback((amount: string) => {
    const num = parseFloat(amount);
    return num === 0 ? 'Gratis' : `$${num.toFixed(2)}`;
  }, []);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, []);

  // Configuración de estadísticas memoizada
  const statsConfig = useMemo(() => stats ? [
    {
      label: "Total",
      value: stats.total,
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
    },
    {
      label: "Activas",
      value: stats.active,
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    },
    {
      label: "Pendientes",
      value: stats.pending,
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    },
    {
      label: "Costo Total",
      value: `$${stats.totalCost.toFixed(2)}`,
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" /></svg>
    }
  ] : [], [stats]);

  // Configuración de columnas memoizada
  const columns = useMemo(() => [
    {
      id: 'service',
      label: 'Servicio',
      accessor: 'service_name' as keyof Subscription,
      render: (value: string, item: Subscription) => (
        <div>
          <p className="text-gray-900 font-medium text-caption">{value}</p>
          <p className="text-gray-500 text-xs text-body">ID: {item.id}</p>
        </div>
      )
    },
    {
      id: 'status',
      label: 'Estado',
      accessor: 'status' as keyof Subscription,
      render: (value: string, item: Subscription) => (
        <div className="flex items-center space-x-2">
          <StatusBadge 
            status={getStatusText(value)} 
            variant={getStatusVariant(value)} 
          />
          <select
            value={value}
            onChange={(e) => handleStatusChange(item.id, e.target.value as Subscription['status'])}
            className="text-xs border-none bg-transparent focus:outline-none"
          >
            <option value="pending">Pendiente</option>
            <option value="active">Activo</option>
            <option value="trialing">Prueba</option>
            <option value="cancelled">Cancelado</option>
            <option value="expired">Expirado</option>
          </select>
        </div>
      )
    },
    {
      id: 'plan_type',
      label: 'Plan',
      accessor: 'plan_type' as keyof Subscription,
      render: (value: string) => (
        <StatusBadge 
          status={getPlanTypeText(value)} 
          variant={getPlanTypeVariant(value)} 
        />
      )
    },
    {
      id: 'billing_cycle',
      label: 'Ciclo',
      accessor: 'billing_cycle' as keyof Subscription,
      render: (value: string) => (
        <span className="text-gray-900 text-body">{getBillingCycleText(value)}</span>
      )
    },
    {
      id: 'cost',
      label: 'Costo',
      accessor: 'cost' as keyof Subscription,
      render: (value: string) => (
        <span className="text-gray-900 font-medium text-caption">{formatCurrency(value)}</span>
      )
    },
    {
      id: 'renewal_date',
      label: 'Renovación',
      accessor: 'renewal_date' as keyof Subscription,
      render: (value: string) => (
        <span className="text-gray-900 text-body">{formatDate(value)}</span>
      )
    },
    {
      id: 'actions',
      label: 'Acciones',
      accessor: (() => null) as any,
      render: (_: any, item: Subscription) => (
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
  ], [formatCurrency, formatDate, handleStatusChange, openViewModal, openEditModal, openDeleteModal]);

  // Actions del header memoizado
  const headerActions = useMemo(() => (
    <div className="flex items-center space-x-3">
      {selectedItems.length > 0 && (
        <button 
          onClick={() => openDeleteModal()}
          className="bg-red-600 text-white px-4 py-2 rounded-full hover:bg-red-700 transition-all duration-200 flex items-center space-x-2 text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span>Eliminar ({selectedItems.length})</span>
        </button>
      )}
      
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
        <span>Nueva Suscripción</span>
      </button>
    </div>
  ), [selectedItems.length, loading, fetchData, openDeleteModal, openCreateModal]);

  if (loading && subscriptions.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingState message="Cargando suscripciones..." />
      </div>
    );
  }

  if (error && subscriptions.length === 0) {
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2 text-heading">Suscripciones</h1>
            <p className="text-gray-600 text-body">Gestión completa de servicios y suscripciones</p>
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
                placeholder="Buscar suscripciones..."
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
              <option value="pending">Pendiente</option>
              <option value="trialing">Prueba</option>
              <option value="cancelled">Cancelado</option>
              <option value="expired">Expirado</option>
            </select>
            
            <select
              value={filters.plan_type || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, plan_type: e.target.value || undefined }))}
              className="px-3 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-[#c9f31d]"
            >
              <option value="">Todos los planes</option>
              <option value="free">Gratis</option>
              <option value="paid">Pago</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Error banner */}
      {error && subscriptions.length > 0 && (
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

      {/* Subscriptions Table */}
      <DataTable
        title="Lista de Suscripciones"
        columns={columns}
        data={subscriptions}
        loading={loading}
        onRowClick={openViewModal}
        emptyMessage="No hay suscripciones disponibles"
        headerActions={
          <div className="text-sm text-gray-600">
            {subscriptions.length} suscripciones
          </div>
        }
      />

      {/* Modal para Crear/Editar */}
      <Modal
        isOpen={viewMode === 'create' || viewMode === 'edit'}
        onClose={closeModals}
        title={viewMode === 'create' ? 'Nueva Suscripción' : 'Editar Suscripción'}
        size="lg"
      >
        <SubscriptionForm
          subscription={selectedSubscription || undefined}
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
        title="Detalles de Suscripción"
        footer={
          <div className="flex space-x-3">
            <button
              onClick={() => selectedSubscription && openEditModal(selectedSubscription)}
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
        {selectedSubscription && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-2xl">
                <label className="text-gray-600 text-sm text-caption">Servicio</label>
                <p className="text-gray-900 font-medium text-body">{selectedSubscription.service_name}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl">
                <label className="text-gray-600 text-sm text-caption">ID</label>
                <p className="text-gray-900 text-body">{selectedSubscription.id}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-2xl">
                <label className="text-gray-600 text-sm text-caption">Estado</label>
                <div className="mt-1">
                  <StatusBadge 
                    status={getStatusText(selectedSubscription.status)} 
                    variant={getStatusVariant(selectedSubscription.status)} 
                  />
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl">
                <label className="text-gray-600 text-sm text-caption">Tipo de Plan</label>
                <div className="mt-1">
                  <StatusBadge 
                    status={getPlanTypeText(selectedSubscription.plan_type)} 
                    variant={getPlanTypeVariant(selectedSubscription.plan_type)} 
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-2xl">
                <label className="text-gray-600 text-sm text-caption">Ciclo de Facturación</label>
                <p className="text-gray-900 text-body">{getBillingCycleText(selectedSubscription.billing_cycle)}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl">
                <label className="text-gray-600 text-sm text-caption">Costo</label>
                <p className="text-gray-900 font-medium text-body">{formatCurrency(selectedSubscription.cost)}</p>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-2xl">
              <label className="text-gray-600 text-sm text-caption">Fecha de Renovación</label>
              <p className="text-gray-900 text-body">{formatDate(selectedSubscription.renewal_date)}</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-2xl">
              <label className="text-gray-600 text-sm text-caption">Fecha de Creación</label>
              <p className="text-gray-900 text-body">{formatDate(selectedSubscription.date_created)}</p>
            </div>

            {selectedSubscription.date_updated && (
              <div className="p-4 bg-gray-50 rounded-2xl">
                <label className="text-gray-600 text-sm text-caption">Última Actualización</label>
                <p className="text-gray-900 text-body">{formatDate(selectedSubscription.date_updated)}</p>
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
              onClick={() => handleDelete()}
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
            {selectedSubscription ? (
              <>Esta acción eliminará la suscripción <strong>{selectedSubscription.service_name}</strong>.</>
            ) : (
              <>Esta acción eliminará <strong>{selectedItems.length}</strong> suscripciones seleccionadas.</>
            )}
          </p>
          
          <p className="text-sm text-gray-500">
            Esta acción no se puede deshacer.
          </p>
        </div>
      </Modal>
    </div>
  );
};