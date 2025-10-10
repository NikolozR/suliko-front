import { createReadStream, statSync } from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const videoPath = path.join(process.cwd(), "src", "data", "Video2.mp4");
  const stats = statSync(videoPath);
  const fileSize = stats.size;

  const range = request.headers.get("range");

  if (range) {
    // Handle HTTP Range requests for seeking
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;

    const stream = createReadStream(videoPath, { start, end });
    return new Response(stream as unknown as ReadableStream, {
      status: 206,
      headers: {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": String(chunkSize),
        "Content-Type": "video/mp4",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }

  // Fallback: return entire file
  const stream = createReadStream(videoPath);
  return new Response(stream as unknown as ReadableStream, {
    status: 200,
    headers: {
      "Content-Length": String(fileSize),
      "Content-Type": "video/mp4",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
