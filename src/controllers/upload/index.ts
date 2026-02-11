import { Request, Response } from "express";
import fs from "fs";
import os from "os";
import path from "path";
import uploadService from "../../services/upload";

export class UploadController {
  async upload(req: Request, res: Response) {
    const efuFile = (req.files as any)?.file as
      | { name: string; mimetype: string; tempFilePath?: string; mv?: (dest: string) => Promise<void> | void }
      | undefined;
    try {
      if (efuFile) {
        // express-fileupload provides either tempFilePath (when useTempFiles:true) or an mv() method
        let tempPathToUse = efuFile.tempFilePath;
        if (!tempPathToUse && efuFile.mv) {
          const dest = path.join(os.tmpdir(), `${Date.now()}-${efuFile.name}`);
          await Promise.resolve(efuFile.mv(dest));
          tempPathToUse = dest;
        }
        if (!tempPathToUse) {
          res.status(400).json({ error: "Unable to read uploaded file" });
          return;
        }
        const result = await uploadService.upload(tempPathToUse, efuFile.name, efuFile.mimetype);
        res.json({ url: result.url, key: result.key, size: result.size, mimetype: result.mimetype });
        return;
      }

      const { url } = req?.body as { url?: string };
      if (!url) {
        res.status(400).json({ error: "No file provided. Send multipart 'file' or JSON { url }" });
        return;
      }

      // Download the file to a temp path, then upload via service
      const response = await fetch(url);
      if (!response.ok || !response.body) {
        res.status(400).json({ error: "Failed to fetch remote file" });
        return;
      }
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const guessedName = url.split("/").pop() || "remote-file";
      const tmpPath = path.join(os.tmpdir(), `${Date.now()}-${guessedName}`);
      await fs.promises.writeFile(tmpPath, buffer);
      const mimetype = response.headers.get("content-type") || "application/octet-stream";

      const result = await uploadService.upload(tmpPath, guessedName, mimetype);
      res.json({ url: result.url, key: result.key, size: result.size, mimetype: result.mimetype });
    } catch (err: any) {
      res.status(500).json({ error: "Upload failed", details: err?.message });
    }
  }
}

export default new UploadController();
