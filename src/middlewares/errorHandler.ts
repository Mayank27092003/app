import { Request, Response, NextFunction } from "express";
import { Logger } from "../utils/logger";

const isDev = process.env.NODE_ENV === "development";

// Smart classification: 401, 403, 5xx = error, rest 4xx = warning
const shouldLogAsError = (status: number) => {
  return (
    status >= 500 || status === 401 || status === 403 // critical client errors
  );
};

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const status = err.status || 500;
  const logMessage = `[${req.method}] ${req.originalUrl} - ${err.message} (${status})`;

  if (shouldLogAsError(status)) {
    Logger.error(`${logMessage}\n${err.stack}`);
  } else {
    Logger.warn(logMessage);
  }

  res.status(status).json({
    success: false,
    message: err.message || "Something went wrong",
    error: {
      name: err.name || "Error",
      stack: isDev ? err.stack : undefined,
    },
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
  });
};
