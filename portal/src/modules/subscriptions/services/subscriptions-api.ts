// src/modules/subscriptions/services/subscriptions-api.ts

import { readItems, readItem, createItem, updateItem, deleteItem } from '@directus/sdk';
import { directus } from '../../../lib/directus/client';
import type { 
  Subscription, 
  CreateSubscriptionData, 
  UpdateSubscriptionData, 
  SubscriptionFilters,
  SubscriptionsResponse
} from '../types/subscription.types';

/**
 * Get all subscriptions with optional filtering
 */
export const getSubscriptions = async (
  filters: SubscriptionFilters = {},
  page = 1,
  limit = 25
): Promise<SubscriptionsResponse> => {
  try {
    console.log('Fetching subscriptions...');

    // Build filter object
    const directusFilter: any = {};
    
    if (filters.search) {
      directusFilter._or = [
        { service_name: { _icontains: filters.search } }
      ];
    }
    
    if (filters.status && filters.status !== 'all') {
      directusFilter.status = { _eq: filters.status };
    }

    if (filters.plan_type && filters.plan_type !== 'all') {
      directusFilter.plan_type = { _eq: filters.plan_type };
    }

    if (filters.billing_cycle && filters.billing_cycle !== 'all') {
      directusFilter.billing_cycle = { _eq: filters.billing_cycle };
    }

    const result = await directus.request(
      readItems('subscriptions', {
        fields: [
          'id',
          'status',
          'service_name',
          'plan_type',
          'billing_cycle',
          'renewal_date',
          'cost',
          'date_created',
          'date_updated'
        ],
        filter: Object.keys(directusFilter).length > 0 ? directusFilter : undefined,
        limit,
        page,
        sort: ['-date_created'],
        meta: ['total_count', 'filter_count']
      })
    );

    console.log('Subscriptions fetched successfully');
    
    // Type assertion for the Directus response structure
    const response = result as any;
    
    return {
      data: response.data || response as Subscription[],
      meta: response.meta || { total_count: response.length || 0, filter_count: response.length || 0 }
    };

  } catch (error: any) {
    console.error('Error fetching subscriptions:', error);
    throw new Error(error.message || 'Failed to fetch subscriptions');
  }
};

/**
 * Get single subscription by ID
 */
export const getSubscription = async (id: number): Promise<Subscription> => {
  try {
    console.log(`Fetching subscription ${id}...`);

    const subscription = await directus.request(
      readItem('subscriptions', id, {
        fields: [
          'id',
          'status',
          'service_name',
          'plan_type',
          'billing_cycle',
          'renewal_date',
          'cost',
          'date_created',
          'date_updated'
        ]
      })
    );

    console.log('Subscription fetched successfully');
    return subscription as Subscription;

  } catch (error: any) {
    console.error(`Error fetching subscription ${id}:`, error);
    throw new Error(error.message || 'Failed to fetch subscription');
  }
};

/**
 * Create new subscription
 */
export const createSubscription = async (data: CreateSubscriptionData): Promise<Subscription> => {
  try {
    console.log('Creating new subscription...');

    const subscription = await directus.request(
      createItem('subscriptions', data)
    );

    console.log('Subscription created successfully');
    return subscription as Subscription;

  } catch (error: any) {
    console.error('Error creating subscription:', error);
    throw new Error(error.message || 'Failed to create subscription');
  }
};

/**
 * Update existing subscription
 */
export const updateSubscription = async (data: UpdateSubscriptionData): Promise<Subscription> => {
  try {
    console.log(`Updating subscription ${data.id}...`);

    const { id, ...updateData } = data;

    const subscription = await directus.request(
      updateItem('subscriptions', id, updateData)
    );

    console.log('Subscription updated successfully');
    return subscription as Subscription;

  } catch (error: any) {
    console.error(`Error updating subscription ${data.id}:`, error);
    throw new Error(error.message || 'Failed to update subscription');
  }
};

/**
 * Delete subscription
 */
export const deleteSubscription = async (id: number): Promise<void> => {
  try {
    console.log(`Deleting subscription ${id}...`);

    await directus.request(
      deleteItem('subscriptions', id)
    );

    console.log('Subscription deleted successfully');

  } catch (error: any) {
    console.error(`Error deleting subscription ${id}:`, error);
    throw new Error(error.message || 'Failed to delete subscription');
  }
};