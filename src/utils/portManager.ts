import net from 'net';
import { constants } from '../config/constants';

interface PortConfig {
  port: number;
  isAvailable: boolean;
}

export class PortManager {
  private static readonly PORT_RANGES = {
    api: {
      start: 3001,
      end: 3010,
    },
    frontend: {
      start: 5173,
      end: 5182,
    },
  };

  static async findAvailablePort(
    startPort: number,
    endPort: number
  ): Promise<number> {
    for (let port = startPort; port <= endPort; port++) {
      if (await this.isPortAvailable(port)) {
        return port;
      }
    }
    throw new Error(`No available ports found in range ${startPort}-${endPort}`);
  }

  // Made public for health checks
  static async isPortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const server = net.createServer();
      
      server.once('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE') {
          resolve(false); // Port is in use
        } else {
          console.error(`[${new Date().toISOString()}] [Port Manager] Error checking port ${port}:`, err);
          resolve(false); // Assume port is unavailable on error
        }
      });
      
      server.once('listening', () => {
        server.close();
        resolve(true); // Port is available
      });
      
      try {
        server.listen(port, '0.0.0.0');
      } catch (error) {
        console.error(`[${new Date().toISOString()}] [Port Manager] Error binding to port ${port}:`, error);
        resolve(false);
      }
    });
  }

  static async setupPorts(): Promise<{ apiPort: number; frontendPort: number }> {
    const desiredApiPort = constants.ENV.isDev ? constants.INTERNAL_PORT : constants.EXTERNAL_PORT;
    const desiredFrontendPort = constants.VITE.DEV_SERVER_PORT;

    try {
      // Try to get API port with retries
      let apiPort: number;
      try {
        apiPort = await this.isPortAvailable(desiredApiPort)
          ? desiredApiPort
          : await this.findAvailablePort(
              this.PORT_RANGES.api.start,
              this.PORT_RANGES.api.end
            );
      } catch (error) {
        console.error(`[${new Date().toISOString()}] [Port Manager] Failed to find available API port:`, error);
        throw new Error('No available ports for API server');
      }

      // Try to get frontend port with retries
      let frontendPort: number;
      try {
        frontendPort = await this.isPortAvailable(desiredFrontendPort)
          ? desiredFrontendPort
          : await this.findAvailablePort(
              this.PORT_RANGES.frontend.start,
              this.PORT_RANGES.frontend.end
            );
      } catch (error) {
        console.error(`[${new Date().toISOString()}] [Port Manager] Failed to find available frontend port:`, error);
        throw new Error('No available ports for frontend server');
      }

      // Update environment variables with the new ports
      process.env.PORT = apiPort.toString();
      process.env.INTERNAL_PORT = apiPort.toString();
      process.env.VITE_DEV_SERVER_PORT = frontendPort.toString();
      process.env.VITE_API_SERVER_PORT = apiPort.toString();

      console.log(`[${new Date().toISOString()}] [Port Manager] Ports configured - API: ${apiPort}, Frontend: ${frontendPort}`);
      return { apiPort, frontendPort };
    } catch (error) {
      console.error(`[${new Date().toISOString()}] [Port Manager] Error setting up ports:`, error);
      throw error;
    }
  }
}
