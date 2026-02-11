export class HttpException extends Error {
  status: number;
  originalError?: Error;

  constructor(error: string | Error, status = 500) {
    const message = typeof error === "string" ? error : error.message;
    super(message);

    this.status = status;
    this.name = "HttpException";

    if (error instanceof Error) {
      this.originalError = error;
      // You can also optionally append stack trace from original error
      this.stack = error.stack;
    }

    Error.captureStackTrace(this, this.constructor);
  }
}
