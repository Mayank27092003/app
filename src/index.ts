import "dotenv/config";
import "./database/db";
import { createServer } from "./server";
import { Logger } from "./utils/logger";
import http from "http";
import { initializeSocket } from "./services/socket/instance";
import { firebaseService } from "./services/notification/firebase.service";
import { dbReady } from "./database/db";

const PORT = process.env.PORT || 3000;

let isShuttingDown = false;

async function gracefulShutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  Logger.info(`${signal} received. Shutting down gracefully...`);

  httpServer.close(() => {
    Logger.info('Server closed');
    process.exit(0);
  });

  setTimeout(() => {
    Logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

process.on("unhandledRejection", (reason: any) => {
  Logger.error(`Unhandled Rejection: ${reason?.message || reason}`);
  Logger.error(reason?.stack || '');
  // Don't exit - just log
});

process.on("uncaughtException", (err: Error) => {
  Logger.error(`Uncaught Exception: ${err.message}`);
  Logger.error(err.stack || '');
  // Only exit on fatal errors
  if (err.message.includes('EADDRINUSE')) {
    gracefulShutdown('UNCAUGHT_EXCEPTION');
  }
});

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

async function startServer() {
  // Start DB connection in background but don't block server start
  dbReady.catch(err => {
    Logger.error(`Initial database connection failed: ${err.message}`);
  });

  const app = createServer();
  const httpServer = http.createServer(app);

  firebaseService.initialize();
  initializeSocket(httpServer);

  httpServer.listen(PORT, () => {
    Logger.info(`Worker ${process.pid} - Server running on port ${PORT}`);
  });

  return httpServer;
}

const httpServer = http.createServer(); // Placeholder
startServer().catch(err => {
  Logger.error(`Failed to start: ${err}`);
  process.exit(1);
});
