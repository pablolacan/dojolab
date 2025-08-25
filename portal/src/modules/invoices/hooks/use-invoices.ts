// src/modules/invoices/hooks/use-invoices.ts

import { useState, useEffect, useCallback } from 'react';
import { 
  getInvoices, 
  getInvoicesByClient,
  getInvoiceSummary,
  createInvoice, 
  updateInvoice, 
  deleteInvoice,
  generateInvoiceNumber
} from '../services/invoices-api';
import type { 
  Invoice, 
  InvoiceFilters, 
  CreateInvoiceData, 
  UpdateInvoiceData,
  InvoiceSummary
} from '../types/invoice.types';

interface UseInvoicesState {
  invoices: Invoice[];
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  hasNextPage: boolean;
}

export const useInvoices = (initialFilters: InvoiceFilters = {}, pageSize = 25) => {
  const [state, setState] = useState<UseInvoicesState>({
    invoices: [],
    isLoading: false,
    error: null,
    totalCount: 0,
    currentPage: 1,
    hasNextPage: false
  });

  const [filters, setFilters] = useState<InvoiceFilters>(initialFilters);

  // Fetch invoices
  const fetchInvoices = useCallback(async (page = 1, reset = false) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await getInvoices(filters, page, pageSize);
      
      setState(prev => ({
        ...prev,
        invoices: reset ? response.data : [...prev.invoices, ...response.data],
        totalCount: response.meta.total_count,
        currentPage: page,
        hasNextPage: (page * pageSize) < response.meta.total_count,
        isLoading: false
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message,
        isLoading: false
      }));
    }
  }, [filters, pageSize]);

  // Load more invoices (pagination)
  const loadMore = useCallback(() => {
    if (!state.isLoading && state.hasNextPage) {
      fetchInvoices(state.currentPage + 1, false);
    }
  }, [state.isLoading, state.hasNextPage, state.currentPage, fetchInvoices]);

  // Refresh invoices
  const refresh = useCallback(() => {
    fetchInvoices(1, true);
  }, [fetchInvoices]);

  // Update filters
  const updateFilters = useCallback((newFilters: InvoiceFilters) => {
    setFilters(newFilters);
    setState(prev => ({ ...prev, currentPage: 1 }));
  }, []);

  // Create invoice
  const create = useCallback(async (data: CreateInvoiceData): Promise<Invoice> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const newInvoice = await createInvoice(data);
      
      // Refresh the list after creation
      await fetchInvoices(1, true);
      
      return newInvoice;
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message, isLoading: false }));
      throw error;
    }
  }, [fetchInvoices]);

  // Update invoice
  const update = useCallback(async (data: UpdateInvoiceData): Promise<Invoice> => {
    setState(prev => ({ ...prev, error: null }));
    
    try {
      const updatedInvoice = await updateInvoice(data);
      
      // Update the invoice in the local state
      setState(prev => ({
        ...prev,
        invoices: prev.invoices.map(invoice => 
          invoice.id === updatedInvoice.id ? updatedInvoice : invoice
        )
      }));
      
      return updatedInvoice;
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message }));
      throw error;
    }
  }, []);

  // Delete invoice
  const remove = useCallback(async (id: number): Promise<void> => {
    setState(prev => ({ ...prev, error: null }));
    
    try {
      await deleteInvoice(id);
      
      // Remove the invoice from local state
      setState(prev => ({
        ...prev,
        invoices: prev.invoices.filter(invoice => invoice.id !== id),
        totalCount: prev.totalCount - 1
      }));
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message }));
      throw error;
    }
  }, []);

  // Generate invoice number
  const generateNumber = useCallback(async (): Promise<string> => {
    try {
      return await generateInvoiceNumber();
    } catch (error: any) {
      throw new Error(error.message || 'Failed to generate invoice number');
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchInvoices(1, true);
  }, [filters]);

  return {
    // State
    invoices: state.invoices,
    isLoading: state.isLoading,
    error: state.error,
    totalCount: state.totalCount,
    hasNextPage: state.hasNextPage,
    currentPage: state.currentPage,
    
    // Filters
    filters,
    updateFilters,
    
    // Actions
    refresh,
    loadMore,
    create,
    update,
    remove,
    generateNumber
  };
};

// Hook specifically for client invoices
export const useClientInvoices = (clientId: number) => {
  const [state, setState] = useState<{
    invoices: Invoice[];
    isLoading: boolean;
    error: string | null;
  }>({
    invoices: [],
    isLoading: false,
    error: null
  });

  const fetchClientInvoices = useCallback(async () => {
    if (!clientId) return;
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const invoices = await getInvoicesByClient(clientId);
      
      setState({
        invoices,
        isLoading: false,
        error: null
      });
    } catch (error: any) {
      setState({
        invoices: [],
        isLoading: false,
        error: error.message
      });
    }
  }, [clientId]);

  const refresh = useCallback(() => {
    fetchClientInvoices();
  }, [fetchClientInvoices]);

  useEffect(() => {
    fetchClientInvoices();
  }, [fetchClientInvoices]);

  return {
    invoices: state.invoices,
    isLoading: state.isLoading,
    error: state.error,
    refresh
  };
};

// Hook for invoice summary/stats
export const useInvoiceSummary = (filters: InvoiceFilters = {}) => {
  const [state, setState] = useState<{
    summary: InvoiceSummary | null;
    isLoading: boolean;
    error: string | null;
  }>({
    summary: null,
    isLoading: false,
    error: null
  });

  const fetchSummary = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const summary = await getInvoiceSummary(filters);
      
      setState({
        summary,
        isLoading: false,
        error: null
      });
    } catch (error: any) {
      setState({
        summary: null,
        isLoading: false,
        error: error.message
      });
    }
  }, [filters]);

  const refresh = useCallback(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return {
    summary: state.summary,
    isLoading: state.isLoading,
    error: state.error,
    refresh
  };
};