// src/modules/domains/services/domains-api.ts

import { readItems, readItem, createItem, updateItem, deleteItem } from '@directus/sdk';
import { directus } from '../../../lib/directus/client';
import type { 
  Domain, 
  CreateDomainData, 
  UpdateDomainData, 
  DomainFilters,
  DomainsResponse,
  DomainWithRelations
} from '../types/domain.types';

/**
 * Get all domains with optional filtering
 */
export const getDomains = async (
  filters: DomainFilters = {},
  page = 1,
  limit = 25
): Promise<DomainsResponse> => {
  try {
    console.log('Fetching domains...');

    // Build filter object
    const directusFilter: any = {};
    
    if (filters.search) {
      directusFilter._or = [
        { domain_: { _icontains: filters.search } },
        { dns_provider: { _icontains: filters.search } },
        { notes: { _icontains: filters.search } }
      ];
    }
    
    if (filters.status && filters.status !== 'all') {
      directusFilter.status = { _eq: filters.status };
    }

    if (filters.client_id) {
      directusFilter.client_id = { _eq: filters.client_id };
    }

    if (filters.provider_id) {
      directusFilter.provider_id = { _eq: filters.provider_id };
    }

    // Filter for domains expiring soon (next 30 days)
    if (filters.expiring_soon) {
      const today = new Date();
      const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
      
      directusFilter._and = [
        { expiration_date: { _gte: today.toISOString().split('T')[0] } },
        { expiration_date: { _lte: thirtyDaysFromNow.toISOString().split('T')[0] } }
      ];
    }

    const result = await directus.request(
      readItems('Domains', {
        fields: [
          'id',
          'domain_',
          'client_id',
          'provider_id',
          'purchase_date',
          'expiration_date',
          'renewal_price',
          'status',
          'dns_provider',
          'notes',
          'date_created',
          'date_updated'
        ],
        filter: Object.keys(directusFilter).length > 0 ? directusFilter : undefined,
        limit,
        page,
        sort: ['expiration_date'], // Sort by expiration date (upcoming first)
        meta: 'total_count,filter_count'
      })
    );

    console.log('Domains fetched successfully');
    
    // Type assertion for the Directus response structure
    const response = result as any;
    
    return {
      data: response.data || response as Domain[],
      meta: response.meta || { total_count: response.length || 0, filter_count: response.length || 0 }
    };

  } catch (error: any) {
    console.error('Error fetching domains:', error);
    throw new Error(error.message || 'Failed to fetch domains');
  }
};

/**
 * Get single domain by ID
 */
export const getDomain = async (id: number): Promise<Domain> => {
  try {
    console.log(`Fetching domain ${id}...`);

    const domain = await directus.request(
      readItem('Domains', id, {
        fields: [
          'id',
          'domain_',
          'client_id',
          'provider_id',
          'purchase_date',
          'expiration_date',
          'renewal_price',
          'status',
          'dns_provider',
          'notes',
          'date_created',
          'date_updated'
        ]
      })
    );

    console.log('Domain fetched successfully');
    return domain as Domain;

  } catch (error: any) {
    console.error(`Error fetching domain ${id}:`, error);
    throw new Error(error.message || 'Failed to fetch domain');
  }
};

/**
 * Get domain with client and provider information
 */
export const getDomainWithRelations = async (id: number): Promise<DomainWithRelations> => {
  try {
    console.log(`Fetching domain ${id} with relations...`);

    const domain = await directus.request(
      readItem('Domains', id, {
        fields: [
          'id',
          'domain_',
          'client_id',
          'provider_id',
          'purchase_date',
          'expiration_date',
          'renewal_price',
          'status',
          'dns_provider',
          'notes',
          'date_created',
          'date_updated',
          {
            client_id: [
              'id',
              'name',
              'email',
              'status'
            ]
          },
          {
            provider_id: [
              'id',
              'name',
              'website',
              'status'
            ]
          }
        ]
      })
    );

    console.log('Domain with relations fetched successfully');
    return domain as DomainWithRelations;

  } catch (error: any) {
    console.error(`Error fetching domain with relations ${id}:`, error);
    throw new Error(error.message || 'Failed to fetch domain with relations');
  }
};

/**
 * Get domains by client ID
 */
export const getDomainsByClient = async (clientId: number): Promise<Domain[]> => {
  try {
    console.log(`Fetching domains for client ${clientId}...`);

    const result = await getDomains({ client_id: clientId }, 1, 100);

    console.log('Client domains fetched successfully');
    return result.data;

  } catch (error: any) {
    console.error(`Error fetching domains for client ${clientId}:`, error);
    throw new Error(error.message || 'Failed to fetch client domains');
  }
};

/**
 * Get domains expiring soon (next 30 days)
 */
export const getExpiringDomains = async (): Promise<Domain[]> => {
  try {
    console.log('Fetching expiring domains...');

    const result = await getDomains({ expiring_soon: true }, 1, 100);

    console.log('Expiring domains fetched successfully');
    return result.data;

  } catch (error: any) {
    console.error('Error fetching expiring domains:', error);
    throw new Error(error.message || 'Failed to fetch expiring domains');
  }
};

/**
 * Create new domain
 */
export const createDomain = async (data: CreateDomainData): Promise<Domain> => {
  try {
    console.log('Creating new domain...');

    const domain = await directus.request(
      createItem('Domains', data)
    );

    console.log('Domain created successfully');
    return domain as Domain;

  } catch (error: any) {
    console.error('Error creating domain:', error);
    throw new Error(error.message || 'Failed to create domain');
  }
};

/**
 * Update existing domain
 */
export const updateDomain = async (data: UpdateDomainData): Promise<Domain> => {
  try {
    console.log(`Updating domain ${data.id}...`);

    const { id, ...updateData } = data;

    const domain = await directus.request(
      updateItem('Domains', id, updateData)
    );

    console.log('Domain updated successfully');
    return domain as Domain;

  } catch (error: any) {
    console.error(`Error updating domain ${data.id}:`, error);
    throw new Error(error.message || 'Failed to update domain');
  }
};

/**
 * Delete domain
 */
export const deleteDomain = async (id: number): Promise<void> => {
  try {
    console.log(`Deleting domain ${id}...`);

    await directus.request(
      deleteItem('Domains', id)
    );

    console.log('Domain deleted successfully');

  } catch (error: any) {
    console.error(`Error deleting domain ${id}:`, error);
    throw new Error(error.message || 'Failed to delete domain');
  }
};