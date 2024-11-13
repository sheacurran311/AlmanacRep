import { Request, Response } from 'express';
import { DatabaseManager, pool } from '../config/database';

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
  services: {
    database: 'connected' | 'disconnected';
    api: 'running' | 'stopped';
  };
  uptime: number;
  environment: string;
  metrics?: {
    database: {
      totalConnections: number;
      idleConnections: number;
      waitingClients: number;
    };
  };
}

export const healthCheck = async (_req: Request, res: Response) => {
  try {
    // Check database connectivity
    const isDbConnected = await DatabaseManager.testConnection();
    const dbMetrics = await DatabaseManager.getPoolMetrics();

    const health: HealthStatus = {
      status: isDbConnected ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: isDbConnected ? 'connected' : 'disconnected',
        api: 'running'
      },
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      metrics: {
        database: {
          totalConnections: dbMetrics.totalConnections,
          idleConnections: dbMetrics.idleConnections,
          waitingClients: dbMetrics.waitingClients
        }
      }
    };

    res.status(isDbConnected ? 200 : 503).json(health);
  } catch (error) {
    console.error('[Health Check] Error:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const readiness = async (_req: Request, res: Response) => {
  try {
    // Verify database connection
    const isDbConnected = await DatabaseManager.testConnection();
    
    if (!isDbConnected) {
      throw new Error('Database connection check failed');
    }

    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        api: 'running'
      }
    });
  } catch (error) {
    console.error('[Readiness Check] Error:', error);
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
