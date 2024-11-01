import { server } from './app.js';
import { initializeDatabase } from '../config/initDb.js';
import { DatabaseManager } from '../config/database.js';

const startServer = async () => {
  try {
    console.log('Starting server initialization...');
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    
    // Get port from environment with fallback
    const port = parseInt(process.env.PORT || '5000', 10);
    console.log(`Using port: ${port}`);
    
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
    
    // Start the server with explicit error handling and proper binding
    server.listen(port, '0.0.0.0', () => {
      console.log(`🚀 Server is running at http://0.0.0.0:${port}`);
      console.log(`Replit environment: ${process.env.REPL_SLUG ? 'Yes' : 'No'}`);
      if (process.env.REPL_SLUG && process.env.REPL_OWNER) {
        console.log(`Replit URL: https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`);
      }
    });

    // Enhanced error handling for server
    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use`);
        process.exit(1);
      } else if (error.code === 'EACCES') {
        console.error(`Port ${port} requires elevated privileges`);
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
