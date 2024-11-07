import { server } from './app.js';
import { initializeDatabase } from '../config/initDb.js';
import { DatabaseManager } from '../config/database.js';

const startServer = async () => {
  try {
    console.log(`[${new Date().toISOString()}] [SERVER] Starting server initialization...`);
    
    // Get internal and external ports
    const internalPort = parseInt(process.env.INTERNAL_PORT || '3001');
    const externalPort = parseInt(process.env.PORT || '80');
    
    // Log PostgreSQL connection details (without sensitive info)
    console.log(`[${new Date().toISOString()}] [DATABASE] Connecting to PostgreSQL:
      Host: ${process.env.PGHOST}
      Port: ${process.env.PGPORT}
      Database: ${process.env.PGDATABASE}
      User: ${process.env.PGUSER}
    `);
    
    // Test database connection first
    try {
      await DatabaseManager.query('SELECT NOW()');
      console.log(`[${new Date().toISOString()}] [DATABASE] Connection successful`);
    } catch (dbError) {
      console.error(`[${new Date().toISOString()}] [DATABASE] Connection failed:`, dbError);
      process.exit(1);
    }

    // Initialize database
    try {
      await initializeDatabase();
      console.log(`[${new Date().toISOString()}] [DATABASE] Initialization completed`);
    } catch (dbError) {
      console.error(`[${new Date().toISOString()}] [DATABASE] Initialization failed:`, dbError);
      process.exit(1);
    }

    // Start server with proper binding
    const serverInstance = server.listen(internalPort, '0.0.0.0', () => {
      console.log(`[${new Date().toISOString()}] [SERVER] Server is running on port ${internalPort}`);
      console.log(`[${new Date().toISOString()}] [SERVER] Access URLs:`);
      console.log(`- Local: http://localhost:${internalPort}`);
      console.log(`- Network: http://0.0.0.0:${internalPort}`);
      console.log(`- External: http://0.0.0.0:${externalPort}`);
      console.log(`[${new Date().toISOString()}] [SERVER] Using database on port ${process.env.PGPORT}`);
    });

    // Add proper error handling
    serverInstance.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`[${new Date().toISOString()}] [SERVER] Port ${internalPort} is already in use`);
        process.exit(1);
      } else {
        console.error(`[${new Date().toISOString()}] [SERVER] Server error:`, error);
        process.exit(1);
      }
    });

    // Handle graceful shutdown
    const shutdown = () => {
      console.log('Received kill signal, shutting down gracefully');
      serverInstance.close(() => {
        console.log('Closed out remaining connections');
        process.exit(0);
      });

      setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    console.error(`[${new Date().toISOString()}] [SERVER] Failed to start server:`, error);
    process.exit(1);
  }
};

startServer();
