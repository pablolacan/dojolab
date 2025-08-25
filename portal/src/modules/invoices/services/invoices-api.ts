// src/modules/invoices/services/invoices-api.ts

import { readItems, readItem, createItem, updateItem, deleteItem, aggregate } from '@directus/sdk';
import { directus } from '../../../lib/directus/client';
import type { 
  Invoice, 
  CreateInvoiceData, 
  UpdateInvoiceData, 
  InvoiceFilters,
  InvoicesResponse,
  InvoiceWithRelations,
  InvoiceSummary
} from '../types/invoice.types';

/**
 * Get all invoices with optional filtering
 */
export const getInvoices = async (
  filters: InvoiceFilters = {},
  page = 1,
  limit = 25
): Promise<InvoicesResponse> => {
  try {
    console.log('Fetching invoices...');

    // Build filter object
    const directusFilter: any = {};
    
    if (filters.search) {
      directusFilter._or = [
        { invoice_number: { _icontains: filters.search } },
        { notes: { _icontains: filters.search } }
      ];
    }
    
    if (filters.status && filters.status !== 'all') {
      directusFilter.status = { _eq: filters.status };
    }

    if (filters.client_id) {
      directusFilter.client_id = { _eq: filters.client_id };
    }

    if (filters.projects_id) {
      directusFilter.projects_id = { _eq: filters.projects_id };
    }

    if (filters.date_from || filters.date_to) {
      directusFilter.invoice_date = {};
      if (filters.date_from) {
        directusFilter.invoice_date._gte = filters.date_from;
      }
      if (filters.date_to) {
        directusFilter.invoice_date._lte = filters.date_to;
      }
    }

    if (filters.amount_min || filters.amount_max) {
      directusFilter.amount = {};
      if (filters.amount_min) {
        directusFilter.amount._gte = filters.amount_min;
      }
      if (filters.amount_max) {
        directusFilter.amount._lte = filters.amount_max;
      }
    }

    const result = await directus.request(
      readItems('invoices', {
        fields: [
          'id',
          'client_id',
          'projects_id',
          'invoice_number',
          'invoice_date',
          'amount',
          'invoice_file',
          'status',
          'notes',
          'date_created',
          'date_updated'
        ],
        filter: Object.keys(directusFilter).length > 0 ? directusFilter : undefined,
        limit,
        page,
        sort: ['-invoice_date', '-date_created'],
        meta: 'total_count,filter_count'
      })
    );

    console.log('Invoices fetched successfully');
    
    // Type assertion for the Directus response structure
    const response = result as any;
    
    return {
      data: response.data || response as Invoice[],
      meta: response.meta || { total_count: response.length || 0, filter_count: response.length || 0 }
    };

  } catch (error: any) {
    console.error('Error fetching invoices:', error);
    throw new Error(error.message || 'Failed to fetch invoices');
  }
};

/**
 * Get single invoice by ID
 */
export const getInvoice = async (id: number): Promise<Invoice> => {
  try {
    console.log(`Fetching invoice ${id}...`);

    const invoice = await directus.request(
      readItem('invoices', id, {
        fields: [
          'id',
          'client_id',
          'projects_id',
          'invoice_number',
          'invoice_date',
          'amount',
          'invoice_file',
          'status',
          'notes',
          'date_created',
          'date_updated'
        ]
      })
    );

    console.log('Invoice fetched successfully');
    return invoice as Invoice;

  } catch (error: any) {
    console.error(`Error fetching invoice ${id}:`, error);
    throw new Error(error.message || 'Failed to fetch invoice');
  }
};

/**
 * Get invoice with client and project information
 */
export const getInvoiceWithRelations = async (id: number): Promise<InvoiceWithRelations> => {
  try {
    console.log(`Fetching invoice ${id} with relations...`);

    const invoice = await directus.request(
      readItem('invoices', id, {
        fields: [
          'id',
          'client_id',
          'projects_id',
          'invoice_number',
          'invoice_date',
          'amount',
          'invoice_file',
          'status',
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
          }
          // Note: Commented out project relation since projects module isn't implemented
          // {
          //   projects_id: [
          //     'id',
          //     'project_name',
          //     'status'
          //   ]
          // }
        ]
      })
    );

    console.log('Invoice with relations fetched successfully');
    return invoice as InvoiceWithRelations;

  } catch (error: any) {
    console.error(`Error fetching invoice with relations ${id}:`, error);
    throw new Error(error.message || 'Failed to fetch invoice with relations');
  }
};

/**
 * Get invoices by client ID
 */
export const getInvoicesByClient = async (clientId: number): Promise<Invoice[]> => {
  try {
    console.log(`Fetching invoices for client ${clientId}...`);

    const result = await getInvoices({ client_id: clientId }, 1, 100);

    console.log('Client invoices fetched successfully');
    return result.data;

  } catch (error: any) {
    console.error(`Error fetching invoices for client ${clientId}:`, error);
    throw new Error(error.message || 'Failed to fetch client invoices');
  }
};

/**
 * Get invoice summary/stats
 */
export const getInvoiceSummary = async (filters: InvoiceFilters = {}): Promise<InvoiceSummary> => {
  try {
    console.log('Fetching invoice summary...');

    // Build filter for aggregation
    const directusFilter: any = {};
    
    if (filters.client_id) {
      directusFilter.client_id = { _eq: filters.client_id };
    }

    if (filters.date_from || filters.date_to) {
      directusFilter.invoice_date = {};
      if (filters.date_from) {
        directusFilter.invoice_date._gte = filters.date_from;
      }
      if (filters.date_to) {
        directusFilter.invoice_date._lte = filters.date_to;
      }
    }

    // Get total counts and amounts
    const totalResult = await directus.request(
      aggregate('invoices', {
        aggregate: {
          count: '*',
          sum: ['amount']
        },
        filter: Object.keys(directusFilter).length > 0 ? directusFilter : undefined
      })
    );

    // Get counts by status
    const statusResults = await Promise.all([
      'draft', 'sent', 'paid', 'overdue'
    ].map(status => 
      directus.request(
        aggregate('invoices', {
          aggregate: {
            count: '*',
            sum: ['amount']
          },
          filter: {
            ...directusFilter,
            status: { _eq: status }
          }
        })
      )
    ));

    console.log('Invoice summary fetched successfully');

    return {
      total_invoices: Number(totalResult[0].count || 0),
      total_amount: Number(totalResult[0].sum?.amount || 0),
      draft_count: Number(statusResults[0][0]?.count || 0),
      sent_count: Number(statusResults[1][0]?.count || 0),
      paid_count: Number(statusResults[2][0]?.count || 0),
      overdue_count: Number(statusResults[3][0]?.count || 0),
      draft_amount: Number(statusResults[0][0]?.sum?.amount || 0),
      sent_amount: Number(statusResults[1][0]?.sum?.amount || 0),
      paid_amount: Number(statusResults[2][0]?.sum?.amount || 0),
      overdue_amount: Number(statusResults[3][0]?.sum?.amount || 0)
    };

  } catch (error: any) {
    console.error('Error fetching invoice summary:', error);
    throw new Error(error.message || 'Failed to fetch invoice summary');
  }
};

/**
 * Create new invoice
 */
export const createInvoice = async (data: CreateInvoiceData): Promise<Invoice> => {
  try {
    console.log('Creating new invoice...');

    const invoice = await directus.request(
      createItem('invoices', data)
    );

    console.log('Invoice created successfully');
    return invoice as Invoice;

  } catch (error: any) {
    console.error('Error creating invoice:', error);
    throw new Error(error.message || 'Failed to create invoice');
  }
};

/**
 * Update existing invoice
 */
export const updateInvoice = async (data: UpdateInvoiceData): Promise<Invoice> => {
  try {
    console.log(`Updating invoice ${data.id}...`);

    const { id, ...updateData } = data;

    const invoice = await directus.request(
      updateItem('invoices', id, updateData)
    );

    console.log('Invoice updated successfully');
    return invoice as Invoice;

  } catch (error: any) {
    console.error(`Error updating invoice ${data.id}:`, error);
    throw new Error(error.message || 'Failed to update invoice');
  }
};

/**
 * Delete invoice
 */
export const deleteInvoice = async (id: number): Promise<void> => {
  try {
    console.log(`Deleting invoice ${id}...`);

    await directus.request(
      deleteItem('invoices', id)
    );

    console.log('Invoice deleted successfully');

  } catch (error: any) {
    console.error(`Error deleting invoice ${id}:`, error);
    throw new Error(error.message || 'Failed to delete invoice');
  }
};

/**
 * Generate next invoice number
 */
export const generateInvoiceNumber = async (): Promise<string> => {
  try {
    console.log('Generating invoice number...');

    // Get the latest invoice to determine the next number
    const result = await directus.request(
      readItems('invoices', {
        fields: ['invoice_number'],
        sort: ['-date_created'],
        limit: 1
      })
    );

    const latestInvoices = result as any;
    const invoices = latestInvoices.data || latestInvoices;

    if (invoices.length === 0) {
      return `INV-${new Date().getFullYear()}-0001`;
    }

    const latestNumber = invoices[0].invoice_number;
    const year = new Date().getFullYear();
    const yearString = year.toString();

    // Extract number from latest invoice (assuming format INV-YYYY-NNNN)
    const match = latestNumber.match(/INV-(\d{4})-(\d{4})/);
    
    if (match) {
      const invoiceYear = parseInt(match[1]);
      const invoiceNum = parseInt(match[2]);
      
      if (invoiceYear === year) {
        // Same year, increment number
        const nextNum = (invoiceNum + 1).toString().padStart(4, '0');
        return `INV-${yearString}-${nextNum}`;
      }
    }
    
    // Different year or format, start fresh
    return `INV-${yearString}-0001`;

  } catch (error: any) {
    console.error('Error generating invoice number:', error);
    // Fallback to timestamp-based number
    const timestamp = Date.now().toString().slice(-4);
    return `INV-${new Date().getFullYear()}-${timestamp}`;
  }
};