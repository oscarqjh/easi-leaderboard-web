import { NextRequest, NextResponse } from "next/server";
import { verifyUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { processSubmission, SubmitPayload } from "@/lib/submit-helper";

export const runtime = "nodejs";

// Script-friendly endpoint: accepts multipart/form-data with inline zip.
// Limited to 4.5MB by Vercel's serverless payload limit.
// Accepts both OAuth tokens (hf_oauth_*) and regular HF API tokens (hf_*).

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

  // Parse multipart form data
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request. Expected multipart form data." },
      { status: 400 }
    );
  }

  // Extract payload JSON
  const payloadStr = formData.get("payload");
  if (typeof payloadStr !== "string") {
    return NextResponse.json(
      { success: false, error: "Missing submission payload." },
      { status: 400 }
    );
  }

  let payload: SubmitPayload;
  try {
    payload = JSON.parse(payloadStr) as SubmitPayload;
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid submission payload." },
      { status: 400 }
    );
  }

  // Extract zip file
  const zipFile = formData.get("zipFile");
  if (!zipFile || !(zipFile instanceof File)) {
    return NextResponse.json(
      { success: false, error: "Evaluation results zip file is required." },
      { status: 400 }
    );
  }

  const zipBuffer = Buffer.from(await zipFile.arrayBuffer());

  // Process submission (validate zip, check model, upload to HF)
  return processSubmission(payload, zipBuffer, userName, token, repoId);
}
