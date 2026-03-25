import AdmZip from "adm-zip";

const MAX_ZIP_SIZE = 50 * 1024 * 1024; // 50 MB
const MAX_DECOMPRESSED_SIZE = 500 * 1024 * 1024; // 500 MB

const ALLOWED_EXTENSIONS = new Set([
  // Data
  ".json", ".jsonl", ".csv", ".tsv", ".txt", ".log",
  ".parquet", ".arrow", ".npy", ".pkl",
  // Config/docs
  ".yaml", ".yml", ".xml", ".md", ".html", ".pdf",
  // Code
  ".py", ".sh",
  // Media
  ".png", ".jpg", ".jpeg", ".gif", ".svg",
]);

const ZIP_MAGIC_BYTES = [0x50, 0x4b, 0x03, 0x04]; // PK\x03\x04

interface ZipValidationResult {
  valid: boolean;
  error?: string;
}

export function validateZipBuffer(buffer: Buffer): ZipValidationResult {
  // 1. Magic bytes check
  if (buffer.length < 4) {
    return { valid: false, error: "File is not a valid ZIP archive." };
  }
  for (let i = 0; i < 4; i++) {
    if (buffer[i] !== ZIP_MAGIC_BYTES[i]) {
      return { valid: false, error: "File is not a valid ZIP archive." };
    }
  }

  // 2. File size check
  if (buffer.length > MAX_ZIP_SIZE) {
    return { valid: false, error: "ZIP file exceeds 50 MB limit." };
  }

  // 3. Parse zip to inspect entries
  let zip: AdmZip;
  try {
    zip = new AdmZip(buffer);
  } catch {
    return { valid: false, error: "File is not a valid ZIP archive." };
  }

  const entries = zip.getEntries();
  let totalDecompressed = 0;
  const disallowed: string[] = [];

  for (const entry of entries) {
    // Skip directories
    if (entry.isDirectory) continue;

    // 4. Path traversal check
    if (entry.entryName.includes("..")) {
      return { valid: false, error: "ZIP contains invalid file paths." };
    }

    // 5. Decompressed size accumulation
    totalDecompressed += entry.header.size;

    // 6. Extension whitelist check
    const name = entry.entryName.toLowerCase();
    const dotIndex = name.lastIndexOf(".");
    const ext = dotIndex >= 0 ? name.slice(dotIndex) : "";
    if (!ext || !ALLOWED_EXTENSIONS.has(ext)) {
      disallowed.push(ext || "(no extension)");
    }
  }

  if (totalDecompressed > MAX_DECOMPRESSED_SIZE) {
    return { valid: false, error: "ZIP decompressed size exceeds 500 MB limit." };
  }

  if (disallowed.length > 0) {
    const unique = [...new Set(disallowed)].sort().join(", ");
    return { valid: false, error: `ZIP contains disallowed file types: ${unique}` };
  }

  return { valid: true };
}
