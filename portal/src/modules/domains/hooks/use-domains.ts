// src/modules/domains/hooks/use-domains.ts

import { useState, useEffect, useCallback } from 'react';
import { 
  getDomains, 
  getDomainsByClient,
  getExpiringDomains,
  createDomain, 
  updateDomain, 
  deleteDomain 
} from '../services/domains-api';
import type { 
  Domain, 
  DomainFilters, 
  CreateDomainData, 
  UpdateDomainData
} from '../types/domain.types';

interface UseDomainsState {
  domains: Domain[];
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  hasNextPage: boolean;
}

export const useDomains = (initialFilters: DomainFilters = {}, pageSize = 25) => {
  const [state, setState] = useState<UseDomainsState>({
    domains: [],
    isLoading: false,
    error: null,
    totalCount: 0,
    currentPage: 1,
    hasNextPage: false
  });

  const [filters, setFilters] = useState<DomainFilters>(initialFilters);

  // Fetch domains
  const fetchDomains = useCallback(async (page = 1, reset = false) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await getDomains(filters, page, pageSize);
      
      setState(prev => ({
        ...prev,
        domains: reset ? response.data : [...prev.domains, ...response.data],
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

  // Load more domains (pagination)
  const loadMore = useCallback(() => {
    if (!state.isLoading && state.hasNextPage) {
      fetchDomains(state.currentPage + 1, false);
    }
  }, [state.isLoading, state.hasNextPage, state.currentPage, fetchDomains]);

  // Refresh domains
  const refresh = useCallback(() => {
    fetchDomains(1, true);
  }, [fetchDomains]);

  // Update filters
  const updateFilters = useCallback((newFilters: DomainFilters) => {
    setFilters(newFilters);
    setState(prev => ({ ...prev, currentPage: 1 }));
  }, []);

  // Create domain
  const create = useCallback(async (data: CreateDomainData): Promise<Domain> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const newDomain = await createDomain(data);
      
      // Refresh the list after creation
      await fetchDomains(1, true);
      
      return newDomain;
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message, isLoading: false }));
      throw error;
    }
  }, [fetchDomains]);

  // Update domain
  const update = useCallback(async (data: UpdateDomainData): Promise<Domain> => {
    setState(prev => ({ ...prev, error: null }));
    
    try {
      const updatedDomain = await updateDomain(data);
      
      // Update the domain in the local state
      setState(prev => ({
        ...prev,
        domains: prev.domains.map(domain => 
          domain.id === updatedDomain.id ? updatedDomain : domain
        )
      }));
      
      return updatedDomain;
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message }));
      throw error;
    }
  }, []);

  // Delete domain
  const remove = useCallback(async (id: number): Promise<void> => {
    setState(prev => ({ ...prev, error: null }));
    
    try {
      await deleteDomain(id);
      
      // Remove the domain from local state
      setState(prev => ({
        ...prev,
        domains: prev.domains.filter(domain => domain.id !== id),
        totalCount: prev.totalCount - 1
      }));
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message }));
      throw error;
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchDomains(1, true);
  }, [filters]);

  return {
    // State
    domains: state.domains,
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

// Hook specifically for client domains
export const useClientDomains = (clientId: number) => {
  const [state, setState] = useState<{
    domains: Domain[];
    isLoading: boolean;
    error: string | null;
  }>({
    domains: [],
    isLoading: false,
    error: null
  });

  const fetchClientDomains = useCallback(async () => {
    if (!clientId) return;
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const domains = await getDomainsByClient(clientId);
      
      setState({
        domains,
        isLoading: false,
        error: null
      });
    } catch (error: any) {
      setState({
        domains: [],
        isLoading: false,
        error: error.message
      });
    }
  }, [clientId]);

  const refresh = useCallback(() => {
    fetchClientDomains();
  }, [fetchClientDomains]);

  useEffect(() => {
    fetchClientDomains();
  }, [fetchClientDomains]);

  return {
    domains: state.domains,
    isLoading: state.isLoading,
    error: state.error,
    refresh
  };
};

// Hook for expiring domains
export const useExpiringDomains = () => {
  const [state, setState] = useState<{
    domains: Domain[];
    isLoading: boolean;
    error: string | null;
  }>({
    domains: [],
    isLoading: false,
    error: null
  });

  const fetchExpiringDomains = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const domains = await getExpiringDomains();
      
      setState({
        domains,
        isLoading: false,
        error: null
      });
    } catch (error: any) {
      setState({
        domains: [],
        isLoading: false,
        error: error.message
      });
    }
  }, []);

  const refresh = useCallback(() => {
    fetchExpiringDomains();
  }, [fetchExpiringDomains]);

  useEffect(() => {
    fetchExpiringDomains();
  }, [fetchExpiringDomains]);

  return {
    domains: state.domains,
    isLoading: state.isLoading,
    error: state.error,
    refresh
  };
};