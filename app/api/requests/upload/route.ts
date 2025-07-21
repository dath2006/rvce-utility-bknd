import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";
import { userUpload } from "@/app/actions/userUpload";
import { Readable } from "stream";
import Request from "@/lib/models/requests";
import User from "@/lib/models/user";
import { sendMail } from "@/lib/sendMail";

interface UserProp {
  fullName: string;
  email: string;
  imageUrl: string;
}

interface FileProp {
  fileId: string;
  fileName: string;
  docType: string;
  webViewLink: string;
  webContentLink: string;
  description: string;
  semester: string;
  branch: string;
  subjectCode: string;
  contributedTo: string;
}

// Helper to safely create or fetch a folder with better error handling
async function getOrCreateFolder(
  drive: any,
  folderName: string,
  parentId: string
): Promise<string> {
  try {
    // Check if folder exists
    const folderQuery = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and '${parentId}' in parents and trashed=false`;
    const folderList = await drive.files.list({
      q: folderQuery,
      fields: "files(id, name)",
      spaces: "drive",
    });

    // Return existing folder ID if found
    if (folderList.data.files && folderList.data.files.length > 0) {
      return folderList.data.files[0].id;
    }

    // Create folder if it doesn't exist
    const folderResponse = await drive.files.create({
      requestBody: {
        name: folderName,
        mimeType: "application/vnd.google-apps.folder",
        parents: [parentId],
      },
      fields: "id, name",
    });

    return folderResponse.data.id;
  } catch (err) {
    console.error("Folder creation error:", err);
    throw new Error(
      `Failed to create or find folder '${folderName}': ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }
}

// Improved authentication function
const authenticateGoogle = () => {
  try {
    // Get credentials from environment variables
    const privateKey = process.env.GOOGLE_DRIVE_PRIVATE_KEY;
    const clientEmail = process.env.GOOGLE_DRIVE_CLIENT_EMAIL;
    const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;

    // Validate credentials
    if (!privateKey || !clientEmail) {
      throw new Error(
        "Google Drive credentials are missing in environment variables"
      );
    }

    // Create proper private key format by replacing escaped newlines
    // This is often the source of JWT signature errors
    const formattedKey = privateKey.replace(/\\n/g, "\n");

    const auth = new google.auth.GoogleAuth({
      credentials: {
        type: "service_account",
        private_key: formattedKey,
        client_email: clientEmail,
        client_id: clientId || undefined, // Make client_id optional
      },
      scopes: ["https://www.googleapis.com/auth/drive"],
    });

    return auth;
  } catch (error) {
    console.error("Authentication error:", error);
    throw new Error(
      `Google authentication failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};

// Improved file stream processing
async function streamToBuffer(stream: ReadableStream): Promise<Buffer> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    return Buffer.concat(chunks);
  } finally {
    reader.releaseLock();
  }
}

// File type validation
const validateFileType = (file: File): boolean => {
  const allowedFileTypes = [
    "application/pdf", // PDF
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // DOCX
    "application/vnd.openxmlformats-officedocument.presentationml.presentation", // PPTX
    "text/plain", // TXT
  ];

  // Check if file type is in allowed types
  if (!allowedFileTypes.includes(file.type)) {
    // Handle some edge cases where MIME type might not be reliable
    const extension = file.name.toLowerCase().split(".").pop();
    if (
      (extension === "pdf" && file.type === "application/octet-stream") ||
      (extension === "docx" && file.type === "application/octet-stream") ||
      (extension === "pptx" && file.type === "application/octet-stream") ||
      (extension === "txt" && file.type === "application/octet-stream")
    ) {
      return true;
    }
    return false;
  }
  return true;
};

export async function POST(req: NextRequest) {
  try {
    const {
      responseData,
      subjectCode,
      user,
      uploadSessionId,
      reqId,
      docId,
      contributedAt,
    } = await req.json();

    const request = await Request.findById(reqId);
    const document = request.documents.find((doc: any) => doc.id === docId);
    if (!document) {
      return NextResponse.json(
        {
          error: "document not found",
        },
        { status: 400 }
      );
    }
    if (!user) {
      return NextResponse.json(
        {
          error: "user not found",
        },
        { status: 400 }
      );
    }

    // Update user upload record - using subjectCode as the subject parameter
    await userUpload(
      user as UserProp,
      subjectCode as string,
      uploadSessionId,
      responseData
    );

    const file = {
      contributedBy: user.email,
      contributedAt: new Date(contributedAt),
      status: "pending",
      fileName: responseData.fileName.toString(),
      fileId: responseData.fileId.toString(),
      webViewLink: responseData.webViewLink
        .toString()
        .replace("view", "preview"),
      webContentLink: responseData.webContentLink.toString(),
    };
    document.files.push(file);
    await request.save();

    // Fetch the contributedTo user (request.user is their email)
    const contributedToUser = await User.findOne({ email: request.user });
    if (contributedToUser && contributedToUser.email) {
      // Compose a beautiful HTML email
      const html = `
        <div style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 24px; border-radius: 8px; max-width: 600px; margin: auto;">
          <h2 style="color: #2d4a7a;">Resource Uploaded to Your Request</h2>
          <p>Hi <strong>${
            contributedToUser.name || contributedToUser.email
          }</strong>,</p>
          <p>A new resource has been contributed to your request on <b>RVCE Utility</b>!</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 16px 0;" />
          <h3 style="margin-bottom: 4px;">Resource Details:</h3>
          <ul style="padding-left: 20px;">
            <li><b>File Name:</b> ${file.fileName}</li>
            <li><b>Subject Code:</b> ${subjectCode}</li>
            <li><b>Contributed By:</b> ${user.fullName} (${user.email})</li>
            <li><b>Uploaded At:</b> ${new Date(
              contributedAt
            ).toLocaleString()}</li>
            <li><b>Preview Link:</b> <a href="${
              file.webViewLink
            }" target="_blank">View Resource</a></li>
            <li><b>NOTE:</b> Review the file and Accept it only if it's not available in the portal and it satisfies your request.(You can only accept one file if multiple files are present.)</li>
          </ul>
          <div style="margin: 32px 0 16px 0; text-align: center;">
            <a href="https://rvce-utility.vercel.app" style="background: #2d4a7a; color: #fff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">Accept or Review this File on RVCE Utility</a>
          </div>
          <p style="margin-top: 24px;">Thank you for using <b>RVCE Utility</b>!<br/>— The RVCE Utility Team</p>
        </div>
      `;
      const text = `Hi ${
        contributedToUser.name || contributedToUser.email
      },\n\nA new resource has been contributed to your request on RVCE Utility!\n\nFile Name: ${
        file.fileName
      }\nSubject Code: ${subjectCode}\nContributed By: ${user.fullName} (${
        user.email
      })\nUploaded At: ${new Date(
        contributedAt
      ).toLocaleString()}\nPreview Link: ${
        file.webViewLink
      }\nNote: Review the file and Accept it only if it's not available in the portal and it satisfies your request.(You can only accept one file if multiple files are present.)\n\nYou can accept or review this file at: https://rvce-utility.vercel.app\n\nThank you for using RVCE Utility!\n— The RVCE Utility Team`;
      await sendMail({
        to: contributedToUser.email,
        subject: "[RVCE Utility] New Resource Uploaded to Your Request",
        text,
        html,
      });
    }

    return NextResponse.json({
      success: true,
      message: "File uploaded successfully!",
    });
  } catch (error) {
    console.error("Upload error:", error);
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
