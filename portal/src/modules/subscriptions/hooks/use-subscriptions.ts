// src/modules/subscriptions/hooks/use-subscriptions.ts

import { useState, useEffect, useCallback } from 'react';
import { 
  getSubscriptions, 
  createSubscription, 
  updateSubscription, 
  deleteSubscription 
} from '../services/subscriptions-api';
import type { 
  Subscription, 
  SubscriptionFilters, 
  CreateSubscriptionData, 
  UpdateSubscriptionData
} from '../types/subscription.types';

interface UseSubscriptionsState {
  subscriptions: Subscription[];
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  hasNextPage: boolean;
}

export const useSubscriptions = (initialFilters: SubscriptionFilters = {}, pageSize = 25) => {
  const [state, setState] = useState<UseSubscriptionsState>({
    subscriptions: [],
    isLoading: false,
    error: null,
    totalCount: 0,
    currentPage: 1,
    hasNextPage: false
  });

  const [filters, setFilters] = useState<SubscriptionFilters>(initialFilters);

  // Fetch subscriptions
  const fetchSubscriptions = useCallback(async (page = 1, reset = false) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await getSubscriptions(filters, page, pageSize);
      
      setState(prev => ({
        ...prev,
        subscriptions: reset ? response.data : [...prev.subscriptions, ...response.data],
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

  // Load more subscriptions (pagination)
  const loadMore = useCallback(() => {
    if (!state.isLoading && state.hasNextPage) {
      fetchSubscriptions(state.currentPage + 1, false);
    }
  }, [state.isLoading, state.hasNextPage, state.currentPage, fetchSubscriptions]);

  // Refresh subscriptions
  const refresh = useCallback(() => {
    fetchSubscriptions(1, true);
  }, [fetchSubscriptions]);

  // Update filters
  const updateFilters = useCallback((newFilters: SubscriptionFilters) => {
    setFilters(newFilters);
    setState(prev => ({ ...prev, currentPage: 1 }));
  }, []);

  // Create subscription
  const create = useCallback(async (data: CreateSubscriptionData): Promise<Subscription> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const newSubscription = await createSubscription(data);
      
      // Refresh the list after creation
      await fetchSubscriptions(1, true);
      
      return newSubscription;
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message, isLoading: false }));
      throw error;
    }
  }, [fetchSubscriptions]);

  // Update subscription
  const update = useCallback(async (data: UpdateSubscriptionData): Promise<Subscription> => {
    setState(prev => ({ ...prev, error: null }));
    
    try {
      const updatedSubscription = await updateSubscription(data);
      
      // Update the subscription in the local state
      setState(prev => ({
        ...prev,
        subscriptions: prev.subscriptions.map(subscription => 
          subscription.id === updatedSubscription.id ? updatedSubscription : subscription
        )
      }));
      
      return updatedSubscription;
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message }));
      throw error;
    }
  }, []);

  // Delete subscription
  const remove = useCallback(async (id: number): Promise<void> => {
    setState(prev => ({ ...prev, error: null }));
    
    try {
      await deleteSubscription(id);
      
      // Remove the subscription from local state
      setState(prev => ({
        ...prev,
        subscriptions: prev.subscriptions.filter(subscription => subscription.id !== id),
        totalCount: prev.totalCount - 1
      }));
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message }));
      throw error;
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchSubscriptions(1, true);
  }, [filters]);

  return {
    // State
    subscriptions: state.subscriptions,
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