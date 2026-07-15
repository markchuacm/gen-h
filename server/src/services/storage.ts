import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "../config.js";

export const s3 = new S3Client({
  endpoint: env.S3_ENDPOINT,
  region: env.S3_REGION,
  forcePathStyle: env.S3_FORCE_PATH_STYLE,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
  },
});

export async function ensureDevelopmentBuckets(): Promise<void> {
  if (env.NODE_ENV === "production") return;
  for (const bucket of [env.S3_DOCUMENTS_BUCKET, env.S3_BACKUPS_BUCKET]) {
    try {
      await s3.send(new HeadBucketCommand({ Bucket: bucket }));
    } catch {
      await s3.send(new CreateBucketCommand({ Bucket: bucket }));
    }
  }
}

export async function putDocumentObject(objectKey: string, contentType: string, bytes: Buffer): Promise<void> {
  await s3.send(new PutObjectCommand({
    Bucket: env.S3_DOCUMENTS_BUCKET,
    Key: objectKey,
    Body: bytes,
    ContentType: contentType,
    ContentLength: bytes.length,
  }));
}

export function signDocumentDownload(objectKey: string, fileName: string): Promise<string> {
  const safeName = fileName.replace(/[\r\n"\\]/g, "_");
  return getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: env.S3_DOCUMENTS_BUCKET,
      Key: objectKey,
      ResponseContentDisposition: `attachment; filename="${safeName}"`,
    }),
    { expiresIn: 5 * 60 },
  );
}

export async function deleteDocumentObject(objectKey: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: env.S3_DOCUMENTS_BUCKET, Key: objectKey }));
}

export function getDocumentObject(objectKey: string) {
  return s3.send(new GetObjectCommand({ Bucket: env.S3_DOCUMENTS_BUCKET, Key: objectKey }));
}

export async function storageReady(): Promise<boolean> {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: env.S3_DOCUMENTS_BUCKET }));
    return true;
  } catch {
    return false;
  }
}
