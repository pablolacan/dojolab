// src/modules/subscriptions/hooks/use-subscription.ts

import { useState, useEffect, useCallback } from 'react';
import { getSubscription, updateSubscription } from '../services/subscriptions-api';
import type { Subscription, UpdateSubscriptionData } from '../types/subscription.types';

interface UseSubscriptionState {
  subscription: Subscription | null;
  isLoading: boolean;
  error: string | null;
}

export const useSubscription = (id: number) => {
  const [state, setState] = useState<UseSubscriptionState>({
    subscription: null,
    isLoading: false,
    error: null
  });

  const fetchSubscription = useCallback(async () => {
    if (!id) return;
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const subscription = await getSubscription(id);
      
      setState({
        subscription,
        isLoading: false,
        error: null
      });
    } catch (error: any) {
      setState({
        subscription: null,
        isLoading: false,
        error: error.message
      });
    }
  }, [id]);

  const update = useCallback(async (data: Omit<UpdateSubscriptionData, 'id'>): Promise<Subscription> => {
    if (!id) throw new Error('No subscription ID provided');
    
    setState(prev => ({ ...prev, error: null }));
    
    try {
      const updatedSubscription = await updateSubscription({ ...data, id });
      
      setState(prev => ({
        ...prev,
        subscription: updatedSubscription
      }));
      
      return updatedSubscription;
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message }));
      throw error;
    }
  }, [id]);

  const refresh = useCallback(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  return {
    subscription: state.subscription,
    isLoading: state.isLoading,
    error: state.error,
    update,
    refresh
  };
};