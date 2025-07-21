import { NextRequest, NextResponse } from "next/server";
import Request from "@/lib/models/requests";
import User from "@/lib/models/user";
import { sendTelegramNotification } from "@/lib/utils";

// Types for better type safety
interface RequestBody {
  action: "approved" | "rejected" | "reviewing";
  requestId: string;
  documentId: string;
  fileId: string;
  comment?: string;
}

interface FileDocument {
  fileId: string;
  status: string;
  rejectionComment?: string;
  contributedBy: string;
}

interface DocumentItem {
  id: string;
  files: FileDocument[];
}

// Helper function to update user contribution status
async function updateUserContribution(
  email: string,
  fileId: string,
  status: string,
  rejectionComment?: string
): Promise<void> {
  const user = await User.findOne({ email });
  if (!user) return;

  const contribution = user.contribution.find(
    (doc: any) => doc.fileId === fileId
  );

  if (contribution) {
    contribution.status =
      (status as "pending") || "approved" || "reviewing" || "rejected";
    if (rejectionComment) {
      contribution.rejectionComment = rejectionComment;
    }
    await user.save();
  }
}

// Helper function to reject other files in the same document
async function rejectOtherFiles(
  files: FileDocument[],
  currentFileId: string
): Promise<void> {
  const otherFiles = files.filter((file) => file.fileId !== currentFileId);

  // Use Promise.all for concurrent execution instead of forEach with async
  await Promise.all(
    otherFiles.map(async (file) => {
      file.status = "rejected";
      file.rejectionComment = "Not satisfied requirement";

      // Update user contribution
      await updateUserContribution(
        file.contributedBy,
        file.fileId,
        "rejected",
        "Not satisfied requirement"
      );
    })
  );
}

// Helper function to determine request status
function determineRequestStatus(documents: DocumentItem[]): string {
  const allFilesAccepted = documents.every((doc) =>
    doc.files.some((file) => file.status === "approved")
  );

  const allFilesReviewing = documents.every((doc) =>
    doc.files.some((file) => file.status === "reviewing")
  );

  if (allFilesAccepted) return "completed";
  if (allFilesReviewing) return "reviewing";
  return "pending"; // Default status
}

export async function POST(req: NextRequest) {
  try {
    // Input validation
    const body: RequestBody = await req.json();
    const { action, requestId, documentId, fileId, comment } = body;

    // Validate required fields
    if (!action || !requestId || !documentId || !fileId) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate action value
    if (!["approved", "rejected", "reviewing"].includes(action)) {
      return NextResponse.json(
        { success: false, message: "Invalid action value" },
        { status: 400 }
      );
    }

    // Find request with error handling
    const request = await Request.findById(requestId);
    if (!request) {
      return NextResponse.json(
        { success: false, message: "Request not found" },
        { status: 404 }
      );
    }

    // Find document
    const document = request.documents.find(
      (doc: DocumentItem) => doc.id === documentId
    );
    if (!document) {
      return NextResponse.json(
        { success: false, message: "Document not found" },
        { status: 404 }
      );
    }

    // Find file
    const file = document.files.find(
      (file: FileDocument) => file.fileId === fileId
    );
    if (!file) {
      return NextResponse.json(
        { success: false, message: "File not found" },
        { status: 404 }
      );
    }

    if (action === "approved") {
      await sendTelegramNotification({
        fileName: file.fileName,
        uploader: file.contributedBy,
        url: file.webViewLink,
        comment: `Hey Boss! user ${request.user} has accepted the contribution Need your attention ASAP`,
      });
    }

    // Update file status and comment
    if (action === "rejected" && comment) {
      file.rejectionComment = comment;
    }
    file.status = action === "approved" ? "reviewing" : action;

    // Handle multiple files in the same document
    if (document.files.length > 1 && action === "approved") {
      await rejectOtherFiles(document.files, fileId);
    }

    // Update request status
    request.status = determineRequestStatus(request.documents);

    // Update contributor's status
    await updateUserContribution(
      file.contributedBy,
      fileId,
      action === "approved" ? "reviewing" : action,
      action === "rejected" ? comment : undefined
    );

    // Save request with error handling
    await request.save();

    return NextResponse.json(
      {
        success: true,
        message: "Request updated successfully",
        data: {
          requestStatus: request.status,
          fileStatus: file.status,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating request:", error);

    // More specific error handling
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, message: `Server error: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
