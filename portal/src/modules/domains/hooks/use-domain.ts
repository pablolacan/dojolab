// src/modules/domains/hooks/use-domain.ts

import { useState, useEffect, useCallback } from 'react';
import { getDomain, getDomainWithRelations, updateDomain } from '../services/domains-api';
import type { Domain, DomainWithRelations, UpdateDomainData } from '../types/domain.types';

interface UseDomainState {
  domain: Domain | DomainWithRelations | null;
  isLoading: boolean;
  error: string | null;
}

export const useDomain = (id: number, withRelations = false) => {
  const [state, setState] = useState<UseDomainState>({
    domain: null,
    isLoading: false,
    error: null
  });

  const fetchDomain = useCallback(async () => {
    if (!id) return;
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const domain = withRelations 
        ? await getDomainWithRelations(id)
        : await getDomain(id);
      
      setState({
        domain,
        isLoading: false,
        error: null
      });
    } catch (error: any) {
      setState({
        domain: null,
        isLoading: false,
        error: error.message
      });
    }
  }, [id, withRelations]);

  const update = useCallback(async (data: Omit<UpdateDomainData, 'id'>): Promise<Domain> => {
    if (!id) throw new Error('No domain ID provided');
    
    setState(prev => ({ ...prev, error: null }));
    
    try {
      const updatedDomain = await updateDomain({ ...data, id });
      
      setState(prev => ({
        ...prev,
        domain: updatedDomain
      }));
      
      return updatedDomain;
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message }));
      throw error;
    }
  }, [id]);

  const refresh = useCallback(() => {
    fetchDomain();
  }, [fetchDomain]);

  // Helper to check if domain is expiring soon
  const isExpiringSoon = useCallback((days = 30): boolean => {
    if (!state.domain?.expiration_date) return false;
    
    const expirationDate = new Date(state.domain.expiration_date);
    const today = new Date();
    const daysUntilExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    return daysUntilExpiration <= days && daysUntilExpiration >= 0;
  }, [state.domain]);

  // Helper to get days until expiration
  const getDaysUntilExpiration = useCallback((): number | null => {
    if (!state.domain?.expiration_date) return null;
    
    const expirationDate = new Date(state.domain.expiration_date);
    const today = new Date();
    const daysUntilExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    return daysUntilExpiration;
  }, [state.domain]);

  useEffect(() => {
    fetchDomain();
  }, [fetchDomain]);

  return {
    domain: state.domain,
    isLoading: state.isLoading,
    error: state.error,
    update,
    refresh,
    isExpiringSoon,
    getDaysUntilExpiration
  };
};