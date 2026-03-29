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

  const res = await fetch(`${HF_API_BASE}/models/${modelName}`, { headers });
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
 * Check if a specific file already exists in the HF dataset repo.
 */
export async function fileExistsInRepo(
  repoId: string,
  token: string,
  filePath: string
): Promise<boolean> {
  const res = await fetch(
    `${HF_API_BASE}/datasets/${repoId}/resolve/main/${filePath}`,
    {
      method: "HEAD",
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return res.ok;
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
 * Upload a JSON file to a HuggingFace dataset repo via the commit API (NDJSON format).
 */
export async function uploadJsonToRepo(
  repoId: string,
  token: string,
  filePath: string,
  content: string,
  commitMessage: string
): Promise<{ success: boolean; error?: string }> {
  const url = `${HF_API_BASE}/datasets/${repoId}/commit/main`;

  const headerLine = JSON.stringify({
    key: "header",
    value: { summary: commitMessage },
  });
  const fileLine = JSON.stringify({
    key: "file",
    value: { path: filePath, content, encoding: "utf-8" },
  });
  const body = `${headerLine}\n${fileLine}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/x-ndjson",
    },
    body,
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "Unknown error");
    return { success: false, error: `Upload to HuggingFace failed (${res.status}): ${errText.slice(0, 300)}` };
  }

  return { success: true };
}

/**
 * Compute SHA256 hex digest of a buffer.
 */
function sha256Hex(buffer: Buffer): string {
  const crypto = require("crypto");
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

/**
 * Pre-upload a binary file to HuggingFace LFS storage.
 * Returns the OID (SHA256 hash) on success.
 *
 * Steps:
 *   1. POST to /api/datasets/{repo}/preupload/main to get upload URL
 *   2. PUT the file content to the upload URL
 */
async function preUploadLfs(
  repoId: string,
  token: string,
  path: string,
  buffer: Buffer,
): Promise<{ success: boolean; oid: string; error?: string }> {
  const oid = sha256Hex(buffer);
  const size = buffer.length;

  // Step 1: Request pre-upload
  const preUploadUrl = `${HF_API_BASE}/datasets/${repoId}/preupload/main`;
  const preUploadRes = await fetch(preUploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      files: [{ path, sample: oid, size }],
    }),
  });

  if (!preUploadRes.ok) {
    const errText = await preUploadRes.text().catch(() => "Unknown error");
    return {
      success: false,
      oid,
      error: `LFS pre-upload failed (${preUploadRes.status}): ${errText.slice(0, 300)}`,
    };
  }

  const preUploadData = await preUploadRes.json() as {
    files: Array<{
      path: string;
      uploadUrl: string;
    }>;
  };

  const fileEntry = preUploadData.files?.[0];
  if (!fileEntry?.uploadUrl) {
    // No upload URL means the file already exists in LFS storage
    return { success: true, oid };
  }

  // Step 2: Upload the file content to the provided URL
  const uploadRes = await fetch(fileEntry.uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": "application/octet-stream",
    },
    body: buffer,
  });

  if (!uploadRes.ok) {
    const errText = await uploadRes.text().catch(() => "Unknown error");
    return {
      success: false,
      oid,
      error: `LFS upload failed (${uploadRes.status}): ${errText.slice(0, 300)}`,
    };
  }

  return { success: true, oid };
}

/**
 * Upload a submission (JSON + ZIP) to a HuggingFace dataset repo in a single commit.
 * The JSON is uploaded inline as UTF-8.
 * The ZIP is pre-uploaded to LFS, then referenced via lfsFile in the commit.
 */
export async function uploadSubmissionToRepo(
  repoId: string,
  token: string,
  folderPath: string,
  jsonContent: string,
  zipBuffer: Buffer,
  commitMessage: string
): Promise<{ success: boolean; error?: string }> {
  // Step 1: Pre-upload the zip to LFS storage
  const zipPath = `${folderPath}/results.zip`;
  const lfsResult = await preUploadLfs(repoId, token, zipPath, zipBuffer);
  if (!lfsResult.success) {
    return { success: false, error: lfsResult.error };
  }

  // Step 2: Create the commit with JSON inline + ZIP as lfsFile reference
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
      oid: lfsResult.oid,
      size: zipBuffer.length,
    },
  });
  const body = `${headerLine}\n${jsonFileLine}\n${zipFileLine}`;

  const res = await fetch(url, {
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
