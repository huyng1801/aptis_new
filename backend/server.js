require('dotenv').config();
const app = require('./src/app');
const { sequelize, testConnection } = require('./src/config/database');
const { scheduleCleanupJobs } = require('./src/jobs/cleanupQueue');
const SpeechToTextService = require('./src/services/SpeechToTextService');

const PORT = process.env.PORT || 3000;

// Start server
async function startServer() {
  try {
    // Test database connection
    await testConnection();
    
    // Sync database (use carefully in production)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: false });
    }
    
    // Schedule cleanup jobs
    scheduleCleanupJobs();
    
    // Start Express server
    const server = app.listen(PORT, () => {
      // Server started successfully
    });

    
    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      
      server.close(async () => {
        try {
          await sequelize.close();
          process.exit(0);
        } catch (error) {
          process.exit(1);
        }
      });
      
      // Force shutdown after 10 seconds
      setTimeout(() => {
        process.exit(1);
      }, 10000);
    };
    
    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });
    
    process.on('unhandledRejection', (reason, promise) => {
    });
    
  } catch (error) {
    process.exit(1);
  }
}

// Start the server
startServer();
