import { NextRequest, NextResponse } from "next/server";
import { list, del } from "@vercel/blob";

export const runtime = "nodejs";

const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function GET(request: NextRequest) {
  // Verify the request is from Vercel Cron (CRON_SECRET) or has valid auth
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "BLOB_READ_WRITE_TOKEN not configured" },
      { status: 500 }
    );
  }

  let deleted = 0;
  let checked = 0;
  const now = Date.now();
  let cursor: string | undefined;

  // Paginate through all blobs
  do {
    const result = await list({ token, cursor });
    cursor = result.cursor;

    for (const blob of result.blobs) {
      checked++;
      const uploadedAt = new Date(blob.uploadedAt).getTime();
      if (now - uploadedAt > MAX_AGE_MS) {
        await del(blob.url, { token });
        deleted++;
      }
    }
  } while (cursor);

  console.log(`[cleanup-blobs] Checked ${checked} blobs, deleted ${deleted} older than 24h`);

  return NextResponse.json({
    success: true,
    checked,
    deleted,
  });
}
