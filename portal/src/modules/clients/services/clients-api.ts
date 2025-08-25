// src/modules/clients/services/clients-api.ts

import { readItems, readItem, createItem, updateItem, deleteItem } from '@directus/sdk';
import { directus } from '../../../lib/directus/client';
import type { 
  Client, 
  CreateClientData, 
  UpdateClientData, 
  ClientFilters,
  ClientsResponse,
  ClientWithRelations
} from '../types/client.types';

/**
 * Get all clients with optional filtering
 */
export const getClients = async (
  filters: ClientFilters = {},
  page = 1,
  limit = 25
): Promise<ClientsResponse> => {
  try {
    console.log('📋 Fetching clients...');

    // Build filter object
    const directusFilter: any = {};
    
    if (filters.search) {
      directusFilter._or = [
        { name: { _icontains: filters.search } },
        { email: { _icontains: filters.search } }
      ];
    }
    
    if (filters.status && filters.status !== 'all') {
      directusFilter.status = { _eq: filters.status };
    }

    const result = await directus.request(
      readItems('clients', {
        fields: [
          'id',
          'name', 
          'email',
          'phone',
          'status',
          'notes',
          'websites',
          'logo',
          'date_created',
          'date_updated'
        ],
        filter: Object.keys(directusFilter).length > 0 ? directusFilter : undefined,
        limit,
        page,
        sort: ['-date_created'],
        meta: 'total_count,filter_count'
      })
    );

    console.log('✅ Clients fetched successfully');
    
    // Type assertion for the Directus response structure
    const response = result as any;
    
    return {
      data: response.data || response as Client[],
      meta: response.meta || { total_count: response.length || 0, filter_count: response.length || 0 }
    };

  } catch (error: any) {
    console.error('❌ Error fetching clients:', error);
    throw new Error(error.message || 'Failed to fetch clients');
  }
};

/**
 * Get single client by ID
 */
export const getClient = async (id: number): Promise<Client> => {
  try {
    console.log(`👤 Fetching client ${id}...`);

    const client = await directus.request(
      readItem('clients', id, {
        fields: [
          'id',
          'name',
          'email',
          'phone',
          'status',
          'notes',
          'websites',
          'logo',
          'client_files',
          'date_created',
          'date_updated'
        ]
      })
    );

    console.log('✅ Client fetched successfully');
    return client as Client;

  } catch (error: any) {
    console.error(`❌ Error fetching client ${id}:`, error);
    throw new Error(error.message || 'Failed to fetch client');
  }
};

/**
 * Get client with all related data (services, domains, invoices, projects)
 */
export const getClientWithRelations = async (id: number): Promise<ClientWithRelations> => {
  try {
    console.log(`🔗 Fetching client ${id} with relations...`);

    const client = await directus.request(
      readItem('clients', id, {
        fields: [
          'id',
          'name',
          'email',
          'phone',
          'status',
          'notes',
          'websites',
          'logo',
          'client_files',
          'date_created',
          'date_updated'
        ]
      })
    );

    // TODO: Add related data queries once we implement other modules
    // For now, just return the basic client data
    const clientWithRelations: ClientWithRelations = {
      ...client as Client,
      services: [], // Will implement when services module is ready
      domains: [],  // Will implement when domains module is ready
      invoices: [], // Will implement when invoices module is ready
      projects: []  // Will implement when projects module is ready
    };

    console.log('✅ Client with relations fetched successfully');
    return clientWithRelations;

  } catch (error: any) {
    console.error(`❌ Error fetching client with relations ${id}:`, error);
    throw new Error(error.message || 'Failed to fetch client with relations');
  }
};

/**
 * Create new client
 */
export const createClient = async (data: CreateClientData): Promise<Client> => {
  try {
    console.log('➕ Creating new client...');

    const client = await directus.request(
      createItem('clients', data)
    );

    console.log('✅ Client created successfully');
    return client as Client;

  } catch (error: any) {
    console.error('❌ Error creating client:', error);
    throw new Error(error.message || 'Failed to create client');
  }
};

/**
 * Update existing client
 */
export const updateClient = async (data: UpdateClientData): Promise<Client> => {
  try {
    console.log(`✏️ Updating client ${data.id}...`);

    const { id, ...updateData } = data;

    const client = await directus.request(
      updateItem('clients', id, updateData)
    );

    console.log('✅ Client updated successfully');
    return client as Client;

  } catch (error: any) {
    console.error(`❌ Error updating client ${data.id}:`, error);
    throw new Error(error.message || 'Failed to update client');
  }
};

/**
 * Delete client
 */
export const deleteClient = async (id: number): Promise<void> => {
  try {
    console.log(`🗑️ Deleting client ${id}...`);

    await directus.request(
      deleteItem('clients', id)
    );

    console.log('✅ Client deleted successfully');

  } catch (error: any) {
    console.error(`❌ Error deleting client ${id}:`, error);
    throw new Error(error.message || 'Failed to delete client');
  }
};