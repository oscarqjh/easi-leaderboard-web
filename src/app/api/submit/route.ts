import { NextRequest, NextResponse } from "next/server";
import {
  getModelInfo,
  hasLicense,
  buildSubmissionPath,
  uploadJsonToRepo,
} from "@/lib/hf-api";
import { checkRateLimit } from "@/lib/rate-limit";

const HF_USERINFO_URL = "https://huggingface.co/oauth/userinfo";

interface SubmitPayload {
  modelName: string;
  modelType: string;
  precision: string;
  revision: string;
  weightType: string;
  baseModel: string;
  backend: string;
  scores: Record<string, number | null>;
  subScores?: Record<string, Record<string, number | null>>;
  remarks: string;
}

interface HfUserInfo {
  sub: string;
  preferred_username?: string;
  name?: string;
}

async function verifyUser(request: NextRequest): Promise<HfUserInfo | null> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

  const accessToken = authHeader.slice(7);
  if (!accessToken) return null;

  try {
    const res = await fetch(HF_USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    return (await res.json()) as HfUserInfo;
  } catch {
    return null;
  }
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

  // ── Verify authentication via Bearer token ──
  const user = await verifyUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Your session has expired. Please sign in with HuggingFace again." },
      { status: 401 }
    );
  }

  const userName = user.preferred_username || user.name || user.sub;

  // ── Rate limit ──
  const rateCheck = checkRateLimit(userName);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { success: false, error: `You've reached the submission limit (5 per 2 hours). Please try again in ${rateCheck.retryAfterMinutes} minutes.` },
      { status: 429 }
    );
  }

  let body: SubmitPayload;
  try {
    body = (await request.json()) as SubmitPayload;
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body." },
      { status: 400 }
    );
  }

  // ── Required fields ──
  if (!body.modelName || !body.modelName.includes("/")) {
    return NextResponse.json(
      { success: false, error: "A valid model name in the format 'organization/model-name' is required." },
      { status: 400 }
    );
  }
  if (!body.modelType) {
    return NextResponse.json(
      { success: false, error: "Please select a model type (pretrained, finetuned, instruction, or rl)." },
      { status: 400 }
    );
  }
  if (!body.precision) {
    return NextResponse.json(
      { success: false, error: "Please select a precision (bfloat16, float16, float32, or int8)." },
      { status: 400 }
    );
  }

  // ── Verify model exists on HuggingFace ──
  const modelInfo = await getModelInfo(body.modelName, token);
  if (!modelInfo) {
    return NextResponse.json(
      { success: false, error: `Model "${body.modelName}" was not found on HuggingFace. Please verify the model name and ensure it is publicly accessible.` },
      { status: 400 }
    );
  }

  // ── Verify license exists ──
  if (!hasLicense(modelInfo)) {
    return NextResponse.json(
      { success: false, error: `Model "${body.modelName}" does not have a license set. Please add a license to your model card on HuggingFace before submitting.` },
      { status: 400 }
    );
  }

  // ── For Delta/Adapter weights, require and verify base model ──
  if (body.weightType === "Delta" || body.weightType === "Adapter") {
    if (!body.baseModel) {
      return NextResponse.json(
        { success: false, error: `Base model is required when using ${body.weightType} weights. Please specify the base model.` },
        { status: 400 }
      );
    }
    const baseModelInfo = await getModelInfo(body.baseModel, token);
    if (!baseModelInfo) {
      return NextResponse.json(
        { success: false, error: `Base model "${body.baseModel}" was not found on HuggingFace. Please verify the base model name.` },
        { status: 400 }
      );
    }
  }

  // ── Build submission path and JSON (using server-verified userName) ──
  const revision = body.revision || "main";
  const submissionPath = buildSubmissionPath(
    userName,
    body.modelName,
    body.precision,
    body.weightType || "Original"
  );

  const submitTime = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

  const submissionContent = {
    user_id: userName,
    model_id: body.modelName,
    base_model: body.baseModel || "",
    model_sha: revision,
    model_dtype: body.precision,
    weight_type: body.weightType || "Original",
    backend: body.backend || "others",
    model_type: body.modelType,
    submit_time: submitTime,
    remarks: body.remarks || "Submitted via EASI Leaderboard",
    config: {},
    results: body.scores,
    sub_scores: body.subScores || {},
  };

  const fileContent = JSON.stringify(submissionContent, null, 2);

  // ── Upload to HF dataset repo ──
  const uploadResult = await uploadJsonToRepo(
    repoId,
    token,
    submissionPath,
    fileContent,
    `Add ${body.modelName} submission by ${userName}`
  );

  if (!uploadResult.success) {
    console.error("Upload failed:", uploadResult.error);
    return NextResponse.json(
      { success: false, error: "Failed to upload your submission to the repository. Please try again later or contact the maintainers if the issue persists." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
