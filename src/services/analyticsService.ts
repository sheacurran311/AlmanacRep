import { DatabaseManager } from '../config/database';
import { getTenantSchema } from '../server/utils/dbUtils.js';

export class AnalyticsService {
  private tenantId: string;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
  }

  async getUserEngagementMetrics(startDate: Date, endDate: Date) {
    const schemaName = getTenantSchema(this.tenantId);
    try {
      const result = await DatabaseManager.query(
        `
        SELECT
          COUNT(DISTINCT u.id) as total_users,
          COUNT(DISTINCT CASE WHEN u.last_login >= $1 THEN u.id END) as active_users,
          COUNT(DISTINCT CASE WHEN u.created_at >= $1 THEN u.id END) as new_users,
          COALESCE(AVG(EXTRACT(EPOCH FROM (u.last_login - u.created_at))/86400), 0) as avg_user_lifetime_days
        FROM ${schemaName}.users u
        WHERE u.created_at <= $2
        `,
        [startDate, endDate]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error fetching user engagement metrics:', error);
      throw error;
    }
  }

  async getRewardsAnalytics(startDate: Date, endDate: Date) {
    const schemaName = getTenantSchema(this.tenantId);
    try {
      const result = await DatabaseManager.query(
        `
        WITH reward_stats AS (
          SELECT
            r.category,
            COUNT(*) as total_rewards,
            SUM(CASE WHEN r.active THEN 1 ELSE 0 END) as active_rewards,
            AVG(r.points) as avg_points_cost
          FROM ${schemaName}.rewards r
          WHERE r.created_at BETWEEN $1 AND $2
          GROUP BY r.category
        )
        SELECT
          category,
          total_rewards,
          active_rewards,
          ROUND(avg_points_cost::numeric, 2) as avg_points_cost
        FROM reward_stats
        `,
        [startDate, endDate]
      );
      
      return result.rows;
    } catch (error) {
      console.error('Error fetching rewards analytics:', error);
      throw error;
    }
  }

  async getPointsTransactionAnalytics(startDate: Date, endDate: Date) {
    const schemaName = getTenantSchema(this.tenantId);
    try {
      const result = await DatabaseManager.query(
        `
        SELECT
          DATE_TRUNC('day', pt.created_at) as date,
          pt.transaction_type,
          COUNT(*) as transaction_count,
          SUM(pt.points) as total_points,
          AVG(pt.points) as avg_points_per_transaction
        FROM ${schemaName}.points_transactions pt
        WHERE pt.created_at BETWEEN $1 AND $2
        GROUP BY DATE_TRUNC('day', pt.created_at), pt.transaction_type
        ORDER BY date DESC, transaction_type
        `,
        [startDate, endDate]
      );
      
      return result.rows;
    } catch (error) {
      console.error('Error fetching points transaction analytics:', error);
      throw error;
    }
  }

  async getNFTAnalytics(startDate: Date, endDate: Date) {
    const schemaName = getTenantSchema(this.tenantId);
    try {
      const result = await DatabaseManager.query(
        `
        WITH nft_stats AS (
          SELECT
            DATE_TRUNC('day', created_at) as date,
            COUNT(*) as total_minted,
            COUNT(DISTINCT user_id) as unique_minters
          FROM ${schemaName}.audit_logs
          WHERE action = 'NFT_MINT'
          AND created_at BETWEEN $1 AND $2
          GROUP BY DATE_TRUNC('day', created_at)
        )
        SELECT
          date,
          total_minted,
          unique_minters,
          ROUND((total_minted::float / unique_minters), 2) as avg_mints_per_user
        FROM nft_stats
        ORDER BY date DESC
        `,
        [startDate, endDate]
      );
      
      return result.rows;
    } catch (error) {
      console.error('Error fetching NFT analytics:', error);
      throw error;
    }
  }

  async getTenantSummary() {
    const schemaName = getTenantSchema(this.tenantId);
    try {
      const result = await DatabaseManager.query(
        `
        SELECT
          (SELECT COUNT(*) FROM ${schemaName}.users) as total_users,
          (SELECT COUNT(*) FROM ${schemaName}.rewards WHERE active = true) as active_rewards,
          (SELECT SUM(points) FROM ${schemaName}.loyalty_points) as total_points_balance,
          (SELECT COUNT(*) FROM ${schemaName}.audit_logs WHERE action = 'NFT_MINT') as total_nfts_minted
        `
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error fetching tenant summary:', error);
      throw error;
    }
  }
}
