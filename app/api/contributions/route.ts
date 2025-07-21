import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/user";
import Request from "@/lib/models/requests";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // 'open' or 'request'

    if (type === "open") {
      // Get open contributions (where contributedTo is null)
      const users = await User.find({
        "contribution.contributedTo": null,
      }).select("name email contribution");

      const openContributions = [];
      for (const user of users) {
        for (const contrib of user.contribution) {
          if (contrib.contributedTo === null) {
            openContributions.push({
              ...contrib.toObject(),
              contributorEmail: user.email,
              contributorName: user.name,
            });
          }
        }
      }

      return NextResponse.json({ contributions: openContributions });
    } else if (type === "request") {
      // Get request contributions
      const requests = await Request.find();

      const requestContributions = [];
      for (const request of requests) {
        for (const doc of request.documents) {
          for (const file of doc.files) {
            // if (file.status === 'reviewing') {
            requestContributions.push({
              ...file.toObject(),
              _id: file._id,
              subject: request.subject,
              subjectCode: request.subjectCode,
              semester: request.semester,
              branch: request.branch,
              docType: doc.type,
              description: doc.description,
              contributorEmail: file.contributedBy,
              requestId: request._id,
              documentId: doc._id,
            });
            // }
          }
        }
      }

      return NextResponse.json({ contributions: requestContributions });
    }

    return NextResponse.json(
      { error: "Invalid type parameter" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error fetching contributions:", error);
    return NextResponse.json(
      { error: "Failed to fetch contributions" },
      { status: 500 }
    );
  }
}
