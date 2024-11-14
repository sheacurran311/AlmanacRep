import { Request, Response } from 'express';
import { DatabaseManager } from '../config/database';
import { constants } from '../config/constants';
import { PortManager } from '../utils/portManager';

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
  services: {
    database: 'connected' | 'disconnected';
    api: 'running' | 'stopped';
    frontend: 'running' | 'stopped';
  };
  ports: {
    api: {
      port: number;
      status: 'available' | 'unavailable';
      fallback?: boolean;
    };
    frontend: {
      port: number;
      status: 'available' | 'unavailable';
      fallback?: boolean;
    };
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

    // Get current port configuration
    const apiPort = parseInt(process.env.PORT || constants.INTERNAL_PORT.toString());
    const frontendPort = parseInt(process.env.VITE_DEV_SERVER_PORT || constants.VITE.DEV_SERVER_PORT.toString());

    // Check if ports are available using PortManager
    const isApiPortAvailable = await PortManager.isPortAvailable(apiPort);
    const isFrontendPortAvailable = await PortManager.isPortAvailable(frontendPort);

    // Determine if we're using fallback ports
    const isApiFallback = apiPort !== constants.INTERNAL_PORT;
    const isFrontendFallback = frontendPort !== constants.VITE.DEV_SERVER_PORT;

    const health: HealthStatus = {
      status: isDbConnected && (!isApiPortAvailable) && (!isFrontendPortAvailable) ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: isDbConnected ? 'connected' : 'disconnected',
        api: !isApiPortAvailable ? 'running' : 'stopped',
        frontend: !isFrontendPortAvailable ? 'running' : 'stopped'
      },
      ports: {
        api: {
          port: apiPort,
          status: !isApiPortAvailable ? 'available' : 'unavailable',
          fallback: isApiFallback
        },
        frontend: {
          port: frontendPort,
          status: !isFrontendPortAvailable ? 'available' : 'unavailable',
          fallback: isFrontendFallback
        }
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

    res.status(health.status === 'healthy' ? 200 : 503).json(health);
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
    
    // Get current port configuration
    const apiPort = parseInt(process.env.PORT || constants.INTERNAL_PORT.toString());
    const frontendPort = parseInt(process.env.VITE_DEV_SERVER_PORT || constants.VITE.DEV_SERVER_PORT.toString());
    
    // Check if ports are available using PortManager
    const isApiPortAvailable = await PortManager.isPortAvailable(apiPort);
    const isFrontendPortAvailable = await PortManager.isPortAvailable(frontendPort);
    
    if (!isDbConnected || isApiPortAvailable || isFrontendPortAvailable) {
      throw new Error('Service readiness check failed');
    }

    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        api: 'running',
        frontend: 'running'
      },
      ports: {
        api: {
          port: apiPort,
          status: 'available'
        },
        frontend: {
          port: frontendPort,
          status: 'available'
        }
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
