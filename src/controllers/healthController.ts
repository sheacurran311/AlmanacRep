import { Request, Response } from 'express';
import { DatabaseManager } from '../config/database';
import { constants } from '../config/constants';
import net from 'net';

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
    };
    frontend: {
      port: number;
      status: 'available' | 'unavailable';
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

const checkPort = (port: number): Promise<boolean> => {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.once('error', () => {
      resolve(true); // Port is in use (which is good in our case)
    });
    
    server.once('listening', () => {
      server.close();
      resolve(false); // Port is not in use
    });
    
    server.listen(port, '0.0.0.0');
  });
};

export const healthCheck = async (_req: Request, res: Response) => {
  try {
    // Check database connectivity
    const isDbConnected = await DatabaseManager.testConnection();
    const dbMetrics = await DatabaseManager.getPoolMetrics();

    // Check port availability
    const apiPort = constants.ENV.isDev ? constants.INTERNAL_PORT : constants.PORTS.getAPIPort();
    const frontendPort = constants.PORTS.getFrontendPort();

    const [isApiPortInUse, isFrontendPortInUse] = await Promise.all([
      checkPort(apiPort),
      checkPort(frontendPort)
    ]);

    const health: HealthStatus = {
      status: isDbConnected && isApiPortInUse && isFrontendPortInUse ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: isDbConnected ? 'connected' : 'disconnected',
        api: isApiPortInUse ? 'running' : 'stopped',
        frontend: isFrontendPortInUse ? 'running' : 'stopped'
      },
      ports: {
        api: {
          port: apiPort,
          status: isApiPortInUse ? 'available' : 'unavailable'
        },
        frontend: {
          port: frontendPort,
          status: isFrontendPortInUse ? 'available' : 'unavailable'
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
    
    // Check port availability
    const apiPort = constants.ENV.isDev ? constants.INTERNAL_PORT : constants.PORTS.getAPIPort();
    const frontendPort = constants.PORTS.getFrontendPort();
    
    const [isApiPortInUse, isFrontendPortInUse] = await Promise.all([
      checkPort(apiPort),
      checkPort(frontendPort)
    ]);
    
    if (!isDbConnected || !isApiPortInUse || !isFrontendPortInUse) {
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
