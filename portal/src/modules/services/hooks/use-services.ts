// src/modules/services/hooks/use-services.ts

import { useState, useEffect, useCallback } from 'react';
import { 
  getServices, 
  getServicesByClient,
  createService, 
  updateService, 
  deleteService 
} from '../services/services-api';
import type { 
  Service, 
  ServiceFilters, 
  CreateServiceData, 
  UpdateServiceData
} from '../types/service.types';

interface UseServicesState {
  services: Service[];
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  hasNextPage: boolean;
}

export const useServices = (initialFilters: ServiceFilters = {}, pageSize = 25) => {
  const [state, setState] = useState<UseServicesState>({
    services: [],
    isLoading: false,
    error: null,
    totalCount: 0,
    currentPage: 1,
    hasNextPage: false
  });

  const [filters, setFilters] = useState<ServiceFilters>(initialFilters);

  // Fetch services
  const fetchServices = useCallback(async (page = 1, reset = false) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await getServices(filters, page, pageSize);
      
      setState(prev => ({
        ...prev,
        services: reset ? response.data : [...prev.services, ...response.data],
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

  // Load more services (pagination)
  const loadMore = useCallback(() => {
    if (!state.isLoading && state.hasNextPage) {
      fetchServices(state.currentPage + 1, false);
    }
  }, [state.isLoading, state.hasNextPage, state.currentPage, fetchServices]);

  // Refresh services
  const refresh = useCallback(() => {
    fetchServices(1, true);
  }, [fetchServices]);

  // Update filters
  const updateFilters = useCallback((newFilters: ServiceFilters) => {
    setFilters(newFilters);
    setState(prev => ({ ...prev, currentPage: 1 }));
  }, []);

  // Create service
  const create = useCallback(async (data: CreateServiceData): Promise<Service> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const newService = await createService(data);
      
      // Refresh the list after creation
      await fetchServices(1, true);
      
      return newService;
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message, isLoading: false }));
      throw error;
    }
  }, [fetchServices]);

  // Update service
  const update = useCallback(async (data: UpdateServiceData): Promise<Service> => {
    setState(prev => ({ ...prev, error: null }));
    
    try {
      const updatedService = await updateService(data);
      
      // Update the service in the local state
      setState(prev => ({
        ...prev,
        services: prev.services.map(service => 
          service.id === updatedService.id ? updatedService : service
        )
      }));
      
      return updatedService;
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message }));
      throw error;
    }
  }, []);

  // Delete service
  const remove = useCallback(async (id: number): Promise<void> => {
    setState(prev => ({ ...prev, error: null }));
    
    try {
      await deleteService(id);
      
      // Remove the service from local state
      setState(prev => ({
        ...prev,
        services: prev.services.filter(service => service.id !== id),
        totalCount: prev.totalCount - 1
      }));
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message }));
      throw error;
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchServices(1, true);
  }, [filters]);

  return {
    // State
    services: state.services,
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

// Hook specifically for client services
export const useClientServices = (clientId: number) => {
  const [state, setState] = useState<{
    services: Service[];
    isLoading: boolean;
    error: string | null;
  }>({
    services: [],
    isLoading: false,
    error: null
  });

  const fetchClientServices = useCallback(async () => {
    if (!clientId) return;
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const services = await getServicesByClient(clientId);
      
      setState({
        services,
        isLoading: false,
        error: null
      });
    } catch (error: any) {
      setState({
        services: [],
        isLoading: false,
        error: error.message
      });
    }
  }, [clientId]);

  const refresh = useCallback(() => {
    fetchClientServices();
  }, [fetchClientServices]);

  useEffect(() => {
    fetchClientServices();
  }, [fetchClientServices]);

  return {
    services: state.services,
    isLoading: state.isLoading,
    error: state.error,
    refresh
  };
};