import { NextRequest, NextResponse } from "next/server";

// Allow up to 30s for OAuth flow (token exchange + userinfo)
export const maxDuration = 30;

const HF_TOKEN_URL = "https://huggingface.co/oauth/token";
const HF_USERINFO_URL = "https://huggingface.co/oauth/userinfo";

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 2
): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeout);
      return res;
    } catch (err) {
      if (i === retries) throw err;
      // Wait 500ms before retry
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw new Error("Unreachable");
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/submit?auth_error=missing_code", request.url));
  }

  const clientId = process.env.HF_CLIENT_ID;
  const clientSecret = process.env.HF_CLIENT_SECRET;
  const redirectUri = process.env.HF_REDIRECT_URI
    || `${request.nextUrl.origin}/api/auth/callback`;

  if (!clientId || !clientSecret) {
    console.error("Missing HF_CLIENT_ID or HF_CLIENT_SECRET env vars");
    return NextResponse.redirect(new URL("/submit?auth_error=server_config", request.url));
  }

  try {
    // Exchange code for token (with retry for cold start timeouts)
    const tokenRes = await fetchWithRetry(HF_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error("Token exchange failed:", tokenRes.status, errText);
      return NextResponse.redirect(
        new URL(`/submit?auth_error=token_exchange&detail=${encodeURIComponent(errText.slice(0, 200))}`, request.url)
      );
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // Fetch user info (with retry)
    const userRes = await fetchWithRetry(HF_USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userRes.ok) {
      return NextResponse.redirect(new URL("/submit?auth_error=userinfo", request.url));
    }

    const userInfo = await userRes.json();

    // Encode user data + access token for client-side pickup
    const userData = {
      id: userInfo.sub,
      name: userInfo.preferred_username || userInfo.name,
      avatar: userInfo.picture,
      accessToken,
    };
    const encoded = Buffer.from(JSON.stringify(userData)).toString("base64url");

    return NextResponse.redirect(new URL(`/submit?hf_user=${encoded}`, request.url));
  } catch (err) {
    console.error("OAuth callback error:", err);
    return NextResponse.redirect(new URL("/submit?auth_error=unknown", request.url));
  }
}
