// src/modules/invoices/hooks/use-invoice.ts

import { useState, useEffect, useCallback } from 'react';
import { getInvoice, getInvoiceWithRelations, updateInvoice } from '../services/invoices-api';
import type { Invoice, InvoiceWithRelations, UpdateInvoiceData } from '../types/invoice.types';

interface UseInvoiceState {
  invoice: Invoice | InvoiceWithRelations | null;
  isLoading: boolean;
  error: string | null;
}

export const useInvoice = (id: number, withRelations = false) => {
  const [state, setState] = useState<UseInvoiceState>({
    invoice: null,
    isLoading: false,
    error: null
  });

  const fetchInvoice = useCallback(async () => {
    if (!id) return;
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const invoice = withRelations 
        ? await getInvoiceWithRelations(id)
        : await getInvoice(id);
      
      setState({
        invoice,
        isLoading: false,
        error: null
      });
    } catch (error: any) {
      setState({
        invoice: null,
        isLoading: false,
        error: error.message
      });
    }
  }, [id, withRelations]);

  const update = useCallback(async (data: Omit<UpdateInvoiceData, 'id'>): Promise<Invoice> => {
    if (!id) throw new Error('No invoice ID provided');
    
    setState(prev => ({ ...prev, error: null }));
    
    try {
      const updatedInvoice = await updateInvoice({ ...data, id });
      
      setState(prev => ({
        ...prev,
        invoice: updatedInvoice
      }));
      
      return updatedInvoice;
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message }));
      throw error;
    }
  }, [id]);

  const refresh = useCallback(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  // Helper to check if invoice is overdue
  const isOverdue = useCallback((): boolean => {
    if (!state.invoice || state.invoice.status === 'paid') return false;
    
    const invoiceDate = new Date(state.invoice.invoice_date);
    const today = new Date();
    const daysSinceInvoice = Math.floor((today.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Consider overdue after 30 days for sent invoices
    return state.invoice.status === 'sent' && daysSinceInvoice > 30;
  }, [state.invoice]);

  // Helper to get days since invoice date
  const getDaysSinceInvoice = useCallback((): number | null => {
    if (!state.invoice) return null;
    
    const invoiceDate = new Date(state.invoice.invoice_date);
    const today = new Date();
    const daysSinceInvoice = Math.floor((today.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return daysSinceInvoice;
  }, [state.invoice]);

  // Helper to mark as paid
  const markAsPaid = useCallback(async (): Promise<Invoice> => {
    return await update({ status: 'paid' });
  }, [update]);

  // Helper to mark as sent
  const markAsSent = useCallback(async (): Promise<Invoice> => {
    return await update({ status: 'sent' });
  }, [update]);

  // Helper to mark as overdue
  const markAsOverdue = useCallback(async (): Promise<Invoice> => {
    return await update({ status: 'overdue' });
  }, [update]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  return {
    invoice: state.invoice,
    isLoading: state.isLoading,
    error: state.error,
    update,
    refresh,
    isOverdue,
    getDaysSinceInvoice,
    markAsPaid,
    markAsSent,
    markAsOverdue
  };
};