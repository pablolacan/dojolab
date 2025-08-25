// src/modules/providers/hooks/use-provider.ts

import { useState, useEffect, useCallback } from 'react';
import { getProvider, updateProvider } from '../services/providers-api';
import type { Provider, UpdateProviderData } from '../types/provider.types';

interface UseProviderState {
  provider: Provider | null;
  isLoading: boolean;
  error: string | null;
}

export const useProvider = (id: number) => {
  const [state, setState] = useState<UseProviderState>({
    provider: null,
    isLoading: false,
    error: null
  });

  const fetchProvider = useCallback(async () => {
    if (!id) return;
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const provider = await getProvider(id);
      
      setState({
        provider,
        isLoading: false,
        error: null
      });
    } catch (error: any) {
      setState({
        provider: null,
        isLoading: false,
        error: error.message
      });
    }
  }, [id]);

  const update = useCallback(async (data: Omit<UpdateProviderData, 'id'>): Promise<Provider> => {
    if (!id) throw new Error('No provider ID provided');
    
    setState(prev => ({ ...prev, error: null }));
    
    try {
      const updatedProvider = await updateProvider({ ...data, id });
      
      setState(prev => ({
        ...prev,
        provider: updatedProvider
      }));
      
      return updatedProvider;
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message }));
      throw error;
    }
  }, [id]);

  const refresh = useCallback(() => {
    fetchProvider();
  }, [fetchProvider]);

  useEffect(() => {
    fetchProvider();
  }, [fetchProvider]);

  return {
    provider: state.provider,
    isLoading: state.isLoading,
    error: state.error,
    update,
    refresh
  };
};