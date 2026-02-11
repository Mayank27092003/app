declare namespace Express {
  export interface Response {
    t: (
      key: string,
      vars?: Record<string, any>,
      namespace?: string,
      fallback?: string
    ) => Promise<string>;
  }
  export interface Request {
    file?: Express.Multer.File;
    files?: any;
  }
}
