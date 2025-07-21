import { NextRequest, NextResponse } from "next/server";
import Request from "@/lib/models/requests";
import User from "@/lib/models/user";

interface RequestBody {
  user: {
    email: string;
  };
}

// export async function DELETE(
//     req: NextRequest,
//     { params }: { params: Promise<{ reqId: string }> }
//   ) {
//     const { reqId } = await params;
//     let requestBody = await req.json();

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ reqId: string }> }
) {
  try {
    // Validate request body
    let requestBody: RequestBody;
    try {
      requestBody = await req.json();
    } catch (error) {
      return NextResponse.json(
        { success: false, message: "Invalid request body" },
        { status: 400 }
      );
    }

    const { reqId } = await params;
    const { email } = requestBody.user;

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      );
    }

    // Find request and user
    const [request, user] = await Promise.all([
      Request.findById(reqId),
      User.findOne({ email }),
    ]);

    if (!request) {
      return NextResponse.json(
        { success: false, message: "Request not found" },
        { status: 404 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Check authorization
    if (request.user !== user.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if request can be deleted
    if (
      request.documents.some(
        (file: any) =>
          file.fileId != null ||
          file.status === "approved" ||
          file.status === "rejected"
      )
    ) {
      return NextResponse.json(
        { success: false, message: "Deleting not permitted" },
        { status: 403 }
      );
    }

    // Delete request and update user
    await Promise.all([
      Request.findByIdAndDelete(reqId),
      User.findByIdAndUpdate(
        user._id,
        { $pull: { requests: reqId } },
        { new: true }
      ),
    ]);

    return NextResponse.json(
      { success: true, message: "Request deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in DELETE request:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
