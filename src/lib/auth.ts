import { fetchWithRetry } from "./fetch-utils";

export interface HfUserInfo {
  sub: string;
  preferred_username?: string;
  name?: string;
}

/**
 * Verify a HuggingFace token and return user info.
 * Tries /oauth/userinfo first (for OAuth tokens from browser flow),
 * then falls back to /api/whoami (for regular HF API tokens from scripts).
 * Retries up to 5 times per endpoint to handle transient network issues.
 */
export async function verifyUser(authHeader: string | null): Promise<HfUserInfo | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const accessToken = authHeader.slice(7);
  if (!accessToken) return null;

  const headers = { Authorization: `Bearer ${accessToken}` };

  // Try OAuth userinfo first (works with hf_oauth_* tokens)
  try {
    const res = await fetchWithRetry("https://huggingface.co/oauth/userinfo", { headers });
    if (res.ok) {
      return (await res.json()) as HfUserInfo;
    }
  } catch {
    // fall through to whoami
  }

  // Fallback to whoami-v2 (works with regular hf_* API tokens including fine-grained)
  try {
    const res = await fetchWithRetry("https://huggingface.co/api/whoami-v2", { headers });
    if (!res.ok) return null;
    const data = await res.json() as { _id?: string; name?: string; fullname?: string };
    return {
      sub: data._id || "",
      preferred_username: data.name,
      name: data.fullname || data.name,
    };
  } catch {
    return null;
  }
}
