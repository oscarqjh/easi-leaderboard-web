import { createHash } from "crypto";
import { fetchWithRetry } from "./fetch-utils";

const HF_API_BASE = "https://huggingface.co/api";

interface HfModelInfo {
  id: string;
  pipeline_tag?: string;
  tags?: string[];
  cardData?: {
    license?: string;
    base_model?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * Check if a model exists on HuggingFace Hub.
 * Returns model info if found, null if not.
 */
export async function getModelInfo(
  modelName: string,
  token?: string
): Promise<HfModelInfo | null> {
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetchWithRetry(`${HF_API_BASE}/models/${modelName}`, { headers });
  if (!res.ok) return null;
  return (await res.json()) as HfModelInfo;
}

/**
 * Check if a model has a license in its model card.
 */
export function hasLicense(modelInfo: HfModelInfo): boolean {
  return !!(modelInfo.cardData?.license);
}

/**
 * Build the submission filename with datetime to avoid overwrites:
 * "{username}/{model_path}_{precision}_{weightType}_{timestamp}.json"
 */
export function buildSubmissionPath(
  userName: string,
  modelName: string,
  precision: string,
  weightType: string
): string {
  const modelPath = modelName.includes("/")
    ? modelName.split("/")[1]
    : modelName;
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").replace("Z", "");
  return `${userName}/${modelPath}_${precision}_${weightType}_${timestamp}`;
}

/**
 * Upload a submission (JSON + ZIP) to a HuggingFace dataset repo in a single commit.
 * The JSON is uploaded inline. The ZIP is uploaded via LFS (pre-upload + PUT + lfsFile commit).
 */
export async function uploadSubmissionToRepo(
  repoId: string,
  token: string,
  folderPath: string,
  jsonContent: string,
  zipBuffer: Buffer,
  commitMessage: string
): Promise<{ success: boolean; error?: string }> {
  const oid = createHash("sha256").update(zipBuffer).digest("hex");
  const size = zipBuffer.length;
  const zipPath = `${folderPath}/results.zip`;

  // Step 1: Use Git LFS batch API to get the upload URL
  const lfsBatchUrl = `https://huggingface.co/datasets/${repoId}.git/info/lfs/objects/batch`;
  const lfsBatchRes = await fetchWithRetry(lfsBatchUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/vnd.git-lfs+json",
    },
    body: JSON.stringify({
      operation: "upload",
      transfers: ["basic", "multipart"],
      objects: [{ oid, size }],
    }),
  });

  if (!lfsBatchRes.ok) {
    const errText = await lfsBatchRes.text().catch(() => "Unknown error");
    return {
      success: false,
      error: `LFS batch failed (${lfsBatchRes.status}): ${errText.slice(0, 300)}`,
    };
  }

  const lfsBatchData = await lfsBatchRes.json() as {
    objects: Array<{
      oid: string;
      size: number;
      actions?: {
        upload?: { href: string; header?: Record<string, string> };
        verify?: { href: string; header?: Record<string, string> };
      };
    }>;
  };

  const lfsObj = lfsBatchData.objects?.[0];
  const uploadAction = lfsObj?.actions?.upload;
  const verifyAction = lfsObj?.actions?.verify;

  // Step 2: Upload the file if an upload action is provided
  if (uploadAction) {
    const putRes = await fetchWithRetry(uploadAction.href, {
      method: "PUT",
      headers: {
        ...uploadAction.header,
        "Content-Type": "application/octet-stream",
      },
      body: new Uint8Array(zipBuffer),
    });

    if (!putRes.ok) {
      const errText = await putRes.text().catch(() => "Unknown error");
      return {
        success: false,
        error: `LFS upload failed (${putRes.status}): ${errText.slice(0, 300)}`,
      };
    }

    // Step 2b: Verify if requested
    if (verifyAction) {
      const verifyRes = await fetchWithRetry(verifyAction.href, {
        method: "POST",
        headers: {
          ...verifyAction.header,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ oid, size }),
      });
      if (!verifyRes.ok) {
        const errText = await verifyRes.text().catch(() => "Unknown error");
        return {
          success: false,
          error: `LFS verify failed (${verifyRes.status}): ${errText.slice(0, 300)}`,
        };
      }
    }
  }

  // Step 3: Commit with JSON inline + ZIP as lfsFile reference
  const url = `${HF_API_BASE}/datasets/${repoId}/commit/main`;

  const headerLine = JSON.stringify({
    key: "header",
    value: { summary: commitMessage },
  });
  const jsonFileLine = JSON.stringify({
    key: "file",
    value: {
      path: `${folderPath}/results.json`,
      content: jsonContent,
      encoding: "utf-8",
    },
  });
  const zipFileLine = JSON.stringify({
    key: "lfsFile",
    value: {
      path: zipPath,
      algo: "sha256",
      oid,
      size,
    },
  });
  const body = `${headerLine}\n${jsonFileLine}\n${zipFileLine}`;

  const res = await fetchWithRetry(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/x-ndjson",
    },
    body,
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "Unknown error");
    return {
      success: false,
      error: `Upload to HuggingFace failed (${res.status}): ${errText.slice(0, 300)}`,
    };
  }

  return { success: true };
}
