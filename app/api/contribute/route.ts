import { NextRequest, NextResponse } from "next/server";
import { userUpload } from "@/app/actions/userUpload";
import { sendTelegramNotification } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const { responseData, subjectName, user, uploadSessionId } =
      await req.json();

    console.log(responseData);
    await userUpload(user, subjectName, uploadSessionId, responseData);

    // Notify after successful upload
    await sendTelegramNotification({
      fileName: responseData.fileName,
      uploader: user.email,
      url: responseData.webViewLink,
      comment: "Open Contribution, Need your attention boss!",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Upload failed",
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
