import { buildApp } from './app.js';

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

async function start() {
  try {
    const app = await buildApp();

    await app.listen({ port: PORT, host: HOST });

    console.log(`
🚀 CPQ Service is running!

📍 Server: http://${HOST}:${PORT}
📚 API Documentation: http://${HOST}:${PORT}/documentation
💚 Health Check: http://${HOST}:${PORT}/api/health

Environment: ${process.env.NODE_ENV || 'development'}
    `);
  } catch (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

start();
