import { createHash } from "node:crypto";
import net from "node:net";
import { fileTypeFromBuffer } from "file-type";
import { env } from "../config.js";
import { withWorker } from "../db/pools.js";
import { deleteDocumentObject, getDocumentObject } from "../services/storage.js";

async function scanWithClamAv(bytes: Uint8Array): Promise<"clean" | "infected"> {
  if (!env.CLAMAV_HOST) {
    if (env.NODE_ENV === "production") throw new Error("ClamAV is required in production");
    return "clean";
  }
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host: env.CLAMAV_HOST, port: env.CLAMAV_PORT });
    let response = "";
    socket.setTimeout(30_000);
    socket.on("connect", () => {
      socket.write("zINSTREAM\0");
      for (let offset = 0; offset < bytes.length; offset += 64 * 1024) {
        const chunk = Buffer.from(bytes.subarray(offset, Math.min(offset + 64 * 1024, bytes.length)));
        const length = Buffer.alloc(4);
        length.writeUInt32BE(chunk.length);
        socket.write(length);
        socket.write(chunk);
      }
      socket.end(Buffer.alloc(4));
    });
    socket.on("data", (chunk) => { response += chunk.toString("utf8"); });
    socket.on("timeout", () => socket.destroy(new Error("ClamAV scan timed out")));
    socket.on("error", reject);
    socket.on("close", () => {
      if (response.includes("FOUND")) resolve("infected");
      else if (response.includes("OK")) resolve("clean");
      else reject(new Error(`Unexpected ClamAV response: ${response}`));
    });
  });
}

export async function clamAvReady(): Promise<boolean> {
  if (!env.CLAMAV_HOST) return env.NODE_ENV !== "production";
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: env.CLAMAV_HOST, port: env.CLAMAV_PORT });
    let response = "";
    socket.setTimeout(3_000);
    socket.on("connect", () => socket.end("zPING\0"));
    socket.on("data", (chunk) => { response += chunk.toString("utf8"); });
    socket.on("error", () => resolve(false));
    socket.on("timeout", () => { socket.destroy(); resolve(false); });
    socket.on("close", () => resolve(response.includes("PONG")));
  });
}

export async function matchesDeclaredFileType(bytes: Uint8Array, declaredMime: string): Promise<boolean> {
  if (declaredMime === "text/csv") {
    const text = Buffer.from(bytes).toString("utf8");
    return !text.includes("\0") && !text.includes("\uFFFD");
  }
  const detected = await fileTypeFromBuffer(bytes);
  if (!detected) return false;
  if (declaredMime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    return detected.mime === declaredMime || detected.ext === "docx";
  }
  return detected.mime === declaredMime;
}

export async function scanDocument(documentId: string): Promise<void> {
  const document = await withWorker(documentId, async (client) => {
    const result = await client.query<{ object_key: string; mime_type: string }>("select object_key, mime_type from app.health_documents where id=$1", [documentId]);
    return result.rows[0];
  });
  if (!document) return;
  const object = await getDocumentObject(document.object_key);
  if (!object.Body) throw new Error("Document body is missing");
  const bytes = await object.Body.transformToByteArray();
  const checksum = createHash("sha256").update(bytes).digest("hex");
  if (!await matchesDeclaredFileType(bytes, document.mime_type)) {
    await withWorker(documentId, async (client) => {
      await client.query("update app.health_documents set checksum_sha256=$2,scan_status='failed' where id=$1", [documentId, checksum]);
    });
    await deleteDocumentObject(document.object_key);
    return;
  }
  let status: "clean" | "infected";
  try {
    status = await scanWithClamAv(bytes);
  } catch (error) {
    await withWorker(documentId, async (client) => {
      await client.query("update app.health_documents set checksum_sha256=$2,scan_status='failed' where id=$1", [documentId, checksum]);
    });
    throw error;
  }
  await withWorker(documentId, async (client) => {
    await client.query("update app.health_documents set checksum_sha256=$2,scan_status=$3 where id=$1", [documentId, checksum, status]);
  });
  if (status === "infected") await deleteDocumentObject(document.object_key);
}
