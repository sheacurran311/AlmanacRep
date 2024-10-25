import app from './app';
import { constants } from './config/constants';
import { initializeDatabase } from './config/initDb';

const startServer = async () => {
  try {
    // Initialize database with better error handling
    console.log('Starting server initialization...');
    console.log(`Using port: ${constants.PORT}`);
    
    try {
      console.log('Initializing database...');
      await initializeDatabase();
      console.log('Database initialization completed successfully');
    } catch (dbError) {
      console.error('Database initialization failed:', dbError);
      process.exit(1);
    }
    
    // Start the server with explicit host and port
    const server = app.listen(constants.PORT, '0.0.0.0', () => {
      console.log(`🚀 Server is running at http://0.0.0.0:${constants.PORT}`);
      console.log('Available routes:');
      console.log('- POST /api/auth/login');
      console.log('- POST /api/loyalty/rewards');
      console.log('- GET /api/nft/status');
    });

    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${constants.PORT} is already in use`);
      } else {
        console.error('Server error:', error);
      }
      process.exit(1);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

startServer();
