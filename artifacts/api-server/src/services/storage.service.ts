import fs from "fs";
import path from "path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { env } from "../config/env";
import { logger } from "../config/logger";

export interface UploadResult {
  url: string;
  key: string;
  name: string;
  size: number;
}

export class StorageService {
  private static s3Client: S3Client | null = null;

  private static getS3Client(): S3Client {
    if (this.s3Client) {
      return this.s3Client;
    }

    const config: any = {
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY_ID || "",
        secretAccessKey: env.S3_SECRET_ACCESS_KEY || "",
      },
      region: env.S3_REGION || "us-east-1",
    };

    if (env.S3_ENDPOINT) {
      config.endpoint = env.S3_ENDPOINT;
      config.forcePathStyle = env.S3_FORCE_PATH_STYLE;
    }

    this.s3Client = new S3Client(config);
    logger.info("S3 storage client initialized successfully");
    return this.s3Client;
  }

  /**
   * Uploads a file buffer/stream to the active storage provider
   */
  static async uploadFile(file: Express.Multer.File): Promise<UploadResult> {
    const fileExt = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}${fileExt}`;

    if (env.STORAGE_PROVIDER === "s3") {
      return this.uploadToS3(file, uniqueName);
    } else {
      return this.uploadLocal(file, uniqueName);
    }
  }

  /**
   * Helper to write files locally to directory
   */
  private static async uploadLocal(file: Express.Multer.File, uniqueName: string): Promise<UploadResult> {
    const uploadsDir = path.join(process.cwd(), "uploads");

    // Ensure uploads directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, uniqueName);
    await fs.promises.writeFile(filePath, file.buffer);

    const appUrl = env.APP_URL || "http://localhost:5000";
    const fileUrl = `${appUrl.replace(/\/$/, "")}/uploads/${uniqueName}`;

    logger.info({ uniqueName, filePath }, "File saved locally");

    return {
      url: fileUrl,
      key: uniqueName,
      name: file.originalname,
      size: file.size,
    };
  }

  /**
   * Helper to stream files to S3
   */
  private static async uploadToS3(file: Express.Multer.File, uniqueName: string): Promise<UploadResult> {
    const client = this.getS3Client();
    const bucketName = env.S3_BUCKET_NAME || "talentlab-rms-bucket";

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: uniqueName,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await client.send(command);

    let fileUrl = "";
    if (env.S3_ENDPOINT) {
      // Custom endpoint like MinIO or digitalocean spaces
      const formattedEndpoint = env.S3_ENDPOINT.replace(/\/$/, "");
      if (env.S3_FORCE_PATH_STYLE) {
        fileUrl = `${formattedEndpoint}/${bucketName}/${uniqueName}`;
      } else {
        // subdomain style
        const protocol = formattedEndpoint.startsWith("https://") ? "https://" : "http://";
        const domain = formattedEndpoint.replace(/^https?:\/\//, "");
        fileUrl = `${protocol}${bucketName}.${domain}/${uniqueName}`;
      }
    } else {
      // Standard AWS S3 URL
      fileUrl = `https://${bucketName}.s3.${env.S3_REGION || "us-east-1"}.amazonaws.com/${uniqueName}`;
    }

    logger.info({ uniqueName, bucketName, fileUrl }, "File uploaded to S3 successfully");

    return {
      url: fileUrl,
      key: uniqueName,
      name: file.originalname,
      size: file.size,
    };
  }
}
