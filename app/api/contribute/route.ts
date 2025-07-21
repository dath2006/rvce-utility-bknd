import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";
import { userUpload } from "@/app/actions/userUpload";
import { Readable } from "stream";
import { sendTelegramNotification } from "@/lib/utils";

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
  contributedTo: string | null;
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

// export async function POST(req: NextRequest) {
//   try {
//     const formData = await req.formData();
//     const subjectCode = formData.get("subjectCode") as string;
//     const semester = formData.get("semester") as string;
//     const uploadSessionId = formData.get("uploadSessionId") as string;
//     const branch = formData.get("branch") as string;
//     const docType = formData.get("docType") as string;
//     const file = formData.get("file") as File;
//     const userStr = formData.get("user") as string | null;
//     const contributedTo = formData.get("contributedTo") as string | null;

//     // Validate required inputs
//     if (!subjectCode || !semester || !branch || !docType) {
//       return NextResponse.json(
//         {
//           error:
//             "Subject code, semester, branch, and document type are required",
//         },
//         { status: 400 }
//       );
//     }

//     if (!userStr) {
//       return NextResponse.json(
//         { error: "User not logged in" },
//         { status: 401 }
//       );
//     }

//     if (!file || !(file instanceof File)) {
//       return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
//     }

//     // Validate file type
//     if (!validateFileType(file)) {
//       const allowedExtensions = [".pdf", ".docx", ".pptx", ".txt"];
//       return NextResponse.json(
//         {
//           error: `Invalid file type. Only ${allowedExtensions.join(
//             ", "
//           )} files are allowed.`,
//         },
//         { status: 400 }
//       );
//     }

//     // Check file size (20MB limit)
//     const MAX_SIZE = 20 * 1024 * 1024; // 20MB in bytes
//     if (file.size > MAX_SIZE) {
//       return NextResponse.json(
//         { error: `File ${file.name} exceeds 20MB limit` },
//         { status: 400 }
//       );
//     }

//     // Parse user information
//     const user = JSON.parse(userStr) as UserProp;

//     // Initialize Google Drive API with improved error handling
//     let drive;
//     try {
//       const auth = authenticateGoogle();
//       drive = google.drive({ version: "v3", auth });
//     } catch (authError) {
//       console.error("Authentication failed:", authError);
//       return NextResponse.json(
//         {
//           error: "Authentication failed with Google Drive API",
//           details: String(authError),
//         },
//         { status: 500 }
//       );
//     }

//     // Root folder ID (consider moving this to environment variables)
//     const ROOT_FOLDER_ID =
//       process.env.GOOGLE_ROOT_FOLDER_ID || "1X5LgbRPdPgVSDYFfwQxvZ9oaLqWZZVUO";

//     // Create folder structure: rootFolder/userEmail/subjectCode_semester_branch_docType
//     const userFolderName = `${user.email}/upload`;
//     const userFolderId = await getOrCreateFolder(
//       drive,
//       userFolderName,
//       ROOT_FOLDER_ID
//     );

//     // Include docType in folder structure for better organization
//     const subjectFolderName = `${subjectCode}_${semester}_${branch}_${docType}`;
//     const subjectFolderId = await getOrCreateFolder(
//       drive,
//       subjectFolderName,
//       userFolderId
//     );

//     // Process file upload
//     const fileBuffer = await streamToBuffer(file.stream());

//     // Upload file to Drive
//     const response = await drive.files.create({
//       requestBody: {
//         name: file.name,
//         parents: [subjectFolderId],
//         description: `Document Type: ${docType}, Subject: ${subjectCode}, Semester: ${semester}, Branch: ${branch}, Uploaded by: ${user.email}`,
//       },
//       media: {
//         mimeType: file.type || "application/octet-stream",
//         body: Readable.from(fileBuffer),
//       },
//       fields: "id,name,webViewLink,webContentLink,description",
//     });
//     console.log(response.data);
//     const responseData = {
//       id: response.data.id,
//       name: response.data.name,
//       docType: docType,
//       webViewLink: response.data.webViewLink,
//       webContentLink: response.data.webContentLink,
//       description: response.data.description,
//       semester: semester,
//       branch: branch,
//       subjectCode: subjectCode,
//       contributedTo: contributedTo,
//     };

//     // Update user upload record - using subjectCode as the subject parameter
//     await userUpload(
//       user,
//       subjectCode,
//       uploadSessionId,
//       responseData as FileProp
//     );

//     return NextResponse.json({
//       success: true,
//       fileId: response.data.id,
//       fileName: response.data.name,
//       fileUrl: response.data.webViewLink,
//       message: "File uploaded successfully!",
//     });
//   } catch (error) {
//     console.error("Upload error:", error);
//     return NextResponse.json(
//       {
//         error: error instanceof Error ? error.message : "Upload failed",
//         details: error instanceof Error ? error.stack : undefined,
//       },
//       { status: 500 }
//     );
//   }
// }

export async function POST(req: NextRequest) {
  try {
    const { responseData, subjectName, user, uploadSessionId } =
      await req.json();
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
