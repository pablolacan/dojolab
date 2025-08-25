// src/modules/providers/hooks/use-providers.ts

import { useState, useEffect, useCallback } from 'react';
import { 
  getProviders, 
  createProvider, 
  updateProvider, 
  deleteProvider 
} from '../services/providers-api';
import type { 
  Provider, 
  ProviderFilters, 
  CreateProviderData, 
  UpdateProviderData
} from '../types/provider.types';

interface UseProvidersState {
  providers: Provider[];
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  hasNextPage: boolean;
}

export const useProviders = (initialFilters: ProviderFilters = {}, pageSize = 25) => {
  const [state, setState] = useState<UseProvidersState>({
    providers: [],
    isLoading: false,
    error: null,
    totalCount: 0,
    currentPage: 1,
    hasNextPage: false
  });

  const [filters, setFilters] = useState<ProviderFilters>(initialFilters);

  // Fetch providers
  const fetchProviders = useCallback(async (page = 1, reset = false) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await getProviders(filters, page, pageSize);
      
      setState(prev => ({
        ...prev,
        providers: reset ? response.data : [...prev.providers, ...response.data],
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

  // Load more providers (pagination)
  const loadMore = useCallback(() => {
    if (!state.isLoading && state.hasNextPage) {
      fetchProviders(state.currentPage + 1, false);
    }
  }, [state.isLoading, state.hasNextPage, state.currentPage, fetchProviders]);

  // Refresh providers
  const refresh = useCallback(() => {
    fetchProviders(1, true);
  }, [fetchProviders]);

  // Update filters
  const updateFilters = useCallback((newFilters: ProviderFilters) => {
    setFilters(newFilters);
    setState(prev => ({ ...prev, currentPage: 1 }));
  }, []);

  // Create provider
  const create = useCallback(async (data: CreateProviderData): Promise<Provider> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const newProvider = await createProvider(data);
      
      // Refresh the list after creation
      await fetchProviders(1, true);
      
      return newProvider;
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message, isLoading: false }));
      throw error;
    }
  }, [fetchProviders]);

  // Update provider
  const update = useCallback(async (data: UpdateProviderData): Promise<Provider> => {
    setState(prev => ({ ...prev, error: null }));
    
    try {
      const updatedProvider = await updateProvider(data);
      
      // Update the provider in the local state
      setState(prev => ({
        ...prev,
        providers: prev.providers.map(provider => 
          provider.id === updatedProvider.id ? updatedProvider : provider
        )
      }));
      
      return updatedProvider;
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message }));
      throw error;
    }
  }, []);

  // Delete provider
  const remove = useCallback(async (id: number): Promise<void> => {
    setState(prev => ({ ...prev, error: null }));
    
    try {
      await deleteProvider(id);
      
      // Remove the provider from local state
      setState(prev => ({
        ...prev,
        providers: prev.providers.filter(provider => provider.id !== id),
        totalCount: prev.totalCount - 1
      }));
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message }));
      throw error;
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchProviders(1, true);
  }, [filters]);

  return {
    // State
    providers: state.providers,
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