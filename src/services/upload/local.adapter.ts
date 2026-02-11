import fs from "fs";
import path from "path";
import { FileUploadAdapter, UploadResult } from "./adapter.interface";

export class LocalUploadAdapter implements FileUploadAdapter {
  constructor(private publicDir: string = path.resolve(process.cwd(), "public/uploads")) {
    if (!fs.existsSync(this.publicDir)) {
      fs.mkdirSync(this.publicDir, { recursive: true });
    }
  }

  async upload(filePath: string, filename: string, mimetype: string): Promise<UploadResult> {
    const safeName = `${Date.now()}-${filename.replace(/\s+/g, "_")}`;
    const destPath = path.join(this.publicDir, safeName);
    await fs.promises.copyFile(filePath, destPath);
    const stat = await fs.promises.stat(destPath);
    const publicUrl = `/public/uploads/${safeName}`;
    return { url: publicUrl, key: safeName, size: stat.size, mimetype };
  }
}

export default new LocalUploadAdapter();


