// src/modules/dashboard/hooks/use-dashboard-stats.ts

import { useState, useEffect, useCallback } from 'react';
import { getClients } from '../../clients/services/clients-api';
import { getServices } from '../../services/services/services-api';
import { getInvoices, getInvoiceSummary } from '../../invoices/services/invoices-api';
import { getExpiringDomains } from '../../domains/services/domains-api';

interface DashboardStats {
  totalClients: number;
  activeServices: number;
  pendingInvoices: number;
  expiringDomains: number;
  clientsChange?: number;
  servicesChange?: number;
  invoicesChange?: number;
}

interface UseDashboardStatsReturn {
  stats: DashboardStats | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export const useDashboardStats = (): UseDashboardStatsReturn => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch data in parallel, but handle individual failures
      const results = await Promise.allSettled([
        getClients({}, 1, 1),
        getServices({ status: 'active' }, 1, 1),
        getExpiringDomains()
      ]);

      // Handle invoice summary separately due to permission issues
      let pendingInvoicesCount = 0;
      try {
        const invoiceSummary = await getInvoiceSummary({ status: 'sent' });
        pendingInvoicesCount = invoiceSummary.sent_count + invoiceSummary.overdue_count;
      } catch (invoiceError) {
        console.warn('No access to invoices, using fallback count');
        pendingInvoicesCount = 0;
      }

      const dashboardStats: DashboardStats = {
        totalClients: results[0].status === 'fulfilled' ? results[0].value.meta.total_count : 0,
        activeServices: results[1].status === 'fulfilled' ? results[1].value.meta.total_count : 0,
        pendingInvoices: pendingInvoicesCount,
        expiringDomains: results[2].status === 'fulfilled' ? results[2].value.length : 0,
        // Simulate changes
        clientsChange: Math.floor(Math.random() * 5) - 2,
        servicesChange: Math.floor(Math.random() * 3),
        invoicesChange: Math.floor(Math.random() * 10) - 5
      };

      setStats(dashboardStats);
      
      // Check if any critical fetch failed
      const failures = results.filter(result => result.status === 'rejected');
      if (failures.length > 0) {
        console.warn('Some stats failed to load:', failures);
      }
      
    } catch (err: any) {
      console.error('Error fetching dashboard stats:', err);
      setError(err.message || 'Error al cargar estadísticas');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    isLoading,
    error,
    refresh
  };
};