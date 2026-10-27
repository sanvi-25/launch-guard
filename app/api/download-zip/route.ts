import { NextResponse } from "next/server";
import { createZipBuffer } from "@/lib/zip-builder";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rootDir = process.cwd();
    const zipBuffer = createZipBuffer(rootDir);

    // Also write a copy to the parent desktop folder for easy access
    try {
      const desktopZipPath = path.resolve(rootDir, "..", "launchguard.zip");
      fs.writeFileSync(desktopZipPath, zipBuffer);
    } catch (e) {
      // Ignore if permission issue
    }

    return new NextResponse(zipBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="launchguard.zip"',
        "Content-Length": zipBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("ZIP creation failed:", error);
    return NextResponse.json({ error: "Failed to generate zip" }, { status: 500 });
  }
}
