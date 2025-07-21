import { google } from "googleapis";

// Validate required environment variables
if (!process.env.GOOGLE_CLIENT_ID) {
  throw new Error("GOOGLE_CLIENT_ID is not set in environment variables");
}
if (!process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error("GOOGLE_CLIENT_SECRET is not set in environment variables");
}
if (!process.env.GOOGLE_REFRESH_TOKEN) {
  throw new Error("GOOGLE_REFRESH_TOKEN is not set in environment variables");
}
if (!process.env.GOOGLE_ROOT_FOLDER_ID) {
  throw new Error("GOOGLE_ROOT_FOLDER_ID is not set in environment variables");
}

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;
const GOOGLE_ROOT_FOLDER_ID = process.env.GOOGLE_ROOT_FOLDER_ID;

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET
);
oauth2Client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });

export const drive = google.drive({ version: "v3", auth: oauth2Client });

export async function listFiles(folderId: string = GOOGLE_ROOT_FOLDER_ID) {
  try {
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields:
        "files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, description, parents)",
      orderBy: "name",
    });

    return response.data.files || [];
  } catch (error) {
    console.error("Error listing files:", error);
    throw error;
  }
}

export async function deleteFile(fileId: string) {
  try {
    await drive.files.delete({
      fileId: fileId,
    });
    return { success: true };
  } catch (error) {
    console.error("Error deleting file:", error);
    throw error;
  }
}

export async function getFileMetadata(fileId: string) {
  try {
    const response = await drive.files.get({
      fileId: fileId,
      fields:
        "id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, description, parents",
    });

    return response.data;
  } catch (error) {
    console.error("Error getting file metadata:", error);
    throw error;
  }
}

export async function searchFiles(searchTerm: string) {
  try {
    // Try to fetch by ID first
    let fileById = null;
    try {
      fileById = await getFileMetadata(searchTerm);
    } catch (e) {
      // Ignore if not found or invalid
    }

    // Search by name
    const q = `(name contains '${searchTerm.replace(
      /'/g,
      "\\'"
    )}' and trashed = false)`;
    const response = await drive.files.list({
      q,
      fields:
        "files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, description, parents)",
      orderBy: "name",
    });

    let files = response.data.files || [];
    // If fileById is found and not already in the list, add it
    if (fileById && !files.some((f) => f.id === fileById.id)) {
      files = [fileById, ...files];
    }
    return files;
  } catch (error) {
    console.error("Error searching files:", error);
    throw error;
  }
}

export { GOOGLE_ROOT_FOLDER_ID };
