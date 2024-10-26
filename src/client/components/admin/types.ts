import { ReactNode } from 'react';

export interface AdminLayoutProps {
  children: ReactNode;
}

export interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: 'users' | 'gift' | 'chart' | 'token';
  trend: string;
}

export interface AnalyticsData {
  userMetrics: {
    total_users: number;
    active_users: number;
    new_users: number;
    avg_user_lifetime_days: number;
  };
  rewardsAnalytics: Array<{
    category: string;
    total_rewards: number;
    active_rewards: number;
    avg_points_cost: number;
  }>;
  pointsAnalytics: Array<{
    date: string;
    transaction_type: string;
    transaction_count: number;
    total_points: number;
    avg_points_per_transaction: number;
  }>;
  nftAnalytics: Array<{
    date: string;
    total_minted: number;
    unique_minters: number;
    avg_mints_per_user: number;
  }>;
}

export interface User {
  id: string;
  email: string;
  role: string;
  walletAddress?: string;
  lastLogin?: string;
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  points: number;
  category: string;
  active: boolean;
  metadata: Record<string, any>;
}
