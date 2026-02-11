import { Request, Response, NextFunction } from "express";

// Ensures either a multipart `file` is present or a JSON body `url` is provided
export function requireUploadInput(req: Request, res: Response, next: NextFunction) {
  const hasFile = Boolean((req as any).files?.file);
  const hasUrl = typeof req.body?.url === "string" && req.body.url.length > 0;

  if (!hasFile && !hasUrl) {
    return res.status(400).json({ error: "Provide multipart 'file' or JSON body { url }" });
  }

  next();
}


