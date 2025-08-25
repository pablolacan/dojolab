// src/modules/providers/services/providers-api.ts

import { readItems, readItem, createItem, updateItem, deleteItem } from '@directus/sdk';
import { directus } from '../../../lib/directus/client';
import type { 
  Provider, 
  CreateProviderData, 
  UpdateProviderData, 
  ProviderFilters,
  ProvidersResponse
} from '../types/provider.types';

/**
 * Get all providers with optional filtering
 */
export const getProviders = async (
  filters: ProviderFilters = {},
  page = 1,
  limit = 25
): Promise<ProvidersResponse> => {
  try {
    console.log('Fetching providers...');

    // Build filter object
    const directusFilter: any = {};
    
    if (filters.search) {
      directusFilter._or = [
        { name: { _icontains: filters.search } },
        { website: { _icontains: filters.search } },
        { contact_info: { _icontains: filters.search } }
      ];
    }
    
    if (filters.status && filters.status !== 'all') {
      directusFilter.status = { _eq: filters.status };
    }

    const result = await directus.request(
      readItems('providers', {
        fields: [
          'id',
          'name',
          'website',
          'contact_info',
          'notes',
          'status',
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

    console.log('Providers fetched successfully');
    
    // Type assertion for the Directus response structure
    const response = result as any;
    
    return {
      data: response.data || response as Provider[],
      meta: response.meta || { total_count: response.length || 0, filter_count: response.length || 0 }
    };

  } catch (error: any) {
    console.error('Error fetching providers:', error);
    throw new Error(error.message || 'Failed to fetch providers');
  }
};

/**
 * Get single provider by ID
 */
export const getProvider = async (id: number): Promise<Provider> => {
  try {
    console.log(`Fetching provider ${id}...`);

    const provider = await directus.request(
      readItem('providers', id, {
        fields: [
          'id',
          'name',
          'website',
          'contact_info',
          'notes',
          'status',
          'date_created',
          'date_updated'
        ]
      })
    );

    console.log('Provider fetched successfully');
    return provider as Provider;

  } catch (error: any) {
    console.error(`Error fetching provider ${id}:`, error);
    throw new Error(error.message || 'Failed to fetch provider');
  }
};

/**
 * Create new provider
 */
export const createProvider = async (data: CreateProviderData): Promise<Provider> => {
  try {
    console.log('Creating new provider...');

    const provider = await directus.request(
      createItem('providers', data)
    );

    console.log('Provider created successfully');
    return provider as Provider;

  } catch (error: any) {
    console.error('Error creating provider:', error);
    throw new Error(error.message || 'Failed to create provider');
  }
};

/**
 * Update existing provider
 */
export const updateProvider = async (data: UpdateProviderData): Promise<Provider> => {
  try {
    console.log(`Updating provider ${data.id}...`);

    const { id, ...updateData } = data;

    const provider = await directus.request(
      updateItem('providers', id, updateData)
    );

    console.log('Provider updated successfully');
    return provider as Provider;

  } catch (error: any) {
    console.error(`Error updating provider ${data.id}:`, error);
    throw new Error(error.message || 'Failed to update provider');
  }
};

/**
 * Delete provider
 */
export const deleteProvider = async (id: number): Promise<void> => {
  try {
    console.log(`Deleting provider ${id}...`);

    await directus.request(
      deleteItem('providers', id)
    );

    console.log('Provider deleted successfully');

  } catch (error: any) {
    console.error(`Error deleting provider ${id}:`, error);
    throw new Error(error.message || 'Failed to delete provider');
  }
};