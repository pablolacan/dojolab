// src/modules/services/hooks/use-service.ts

import { useState, useEffect, useCallback } from 'react';
import { getService, getServiceWithClient, updateService } from '../services/services-api';
import type { Service, ServiceWithClient, UpdateServiceData } from '../types/service.types';

interface UseServiceState {
  service: Service | ServiceWithClient | null;
  isLoading: boolean;
  error: string | null;
}

export const useService = (id: number, withClient = false) => {
  const [state, setState] = useState<UseServiceState>({
    service: null,
    isLoading: false,
    error: null
  });

  const fetchService = useCallback(async () => {
    if (!id) return;
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const service = withClient 
        ? await getServiceWithClient(id)
        : await getService(id);
      
      setState({
        service,
        isLoading: false,
        error: null
      });
    } catch (error: any) {
      setState({
        service: null,
        isLoading: false,
        error: error.message
      });
    }
  }, [id, withClient]);

  const update = useCallback(async (data: Omit<UpdateServiceData, 'id'>): Promise<Service> => {
    if (!id) throw new Error('No service ID provided');
    
    setState(prev => ({ ...prev, error: null }));
    
    try {
      const updatedService = await updateService({ ...data, id });
      
      setState(prev => ({
        ...prev,
        service: updatedService
      }));
      
      return updatedService;
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message }));
      throw error;
    }
  }, [id]);

  const refresh = useCallback(() => {
    fetchService();
  }, [fetchService]);

  useEffect(() => {
    fetchService();
  }, [fetchService]);

  return {
    service: state.service,
    isLoading: state.isLoading,
    error: state.error,
    update,
    refresh
  };
};