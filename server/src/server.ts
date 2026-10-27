import app from './app.js';
import { connectDB, disconnectDB } from './config/db.js';
import { env } from './config/env.js';
import { User } from './models/User.js';
import { seedDatabase } from './utils/seed.js';

const startServer = async () => {
  try {
    // 1. Connect Database
    await connectDB();

    // 2. Auto-seed demo accounts if database is empty
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('⚡ No users found in database. Initializing default admin and teacher accounts...');
      await seedDatabase({ purge: false, closeConnection: false });
    }

    // 3. Start HTTP Server
    const server = app.listen(env.PORT, () => {
      console.log(`
=====================================================
🚀 ClassSathi Backend Server Running
📡 URL: http://localhost:${env.PORT}
🌍 Environment: ${env.NODE_ENV}
⏰ Timezone: ${env.SCHOOL_TIMEZONE}
=====================================================
      `);
    });

    // 3. Graceful Shutdown Handlers
    const shutdown = async (signal: string) => {
      console.log(`\nReceived ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        await disconnectDB();
        console.log('HTTP server and DB connections terminated.');
        process.exit(0);
      });

      // Force close after 10s if graceful shutdown hangs
      setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('Fatal Server Startup Error:', error);
    process.exit(1);
  }
};

startServer();
