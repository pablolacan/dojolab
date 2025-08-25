// src/modules/services/services/services-api.ts

import { readItems, readItem, createItem, updateItem, deleteItem } from '@directus/sdk';
import { directus } from '../../../lib/directus/client';
import type { 
  Service, 
  CreateServiceData, 
  UpdateServiceData, 
  ServiceFilters,
  ServicesResponse,
  ServiceWithClient
} from '../types/service.types';

/**
 * Get all services with optional filtering
 */
export const getServices = async (
  filters: ServiceFilters = {},
  page = 1,
  limit = 25
): Promise<ServicesResponse> => {
  try {
    console.log('Fetching services...');

    // Build filter object
    const directusFilter: any = {};
    
    if (filters.search) {
      directusFilter._or = [
        { service_name: { _icontains: filters.search } },
        { description: { _icontains: filters.search } }
      ];
    }
    
    if (filters.category && filters.category !== 'all') {
      directusFilter.category = { _eq: filters.category };
    }

    if (filters.status && filters.status !== 'all') {
      directusFilter.status = { _eq: filters.status };
    }

    if (filters.billing_type && filters.billing_type !== 'all') {
      directusFilter.billing_type = { _eq: filters.billing_type };
    }

    if (filters.billing_cycle && filters.billing_cycle !== 'all') {
      directusFilter.billing_cycle = { _eq: filters.billing_cycle };
    }

    if (filters.client_id) {
      directusFilter.client_id = { _eq: filters.client_id };
    }

    const result = await directus.request(
      readItems('services', {
        fields: [
          'id',
          'service_name',
          'description',
          'category',
          'status',
          'price',
          'cost',
          'profit_margin',
          'billing_type',
          'billing_cycle',
          'client_id',
          'start_date',
          'end_date',
          'next_billing_date',
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

    console.log('Services fetched successfully');
    
    // Type assertion for the Directus response structure
    const response = result as any;
    
    return {
      data: response.data || response as Service[],
      meta: response.meta || { total_count: response.length || 0, filter_count: response.length || 0 }
    };

  } catch (error: any) {
    console.error('Error fetching services:', error);
    throw new Error(error.message || 'Failed to fetch services');
  }
};

/**
 * Get single service by ID
 */
export const getService = async (id: number): Promise<Service> => {
  try {
    console.log(`Fetching service ${id}...`);

    const service = await directus.request(
      readItem('services', id, {
        fields: [
          'id',
          'service_name',
          'description',
          'category',
          'status',
          'price',
          'cost',
          'profit_margin',
          'billing_type',
          'billing_cycle',
          'client_id',
          'start_date',
          'end_date',
          'next_billing_date',
          'date_created',
          'date_updated'
        ]
      })
    );

    console.log('Service fetched successfully');
    return service as Service;

  } catch (error: any) {
    console.error(`Error fetching service ${id}:`, error);
    throw new Error(error.message || 'Failed to fetch service');
  }
};

/**
 * Get service with client information
 */
export const getServiceWithClient = async (id: number): Promise<ServiceWithClient> => {
  try {
    console.log(`Fetching service ${id} with client...`);

    const service = await directus.request(
      readItem('services', id, {
        fields: [
          'id',
          'service_name',
          'description',
          'category',
          'status',
          'price',
          'cost',
          'profit_margin',
          'billing_type',
          'billing_cycle',
          'client_id',
          'start_date',
          'end_date',
          'next_billing_date',
          'date_created',
          'date_updated',
          {
            client_id: [
              'id',
              'name',
              'email',
              'status'
            ]
          }
        ]
      })
    );

    console.log('Service with client fetched successfully');
    return service as ServiceWithClient;

  } catch (error: any) {
    console.error(`Error fetching service with client ${id}:`, error);
    throw new Error(error.message || 'Failed to fetch service with client');
  }
};

/**
 * Get services by client ID
 */
export const getServicesByClient = async (clientId: number): Promise<Service[]> => {
  try {
    console.log(`Fetching services for client ${clientId}...`);

    const result = await getServices({ client_id: clientId }, 1, 100);

    console.log('Client services fetched successfully');
    return result.data;

  } catch (error: any) {
    console.error(`Error fetching services for client ${clientId}:`, error);
    throw new Error(error.message || 'Failed to fetch client services');
  }
};

/**
 * Create new service
 */
export const createService = async (data: CreateServiceData): Promise<Service> => {
  try {
    console.log('Creating new service...');

    const service = await directus.request(
      createItem('services', data)
    );

    console.log('Service created successfully');
    return service as Service;

  } catch (error: any) {
    console.error('Error creating service:', error);
    throw new Error(error.message || 'Failed to create service');
  }
};

/**
 * Update existing service
 */
export const updateService = async (data: UpdateServiceData): Promise<Service> => {
  try {
    console.log(`Updating service ${data.id}...`);

    const { id, ...updateData } = data;

    const service = await directus.request(
      updateItem('services', id, updateData)
    );

    console.log('Service updated successfully');
    return service as Service;

  } catch (error: any) {
    console.error(`Error updating service ${data.id}:`, error);
    throw new Error(error.message || 'Failed to update service');
  }
};

/**
 * Delete service
 */
export const deleteService = async (id: number): Promise<void> => {
  try {
    console.log(`Deleting service ${id}...`);

    await directus.request(
      deleteItem('services', id)
    );

    console.log('Service deleted successfully');

  } catch (error: any) {
    console.error(`Error deleting service ${id}:`, error);
    throw new Error(error.message || 'Failed to delete service');
  }
};