import { FileUploadAdapter, UploadResult } from "./adapter.interface";
import localAdapter from "./local.adapter";
import s3Adapter from "./s3.adapter";

class UploadService implements FileUploadAdapter {
  private adapter: FileUploadAdapter;

  constructor() {
    const provider = (process.env.UPLOAD_PROVIDER || "s3").toLowerCase();
    this.adapter = provider === "s3" ? s3Adapter : localAdapter;
  }

  setAdapter(adapter: FileUploadAdapter) {
    this.adapter = adapter;
  }

  upload(
    filePath: string,
    filename: string,
    mimetype: string
  ): Promise<UploadResult> {
    return this.adapter.upload(filePath, filename || "", mimetype);
  }

  delete(key: string): Promise<void> {
    return this.adapter.delete ? this.adapter.delete(key) : Promise.resolve();
  }
}

export default new UploadService();
