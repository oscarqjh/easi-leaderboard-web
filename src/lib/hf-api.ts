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
 * Upload a submission (JSON + ZIP) to a HuggingFace dataset repo in a single commit.
 * The JSON is uploaded as UTF-8, the ZIP as base64.
 */
export async function uploadSubmissionToRepo(
  repoId: string,
  token: string,
  folderPath: string,
  jsonContent: string,
  zipBuffer: Buffer,
  commitMessage: string
): Promise<{ success: boolean; error?: string }> {
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
    key: "file",
    value: {
      path: `${folderPath}/results.zip`,
      content: zipBuffer.toString("base64"),
      encoding: "base64",
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
