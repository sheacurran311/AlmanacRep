import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AnalyticsService } from '../services/analyticsService';

export const getAnalyticsDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const analyticsService = new AnalyticsService(tenantId);
    
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const [
      userMetrics,
      rewardsAnalytics,
      pointsAnalytics,
      nftAnalytics,
      tenantSummary
    ] = await Promise.all([
      analyticsService.getUserEngagementMetrics(start, end),
      analyticsService.getRewardsAnalytics(start, end),
      analyticsService.getPointsTransactionAnalytics(start, end),
      analyticsService.getNFTAnalytics(start, end),
      analyticsService.getTenantSummary()
    ]);

    res.json({
      timeframe: {
        start: start.toISOString(),
        end: end.toISOString()
      },
      userMetrics,
      rewardsAnalytics,
      pointsAnalytics,
      nftAnalytics,
      tenantSummary
    });
  } catch (error) {
    console.error('Error fetching analytics dashboard:', error);
    res.status(500).json({ message: 'Failed to fetch analytics data' });
  }
};

export const getUserEngagementMetrics = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const analyticsService = new AnalyticsService(tenantId);
    
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const metrics = await analyticsService.getUserEngagementMetrics(start, end);
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching user engagement metrics:', error);
    res.status(500).json({ message: 'Failed to fetch user engagement metrics' });
  }
};

export const getRewardsAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const analyticsService = new AnalyticsService(tenantId);
    
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const analytics = await analyticsService.getRewardsAnalytics(start, end);
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching rewards analytics:', error);
    res.status(500).json({ message: 'Failed to fetch rewards analytics' });
  }
};

export const getPointsAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const analyticsService = new AnalyticsService(tenantId);
    
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const analytics = await analyticsService.getPointsTransactionAnalytics(start, end);
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching points analytics:', error);
    res.status(500).json({ message: 'Failed to fetch points analytics' });
  }
};

export const getNFTAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const analyticsService = new AnalyticsService(tenantId);
    
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const analytics = await analyticsService.getNFTAnalytics(start, end);
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching NFT analytics:', error);
    res.status(500).json({ message: 'Failed to fetch NFT analytics' });
  }
};
