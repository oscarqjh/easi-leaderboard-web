import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { verifyUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      token: process.env.BLOB_READ_WRITE_TOKEN,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        let token: string | null = null;
        try { token = clientPayload ? JSON.parse(clientPayload).token : null; } catch { token = null; }
        if (!token) throw new Error("Not authenticated");

        const user = await verifyUser(`Bearer ${token}`);
        if (!user) throw new Error("Not authenticated");

        const userName = user.preferred_username || user.name || user.sub;
        const rateCheck = checkRateLimit(userName);
        if (!rateCheck.allowed) {
          throw new Error(`Rate limit exceeded. Try again in ${rateCheck.retryAfterMinutes} minutes.`);
        }

        return {
          allowedContentTypes: [
            "application/zip",
            "application/x-zip-compressed",
            "application/octet-stream",
          ],
          maximumSizeInBytes: 20 * 1024 * 1024, // 20 MB
          tokenPayload: JSON.stringify({
            userId: user.preferred_username || user.name || user.sub,
          }),
          // Use request origin as callback URL for local dev compatibility
          callbackUrl: request.headers.get("origin") || undefined,
        };
      },
      onUploadCompleted: async () => {
        // No-op: the /api/submit route handles everything after upload.
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}

// PUT handler for local dev: server-side upload to Vercel Blob
export async function PUT(request: NextRequest): Promise<NextResponse> {
  const user = await verifyUser(request.headers.get("Authorization"));
  if (!user) {
    return NextResponse.json(
      { error: "Your session has expired. Please sign in again." },
      { status: 401 }
    );
  }

  const userName = user.preferred_username || user.name || user.sub;
  const rateCheck = checkRateLimit(userName);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: `Rate limit exceeded. Try again in ${rateCheck.retryAfterMinutes} minutes.` },
      { status: 429 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No file provided." },
        { status: 400 }
      );
    }

    const blob = await put(file.name, file, {
      access: "private",
      addRandomSuffix: true,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("[blob-upload PUT] Error:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
