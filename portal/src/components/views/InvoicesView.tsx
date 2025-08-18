// src/components/views/InvoicesView.tsx

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";

// Importar servicios y tipos
import { getApiServices, getApiClient } from "../../utils/api-client";
import type { Invoice, CreateInvoiceData, InvoiceFilters, InvoiceStats } from "../../types/invoice";
import type { ClientOption } from "../../types/client";

// Importar formatters
import { 
  formatInvoiceForDisplay, 
  formatInvoiceStats,
  getInvoiceFormOptions,
  formatInvoiceAmount,
  formatInvoiceDate
} from "../../utils/formatters/invoice-formatter";

// Importar componentes UI
import { DataTable } from "../ui/DataTable";
import { Modal } from "../ui/Modal";
import { StatsGrid } from "../ui/StatsGrid";
import { StatusBadge } from "../ui/StatusBadge";
import { LoadingState } from "../ui/LoadingState";
import { ErrorState } from "../ui/ErrorState";
import { InvoiceForm } from "../forms/InvoiceForm";

type ViewMode = 'list' | 'create' | 'edit' | 'view';

export const InvoicesView = () => {
  // Obtener servicios
  const { invoice: apiService, client: clientService } = useMemo(() => getApiServices(), []);

  // Estados principales
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<InvoiceStats | null>(null);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados de UI
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estados de filtrado y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<InvoiceFilters>({});

  // Obtener opciones del formulario
  const formOptions = getInvoiceFormOptions();

  // Función de fetch de datos
  const fetchData = useCallback(async (force = false) => {
    if (loading && !force) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const [invoicesResponse, statsData] = await Promise.all([
        apiService.getAll({ 
          search: searchTerm, 
          filters,
          limit: -1,
          includeRelations: true
        }),
        apiService.getStats()
      ]);
      
      setInvoices(invoicesResponse.data);
      setStats(statsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error loading data';
      setError(errorMessage);
      console.error('Error fetching invoices:', err);
    } finally {
      setLoading(false);
    }
  }, [apiService, searchTerm, filters]);

  // Cargar opciones para formularios
  const fetchFormOptions = useCallback(async () => {
    try {
      console.log('🔍 Fetching form options...');
      
      const clientsData = await clientService.getOptions();
      
      console.log('🔍 Clients response:', clientsData);
      
      setClients(clientsData);
    } catch (err) {
      console.error('Error fetching form options:', err);
    }
  }, [clientService]);

  // Cargar datos iniciales
  useEffect(() => {
    fetchData(true);
    fetchFormOptions();
  }, []);

  // Búsqueda con debounce
  useEffect(() => {
    if (invoices.length === 0) return;
    
    const timeoutId = setTimeout(() => {
      fetchData();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, filters, fetchData]);

  // Generar número de factura automático
  const generateInvoiceNumber = useCallback(async (): Promise<string> => {
    try {
      return await apiService.generateInvoiceNumber();
    } catch (error) {
      console.error('Error generating invoice number:', error);
      throw new Error('No se pudo generar el número de factura');
    }
  }, [apiService]);

  // Subir archivo directamente a Directus
  const handleFileUpload = useCallback(async (file: File): Promise<string> => {
    try {
      console.log('🔧 Preparing file upload:', {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size
      });

      // Crear FormData para multipart/form-data
      const formData = new FormData();
      formData.append('file', file);
      
      // Log FormData content (solo para debug)
      console.log('📦 FormData prepared with entries:');
      for (let pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }
      
      // Obtener token usando el sistema de la aplicación
      let token = null;
      
      // 1. Intentar desde TokenManager (método principal)
      try {
        const apiClient = getApiClient();
        const tokenManager = apiClient.getApiFactory().getUtility('tokenManager');
        token = tokenManager.getAccessToken();
        console.log('🔑 Token from TokenManager:', token ? `Found (${token.length} chars)` : 'Not found');
      } catch (error) {
        console.warn('Could not get token from TokenManager:', error);
      }
      
      // 2. Fallback: obtener directamente desde localStorage
      if (!token) {
        token = localStorage.getItem('directus_access_token');
        console.log('🔑 Token from localStorage:', token ? `Found (${token.length} chars)` : 'Not found');
      }
      
      // 3. Último fallback: intentar desde AuthService
      if (!token) {
        try {
          const apiServices = getApiServices();
          if (apiServices.auth) {
            await apiServices.auth.ensureValidToken();
            const tokenManager = getApiClient().getApiFactory().getUtility('tokenManager');
            token = tokenManager.getAccessToken();
            console.log('🔑 Token after ensureValidToken:', token ? `Found (${token.length} chars)` : 'Not found');
          }
        } catch (error) {
          console.warn('Could not ensure valid token:', error);
        }
      }
      
      if (!token) {
        throw new Error('No se encontró token de autenticación. Por favor, inicia sesión nuevamente.');
      }
      
      const apiUrl = import.meta.env.VITE_API_URL || 'https://api.thedojolab.com';
      
      console.log('🌐 Making request to:', `${apiUrl}/files`);
      
      // Realizar upload directo a Directus
      const response = await fetch(`${apiUrl}/files`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // NO establecer Content-Type - el navegador lo hace automáticamente con boundary
        },
        body: formData
      });

      console.log('📡 Response status:', response.status, response.statusText);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Upload failed - Response body:', errorData);
        
        // Manejar errores específicos
        if (response.status === 401) {
          throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        } else if (response.status === 413) {
          throw new Error('El archivo es demasiado grande.');
        } else if (response.status === 415) {
          throw new Error('Tipo de archivo no permitido.');
        } else {
          throw new Error(`Error del servidor (${response.status}): ${response.statusText}`);
        }
      }

      const result = await response.json();
      console.log('✅ Upload success - Full response:', result);
      
      if (!result.data || !result.data.id) {
        console.error('❌ Invalid response structure:', result);
        throw new Error('Respuesta inválida del servidor');
      }
      
      return result.data.id; // Retorna el UUID del archivo
    } catch (error) {
      console.error('💥 Upload error:', error);
      
      // Re-lanzar el error con mensaje más específico
      if (error instanceof Error) {
        throw error;
      } else if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Error de conexión con el servidor');
      } else {
        throw new Error('No se pudo subir el archivo');
      }
    }
  }, []);

  // Handlers CRUD
  const handleCreate = async (data: CreateInvoiceData) => {
    try {
      setIsSubmitting(true);
      await apiService.create(data);
      await fetchData(true);
      setViewMode('list');
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (data: CreateInvoiceData) => {
    if (!selectedInvoice) return;
    
    try {
      setIsSubmitting(true);
      await apiService.update(selectedInvoice.id, data);
      await fetchData(true);
      setViewMode('list');
      setSelectedInvoice(null);
    } catch (error) {
      console.error('Error updating invoice:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = async (data: CreateInvoiceData) => {
    if (viewMode === 'create') {
      await handleCreate(data);
    } else {
      await handleEdit(data);
    }
  };

  const handleDelete = async () => {
    if (!selectedInvoice) return;

    try {
      setIsSubmitting(true);
      await apiService.delete(selectedInvoice.id);
      await fetchData(true);
      setShowDeleteModal(false);
      setSelectedInvoice(null);
    } catch (error) {
      console.error('Error deleting invoice:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error deleting invoice';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (id: number, status: Invoice['status']) => {
    try {
      await apiService.changeStatus(id, status);
      await fetchData(true);
    } catch (error) {
      console.error('Error changing status:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error changing status';
      setError(errorMessage);
    }
  };

  const handleMarkAsPaid = async (id: number) => {
    try {
      await apiService.markAsPaid(id);
      await fetchData(true);
    } catch (error) {
      console.error('Error marking as paid:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error marking as paid';
      setError(errorMessage);
    }
  };

  const handleMarkAsSent = async (id: number) => {
    try {
      await apiService.markAsSent(id);
      await fetchData(true);
    } catch (error) {
      console.error('Error marking as sent:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error marking as sent';
      setError(errorMessage);
    }
  };

  // Handlers de UI
  const openCreateModal = () => {
    setSelectedInvoice(null);
    setViewMode('create');
  };

  const openEditModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setViewMode('edit');
  };

  const openViewModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setViewMode('view');
  };

  const openDeleteModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowDeleteModal(true);
  };

  const closeModals = () => {
    setViewMode('list');
    setSelectedInvoice(null);
    setShowDeleteModal(false);
  };

  // Configuración de estadísticas
  const statsConfig = useMemo(() => {
    if (!stats) return [];
    
    const formattedStats = formatInvoiceStats(stats);
    
    return [
      {
        label: "Total",
        value: formattedStats.totalFormatted,
        icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
      },
      {
        label: "Pagadas",
        value: stats.paid,
        icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      },
      {
        label: "Atrasadas",
        value: stats.overdue,
        icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      },
      {
        label: "Total Facturado",
        value: formattedStats.totalAmountFormatted,
        icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" /></svg>
      }
    ];
  }, [stats]);

  // Configuración de columnas de la tabla
  const columns = useMemo(() => [
    {
      id: 'invoice',
      label: 'Factura',
      accessor: 'invoice_number' as keyof Invoice,
      render: (_value: string, item: Invoice) => {
        const formatted = formatInvoiceForDisplay(item);
        return (
          <div>
            <p className="text-gray-900 font-medium text-caption">{formatted.formattedNumber}</p>
            <p className="text-gray-500 text-xs text-body">Cliente: {formatted.clientName}</p>
          </div>
        );
      }
    },
    {
      id: 'status',
      label: 'Estado',
      accessor: 'status' as keyof Invoice,
      render: (value: string, item: Invoice) => {
        const formatted = formatInvoiceForDisplay(item);
        return (
          <div className="flex items-center space-x-2">
            <StatusBadge 
              status={formatted.status} 
              variant={formatted.statusVariant} 
            />
            <select
              value={value}
              onChange={(e) => handleStatusChange(item.id, e.target.value as Invoice['status'])}
              className="text-xs border-none bg-transparent focus:outline-none"
            >
              {formOptions.statuses.map((option: any) => (
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
      id: 'amount',
      label: 'Monto',
      accessor: 'amount' as keyof Invoice,
      render: (_value: string, item: Invoice) => {
        const formatted = formatInvoiceForDisplay(item);
        return (
          <span className="text-gray-900 font-medium text-caption">{formatted.amount}</span>
        );
      }
    },
    {
      id: 'date',
      label: 'Fecha',
      accessor: 'invoice_date' as keyof Invoice,
      render: (_value: string, item: Invoice) => {
        const formatted = formatInvoiceForDisplay(item);
        return (
          <div>
            <p className="text-gray-900 text-body">{formatted.date}</p>
            <p className={`text-xs font-medium`} style={{ color: formatted.daysInfo.status === 'overdue' ? '#ef4444' : '#6B7280' }}>
              {formatted.relativeDate}
            </p>
          </div>
        );
      }
    },
    {
      id: 'file',
      label: 'Archivo',
      accessor: 'invoice_file' as keyof Invoice,
      render: (_value: any, item: Invoice) => {
        if (item.invoice_file) {
          const apiUrl = import.meta.env.VITE_API_URL || 'https://api.thedojolab.com';
          return (
            <a
              href={`${apiUrl}/assets/${item.invoice_file}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 text-xs"
              download
              onClick={(e) => e.stopPropagation()} // Evitar que abra el modal al hacer clic
            >
              📄 Archivo
            </a>
          );
        }
        return <span className="text-gray-400 text-xs">Sin archivo</span>;
      }
    },
    {
      id: 'actions',
      label: 'Acciones',
      accessor: (() => null) as any,
      render: (_: any, item: Invoice) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => openViewModal(item)}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded text-xs"
          >
            Ver
          </button>
          {item.status !== 'paid' && (
            <>
              <button
                onClick={() => openEditModal(item)}
                className="text-green-600 hover:text-green-700 hover:bg-green-50 px-2 py-1 rounded text-xs"
              >
                Editar
              </button>
              {item.status === 'draft' && (
                <button
                  onClick={() => handleMarkAsSent(item.id)}
                  className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 px-2 py-1 rounded text-xs"
                >
                  Enviar
                </button>
              )}
              {(item.status === 'sent' || item.status === 'overdue') && (
                <button
                  onClick={() => handleMarkAsPaid(item.id)}
                  className="text-green-600 hover:text-green-700 hover:bg-green-50 px-2 py-1 rounded text-xs"
                >
                  Pagar
                </button>
              )}
            </>
          )}
          <button
            onClick={() => openDeleteModal(item)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded text-xs"
          >
            Eliminar
          </button>
        </div>
      )
    }
  ], [formOptions.statuses, handleStatusChange, handleMarkAsSent, handleMarkAsPaid]);

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
        <span>Nueva Factura</span>
      </button>
    </div>
  ), [loading]);

  if (loading && invoices.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingState message="Cargando facturas..." />
      </div>
    );
  }

  if (error && invoices.length === 0) {
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2 text-heading">Facturas</h1>
            <p className="text-gray-600 text-body">Gestión completa de facturas y pagos</p>
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
                placeholder="Buscar facturas..."
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
              onChange={(e) => setFilters((prev: any) => ({ ...prev, status: e.target.value || undefined }))}
              className="px-3 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-[#c9f31d]"
            >
              <option value="">Todos los estados</option>
              {formOptions.statuses.map((option: any) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            
            <select
              value={filters.client_id || ''}
              onChange={(e) => setFilters((prev: any) => ({ ...prev, client_id: e.target.value ? parseInt(e.target.value) : undefined }))}
              className="px-3 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-[#c9f31d]"
            >
              <option value="">Todos los clientes</option>
              {clients.map((client: any) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>

            <select
              value={filters.has_file ? 'true' : ''}
              onChange={(e) => setFilters((prev: any) => ({ ...prev, has_file: e.target.value === 'true' || undefined }))}
              className="px-3 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-[#c9f31d]"
            >
              <option value="">Todos los archivos</option>
              <option value="true">Con archivo</option>
              <option value="false">Sin archivo</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Error banner */}
      {error && invoices.length > 0 && (
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

      {/* Invoices Table */}
      <DataTable
        title="Lista de Facturas"
        columns={columns}
        data={invoices}
        loading={loading}
        onRowClick={openViewModal}
        emptyMessage="No hay facturas disponibles"
        headerActions={
          <div className="text-sm text-gray-600">
            {invoices.length} facturas
          </div>
        }
      />

      {/* Modal para Crear/Editar */}
      <Modal
        isOpen={viewMode === 'create' || viewMode === 'edit'}
        onClose={closeModals}
        title={viewMode === 'create' ? 'Nueva Factura' : 'Editar Factura'}
        size="lg"
      >
        <InvoiceForm
          invoice={selectedInvoice || undefined}
          onSubmit={handleFormSubmit}
          onCancel={closeModals}
          isLoading={isSubmitting}
          mode={viewMode === 'create' ? 'create' : 'edit'}
          clients={clients}
          onGenerateNumber={generateInvoiceNumber}
          onUploadFile={handleFileUpload}
        />
      </Modal>

      {/* Modal de vista/detalles */}
      <Modal
        isOpen={viewMode === 'view'}
        onClose={closeModals}
        title="Detalles de la Factura"
        footer={
          <div className="flex space-x-3">
            {selectedInvoice && selectedInvoice.status !== 'paid' && (
              <>
                <button
                  onClick={() => selectedInvoice && openEditModal(selectedInvoice)}
                  className="bg-[#c9f31d] text-gray-900 px-6 py-2 rounded-full hover:bg-[#b8e019] transition-all duration-200 font-medium"
                >
                  Editar
                </button>
                {selectedInvoice.status === 'draft' && (
                  <button
                    onClick={() => handleMarkAsSent(selectedInvoice.id)}
                    className="bg-orange-600 text-white px-6 py-2 rounded-full hover:bg-orange-700 transition-all duration-200 font-medium"
                  >
                    Marcar como Enviada
                  </button>
                )}
                {(selectedInvoice.status === 'sent' || selectedInvoice.status === 'overdue') && (
                  <button
                    onClick={() => handleMarkAsPaid(selectedInvoice.id)}
                    className="bg-green-600 text-white px-6 py-2 rounded-full hover:bg-green-700 transition-all duration-200 font-medium"
                  >
                    Marcar como Pagada
                  </button>
                )}
              </>
            )}
            <button
              onClick={closeModals}
              className="bg-gray-100 text-gray-700 px-6 py-2 rounded-full hover:bg-gray-200 transition-all duration-200 font-medium"
            >
              Cerrar
            </button>
          </div>
        }
      >
        {selectedInvoice && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-2xl">
                <label className="text-gray-600 text-sm text-caption">Número de Factura</label>
                <p className="text-gray-900 font-medium text-body">
                  {formatInvoiceForDisplay(selectedInvoice).formattedNumber}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl">
                <label className="text-gray-600 text-sm text-caption">Estado</label>
                <div className="mt-1">
                  {(() => {
                    const formatted = formatInvoiceForDisplay(selectedInvoice);
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
                  {formatInvoiceForDisplay(selectedInvoice).clientName}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl">
                <label className="text-gray-600 text-sm text-caption">Monto</label>
                <p className="text-gray-900 font-medium text-body">
                  {formatInvoiceAmount(selectedInvoice.amount)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-2xl">
                <label className="text-gray-600 text-sm text-caption">Fecha de Factura</label>
                <p className="text-gray-900 text-body">{formatInvoiceDate(selectedInvoice.invoice_date)}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl">
                <label className="text-gray-600 text-sm text-caption">Fecha de Creación</label>
                <p className="text-gray-900 text-body">{formatInvoiceDate(selectedInvoice.date_created)}</p>
              </div>
            </div>

            {selectedInvoice.invoice_file && (
              <div className="p-4 bg-gray-50 rounded-2xl">
                <label className="text-gray-600 text-sm text-caption">Archivo PDF</label>
                <div className="mt-2">
                  <a
                    href={`${import.meta.env.VITE_API_URL || 'https://api.thedojolab.com'}/assets/${selectedInvoice.invoice_file}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                    download
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Descargar Archivo</span>
                  </a>
                </div>
              </div>
            )}

            {selectedInvoice.notes && (
              <div className="p-4 bg-gray-50 rounded-2xl">
                <label className="text-gray-600 text-sm text-caption">Notas</label>
                <p className="text-gray-900 text-body whitespace-pre-wrap">{selectedInvoice.notes}</p>
              </div>
            )}

            {selectedInvoice.date_updated && (
              <div className="p-4 bg-gray-50 rounded-2xl">
                <label className="text-gray-600 text-sm text-caption">Última Actualización</label>
                <p className="text-gray-900 text-body">{formatInvoiceDate(selectedInvoice.date_updated)}</p>
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
            Esta acción eliminará la factura <strong>{selectedInvoice?.invoice_number}</strong>.
          </p>
          
          <p className="text-sm text-gray-500">
            Esta acción no se puede deshacer.
          </p>
        </div>
      </Modal>
    </div>
  );
};