// src/modules/clients/hooks/use-client.ts

import { useState, useEffect, useCallback } from 'react';
import { getClient, getClientWithRelations, updateClient } from '../services/clients-api';
import type { Client, UpdateClientData } from '../types/client.types';

interface UseClientState {
  client: Client | null;
  isLoading: boolean;
  error: string | null;
}

export const useClient = (id: number, withRelations = false) => {
  const [state, setState] = useState<UseClientState>({
    client: null,
    isLoading: false,
    error: null
  });

  const fetchClient = useCallback(async () => {
    if (!id) return;
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const client = withRelations 
        ? await getClientWithRelations(id)
        : await getClient(id);
      
      setState({
        client,
        isLoading: false,
        error: null
      });
    } catch (error: any) {
      setState({
        client: null,
        isLoading: false,
        error: error.message
      });
    }
  }, [id, withRelations]);

  const update = useCallback(async (data: Omit<UpdateClientData, 'id'>): Promise<Client> => {
    if (!id) throw new Error('No client ID provided');
    
    setState(prev => ({ ...prev, error: null }));
    
    try {
      const updatedClient = await updateClient({ ...data, id });
      
      setState(prev => ({
        ...prev,
        client: updatedClient
      }));
      
      return updatedClient;
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message }));
      throw error;
    }
  }, [id]);

  const refresh = useCallback(() => {
    fetchClient();
  }, [fetchClient]);

  useEffect(() => {
    fetchClient();
  }, [fetchClient]);

  return {
    client: state.client,
    isLoading: state.isLoading,
    error: state.error,
    update,
    refresh
  };
};