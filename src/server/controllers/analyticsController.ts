import { Request, Response } from 'express';
import { AnalyticsService } from '../services/analyticsService';

export const getAnalyticsDashboard = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { startDate, endDate } = req.query;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    const analyticsService = new AnalyticsService(tenantId);
    
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const [userMetrics, rewardsAnalytics, pointsAnalytics, nftAnalytics] = await Promise.all([
      analyticsService.getUserEngagementMetrics(start, end),
      analyticsService.getRewardsAnalytics(start, end),
      analyticsService.getPointsTransactionAnalytics(start, end),
      analyticsService.getNFTAnalytics(start, end)
    ]);

    res.json({
      userMetrics,
      rewardsAnalytics,
      pointsAnalytics,
      nftAnalytics
    });
  } catch (error) {
    console.error('Error fetching analytics dashboard:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getUserEngagementMetrics = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { startDate, endDate } = req.query;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    const analyticsService = new AnalyticsService(tenantId);
    const metrics = await analyticsService.getUserEngagementMetrics(
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.json(metrics);
  } catch (error) {
    console.error('Error fetching user engagement metrics:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getRewardsAnalytics = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { startDate, endDate } = req.query;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    const analyticsService = new AnalyticsService(tenantId);
    const analytics = await analyticsService.getRewardsAnalytics(
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.json(analytics);
  } catch (error) {
    console.error('Error fetching rewards analytics:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getPointsAnalytics = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { startDate, endDate } = req.query;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    const analyticsService = new AnalyticsService(tenantId);
    const analytics = await analyticsService.getPointsTransactionAnalytics(
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.json(analytics);
  } catch (error) {
    console.error('Error fetching points analytics:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getNFTAnalytics = async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { startDate, endDate } = req.query;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    const analyticsService = new AnalyticsService(tenantId);
    const analytics = await analyticsService.getNFTAnalytics(
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.json(analytics);
  } catch (error) {
    console.error('Error fetching NFT analytics:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
