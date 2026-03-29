import { NextRequest, NextResponse } from "next/server";
import { verifyUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { processSubmission, SubmitPayload } from "@/lib/submit-helper";
import { del, get } from "@vercel/blob";

export const runtime = "nodejs";

interface SubmitBody extends SubmitPayload {
  blobUrl: string;
}

export async function POST(request: NextRequest) {
  const token = process.env.HF_UPLOAD_TOKEN;
  const repoId = process.env.HF_REQUESTS_REPO || "lmms-lab-si/EASI-Leaderboard-Requests";

  if (!token) {
    console.error("Missing HF_UPLOAD_TOKEN env var");
    return NextResponse.json(
      { success: false, error: "Server configuration error. Please contact the maintainers." },
      { status: 500 }
    );
  }

  // Verify authentication
  const user = await verifyUser(request.headers.get("Authorization"));
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Your session has expired. Please sign in with HuggingFace again." },
      { status: 401 }
    );
  }

  const userName = user.preferred_username || user.name || user.sub;

  // Rate limit
  const rateCheck = checkRateLimit(userName);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { success: false, error: `You've reached the submission limit (5 per 2 hours). Please try again in ${rateCheck.retryAfterMinutes} minutes.` },
      { status: 429 }
    );
  }

  // Parse JSON body
  let body: SubmitBody;
  try {
    body = (await request.json()) as SubmitBody;
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body." },
      { status: 400 }
    );
  }

  // Validate blobUrl
  if (!body.blobUrl) {
    return NextResponse.json(
      { success: false, error: "Evaluation results zip file is required." },
      { status: 400 }
    );
  }

  // SSRF protection: validate URL matches Vercel Blob storage
  if (!/^https:\/\/[a-z0-9]+\.(?:private|public)\.blob\.vercel-storage\.com\//.test(body.blobUrl)) {
    return NextResponse.json(
      { success: false, error: "Invalid upload reference." },
      { status: 400 }
    );
  }

  // Fetch zip from Vercel Blob
  let zipBuffer: Buffer;
  try {
    const blobData = await get(body.blobUrl, {
      access: "private",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    if (!blobData || !blobData.stream) {
      return NextResponse.json(
        { success: false, error: "Failed to retrieve uploaded zip file." },
        { status: 400 }
      );
    }
    const chunks: Uint8Array[] = [];
    const reader = blobData.stream.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }
    zipBuffer = Buffer.concat(chunks);
  } catch (err) {
    console.error("[submit] Blob fetch error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve uploaded zip file." },
      { status: 400 }
    );
  }

  // Process submission (validate zip, check model, upload to HF)
  const result = await processSubmission(body, zipBuffer, userName, token, repoId);

  // Clean up Blob (best-effort)
  await del(body.blobUrl).catch(() => {});

  return result;
}
