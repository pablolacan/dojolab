// Mapeo de estados de suscripciones
export const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    'pending': 'Pendiente',
    'active': 'Activo',
    'cancelled': 'Cancelado',
    'expired': 'Expirado',
    'trialing': 'Prueba'
  };
  return statusMap[status] || status;
};

// Mapeo de tipos de plan
export const getPlanTypeText = (planType: string): string => {
  const planTypeMap: Record<string, string> = {
    'free': 'Gratis',
    'paid': 'Paga'
  };
  return planTypeMap[planType] || planType;
};

// Mapeo de ciclos de facturación
export const getBillingCycleText = (billingCycle: string): string => {
  const billingCycleMap: Record<string, string> = {
    'monthly': 'Mensual',
    'yearly': 'Anual',
    'one_time': 'Único',
    'none': 'Gratis'
  };
  return billingCycleMap[billingCycle] || billingCycle;
};

// Mapeo de colores para estados
export const getStatusColor = (status: string): string => {
  const statusColorMap: Record<string, string> = {
    'pending': '#5568C3',
    'active': '#89E557',
    'cancelled': '#E27E7E',
    'expired': '#E93F3F',
    'trialing': '#94F3FF'
  };
  return statusColorMap[status] || '#6B7280';
};

// Mapeo de variantes para StatusBadge
export const getStatusVariant = (status: string): 'success' | 'warning' | 'error' | 'info' | 'neutral' => {
  const variantMap: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
    'active': 'success',
    'pending': 'warning',
    'cancelled': 'error',
    'expired': 'error',
    'trialing': 'info'
  };
  return variantMap[status] || 'neutral';
};

// Mapeo de variantes para tipos de plan
export const getPlanTypeVariant = (planType: string): 'info' | 'neutral' => {
  return planType === 'paid' ? 'info' : 'neutral';
};