import app from './app.js';
import { constants } from '../config/constants.js';
import { initializeDatabase } from '../config/initDb.js';
import { DatabaseManager } from '../config/database.js';

const startServer = async () => {
  try {
    console.log('Starting server initialization...');
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Using port: ${constants.PORT}`);
    
    // Test database connection first
    try {
      console.log('Testing database connection...');
      await DatabaseManager.query('SELECT NOW()');
      console.log('Database connection successful');
    } catch (dbError: any) {
      console.error('Database connection failed:', dbError.message);
      if (dbError.stack) console.error('Stack:', dbError.stack);
      process.exit(1);
    }
    
    // Initialize database with better error handling
    try {
      console.log('Initializing database...');
      await initializeDatabase();
      console.log('Database initialization completed successfully');
    } catch (dbError: any) {
      console.error('Database initialization failed:', dbError.message);
      if (dbError.stack) console.error('Stack:', dbError.stack);
      process.exit(1);
    }
    
    // Start the server with explicit error handling
    const server = app.listen(constants.PORT, '0.0.0.0', () => {
      console.log(`🚀 Server is running at http://0.0.0.0:${constants.PORT}`);
      console.log('Available routes:');
      console.log('- POST /api/auth/login');
      console.log('- POST /api/loyalty/rewards');
      console.log('- GET /api/nft/status');
      console.log('- POST /api/nft/merkle-tree');
    });

    // Enhanced error handling for server startup
    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${constants.PORT} is already in use`);
        process.exit(1);
      } else if (error.code === 'EACCES') {
        console.error(`Port ${constants.PORT} requires elevated privileges`);
        process.exit(1);
      } else {
        console.error('Server error:', error.message);
        if (error.stack) console.error('Stack:', error.stack);
        process.exit(1);
      }
    });

  } catch (error: any) {
    console.error('Failed to start server:', error.message);
    if (error.stack) console.error('Stack:', error.stack);
    process.exit(1);
  }
};

// Enhanced error handling for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error.message);
  if (error.stack) console.error('Stack:', error.stack);
  process.exit(1);
});

// Enhanced error handling for unhandled rejections
process.on('unhandledRejection', (reason: any) => {
  console.error('Unhandled Rejection:', reason?.message || reason);
  if (reason?.stack) console.error('Stack:', reason.stack);
  process.exit(1);
});

startServer();
