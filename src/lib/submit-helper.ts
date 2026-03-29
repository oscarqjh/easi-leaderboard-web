import { NextResponse } from "next/server";
import { validateZipBuffer } from "@/lib/zip-validation";
import {
  getModelInfo,
  hasLicense,
  buildSubmissionPath,
  uploadSubmissionToRepo,
} from "@/lib/hf-api";

export interface SubmitPayload {
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

/**
 * Shared submission processing: validates zip, checks model metadata, uploads to HF.
 * Used by both /api/submit (browser flow) and /api/submit-with-file (script flow).
 */
export async function processSubmission(
  payload: SubmitPayload,
  zipBuffer: Buffer,
  userName: string,
  uploadToken: string,
  repoId: string,
): Promise<NextResponse> {
  // Validate zip
  const zipResult = validateZipBuffer(zipBuffer);
  if (!zipResult.valid) {
    return NextResponse.json(
      { success: false, error: zipResult.error },
      { status: 400 }
    );
  }

  // Required fields
  const MODEL_NAME_RE = /^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/;
  if (!payload.modelName || !MODEL_NAME_RE.test(payload.modelName)) {
    return NextResponse.json(
      { success: false, error: "A valid model name in the format 'organization/model-name' is required." },
      { status: 400 }
    );
  }
  if (!payload.modelType) {
    return NextResponse.json(
      { success: false, error: "Please select a model type (pretrained, finetuned, instruction, or rl)." },
      { status: 400 }
    );
  }
  if (!payload.precision) {
    return NextResponse.json(
      { success: false, error: "Please select a precision (bfloat16, float16, float32, or int8)." },
      { status: 400 }
    );
  }

  // Verify model exists on HuggingFace
  const modelInfo = await getModelInfo(payload.modelName, uploadToken);
  if (!modelInfo) {
    return NextResponse.json(
      { success: false, error: `Model "${payload.modelName}" was not found on HuggingFace. Please verify the model name and ensure it is publicly accessible.` },
      { status: 400 }
    );
  }

  // Verify license
  if (!hasLicense(modelInfo)) {
    return NextResponse.json(
      { success: false, error: `Model "${payload.modelName}" does not have a license set. Please add a license to your model card on HuggingFace before submitting.` },
      { status: 400 }
    );
  }

  // Delta/Adapter weights require base model
  if (payload.weightType === "Delta" || payload.weightType === "Adapter") {
    if (!payload.baseModel || !MODEL_NAME_RE.test(payload.baseModel)) {
      return NextResponse.json(
        { success: false, error: `A valid base model in the format 'organization/model-name' is required when using ${payload.weightType} weights.` },
        { status: 400 }
      );
    }
    const baseModelInfo = await getModelInfo(payload.baseModel, uploadToken);
    if (!baseModelInfo) {
      return NextResponse.json(
        { success: false, error: `Base model "${payload.baseModel}" was not found on HuggingFace.` },
        { status: 400 }
      );
    }
  }

  // Build submission path and JSON
  const revision = payload.revision || "main";
  const submissionFolder = buildSubmissionPath(
    userName,
    payload.modelName,
    payload.precision,
    payload.weightType || "Original"
  );

  const submitTime = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

  const submissionContent = {
    user_id: userName,
    model_id: payload.modelName,
    base_model: payload.baseModel || "",
    model_sha: revision,
    model_dtype: payload.precision,
    weight_type: payload.weightType || "Original",
    backend: payload.backend || "others",
    model_type: payload.modelType,
    submit_time: submitTime,
    remarks: payload.remarks || "Submitted via EASI Leaderboard",
    config: {},
    results: payload.scores,
    sub_scores: payload.subScores || {},
  };

  const fileContent = JSON.stringify(submissionContent, null, 2);

  // Upload to HF
  const uploadResult = await uploadSubmissionToRepo(
    repoId,
    uploadToken,
    submissionFolder,
    fileContent,
    zipBuffer,
    `Add ${payload.modelName} submission by ${userName}`
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
