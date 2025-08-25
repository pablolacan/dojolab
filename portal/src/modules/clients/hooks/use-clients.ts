// src/modules/clients/hooks/use-clients.ts

import { useState, useEffect, useCallback } from 'react';
import { 
  getClients, 
  createClient, 
  updateClient, 
  deleteClient 
} from '../services/clients-api';
import type { 
  Client, 
  ClientFilters, 
  CreateClientData, 
  UpdateClientData
} from '../types/client.types';

interface UseClientsState {
  clients: Client[];
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  hasNextPage: boolean;
}

export const useClients = (initialFilters: ClientFilters = {}, pageSize = 25) => {
  const [state, setState] = useState<UseClientsState>({
    clients: [],
    isLoading: false,
    error: null,
    totalCount: 0,
    currentPage: 1,
    hasNextPage: false
  });

  const [filters, setFilters] = useState<ClientFilters>(initialFilters);

  // Fetch clients
  const fetchClients = useCallback(async (page = 1, reset = false) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await getClients(filters, page, pageSize);
      
      setState(prev => ({
        ...prev,
        clients: reset ? response.data : [...prev.clients, ...response.data],
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

  // Load more clients (pagination)
  const loadMore = useCallback(() => {
    if (!state.isLoading && state.hasNextPage) {
      fetchClients(state.currentPage + 1, false);
    }
  }, [state.isLoading, state.hasNextPage, state.currentPage, fetchClients]);

  // Refresh clients
  const refresh = useCallback(() => {
    fetchClients(1, true);
  }, [fetchClients]);

  // Update filters
  const updateFilters = useCallback((newFilters: ClientFilters) => {
    setFilters(newFilters);
    // Reset to first page when filters change
    setState(prev => ({ ...prev, currentPage: 1 }));
  }, []);

  // Create client
  const create = useCallback(async (data: CreateClientData): Promise<Client> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const newClient = await createClient(data);
      
      // Refresh the list after creation
      await fetchClients(1, true);
      
      return newClient;
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message, isLoading: false }));
      throw error;
    }
  }, [fetchClients]);

  // Update client
  const update = useCallback(async (data: UpdateClientData): Promise<Client> => {
    setState(prev => ({ ...prev, error: null }));
    
    try {
      const updatedClient = await updateClient(data);
      
      // Update the client in the local state
      setState(prev => ({
        ...prev,
        clients: prev.clients.map(client => 
          client.id === updatedClient.id ? updatedClient : client
        )
      }));
      
      return updatedClient;
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message }));
      throw error;
    }
  }, []);

  // Delete client
  const remove = useCallback(async (id: number): Promise<void> => {
    setState(prev => ({ ...prev, error: null }));
    
    try {
      await deleteClient(id);
      
      // Remove the client from local state
      setState(prev => ({
        ...prev,
        clients: prev.clients.filter(client => client.id !== id),
        totalCount: prev.totalCount - 1
      }));
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message }));
      throw error;
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchClients(1, true);
  }, [filters]);

  return {
    // State
    clients: state.clients,
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
    remove
  };
};