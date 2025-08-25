// src/modules/subscriptions/types/subscription.types.ts

export interface Subscription {
  id: number;
  status: 'pending' | 'active' | 'cancelled' | 'expired' | 'trialing';
  service_name: string;
  plan_type: 'free' | 'paid';
  billing_cycle: 'monthly' | 'yearly' | 'one_time' | 'none';
  renewal_date: string; // date string
  cost: number;
  
  // Metadata
  date_created?: string;
  user_updated?: string;
  date_updated?: string;
}

export interface CreateSubscriptionData {
  service_name: string;
  plan_type: 'free' | 'paid';
  billing_cycle: 'monthly' | 'yearly' | 'one_time' | 'none';
  renewal_date: string;
  cost: number;
  status?: 'pending' | 'active' | 'cancelled' | 'expired' | 'trialing';
}

export interface UpdateSubscriptionData extends Partial<CreateSubscriptionData> {
  id: number;
}

export interface SubscriptionFilters {
  search?: string;
  status?: 'pending' | 'active' | 'cancelled' | 'expired' | 'trialing' | 'all';
  plan_type?: 'free' | 'paid' | 'all';
  billing_cycle?: 'monthly' | 'yearly' | 'one_time' | 'none' | 'all';
}

export interface SubscriptionsResponse {
  data: Subscription[];
  meta: {
    total_count: number;
    filter_count: number;
  };
}