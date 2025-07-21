import { NextRequest, NextResponse } from "next/server";
import { listFiles, searchFiles } from "@/lib/google-drive";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get("folderId");
    const search = searchParams.get("search");

    let files;
    if (search) {
      files = await searchFiles(search);
    } else {
      files = await listFiles(folderId || undefined);
    }

    return NextResponse.json({ files });
  } catch (error) {
    console.error("Error fetching files:", error);
    return NextResponse.json(
      { error: "Failed to fetch files" },
      { status: 500 }
    );
  }
}
