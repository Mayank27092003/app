import fs from "fs";
import path from "path";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { FileUploadAdapter, UploadResult } from "./adapter.interface";

function getEnv(name: string, optional = false): string | undefined {
  const value = process.env[name];
  if (!value && !optional) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

export function getEnvForS3(name: string): string | undefined {
  const provider = (process.env.UPLOAD_PROVIDER || "local").toLowerCase();
  // Only strict when provider = s3
  return getEnv(name, provider !== "s3");
}


export class S3UploadAdapter implements FileUploadAdapter {
  private s3: S3Client;
  private bucket: string;
  private publicBaseUrl?: string;

  constructor() {
    const region = getEnvForS3("AWS_S3_REGION")!;
    const accessKeyId = getEnvForS3("AWS_S3_ACCESS_KEY_ID")!;
    const secretAccessKey = getEnvForS3("AWS_S3_SECRET_ACCESS_KEY")!;
    this.bucket = getEnvForS3("AWS_S3_BUCKET")!;
    this.publicBaseUrl = process.env.AWS_S3_PUBLIC_BASE_URL;


    this.s3 = new S3Client({
      region,
      credentials: { accessKeyId, secretAccessKey },
    });
  }

  async upload(filePath: string, filename: string, mimetype: string): Promise<UploadResult> {
    const key = `${Date.now()}-${path.basename(filename).replace(/\s+/g, "_")}`;
    const fileStream = fs.createReadStream(filePath);
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: fileStream,
        ContentType: mimetype,
        ACL: "public-read",
      })
    );

    const url = this.publicBaseUrl
      ? `${this.publicBaseUrl.replace(/\/$/, "")}/${key}`
      : `https://${this.bucket}.s3.${process.env.AWS_S3_REGION}.amazonaws.com/${key}`;

    return { url, key, size: fs.statSync(filePath).size, mimetype };
  }

  async delete(key: string): Promise<void> {
    await this.s3.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key })
    );
  }
}

export default new S3UploadAdapter();


