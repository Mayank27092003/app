export interface UploadResult {
  url: string;
  key: string;
  size: number;
  mimetype: string;
}

export interface FileUploadAdapter {
  upload(filePath: string, filename: string, mimetype: string): Promise<UploadResult>;
  delete?(key: string): Promise<void>;
}


