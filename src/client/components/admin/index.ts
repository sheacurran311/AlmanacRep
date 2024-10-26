// Export admin components with their proper paths
export { default as AdminLayout } from './AdminLayout';
export { default as Dashboard } from './Dashboard';
export { default as Users } from './Users';
export { default as RewardsManager } from './RewardsManager';
export { default as Analytics } from './Analytics/index';
export { default as DashboardCard } from './DashboardCard';

// Export types
export type { 
  AdminLayoutProps,
  DashboardCardProps, 
  AnalyticsData,
  User,
  Reward 
} from './types';
