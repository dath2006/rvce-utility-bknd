import { NextRequest, NextResponse } from "next/server";
import Request from "@/lib/models/requests";
import mongoose from "mongoose";
import User from "@/lib/models/user";

let isConnected = false;

async function connectDB() {
  if (isConnected) return;

  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    isConnected = true;
    console.log("DB Connected");
  } catch (error) {
    console.error("DB Connection Error:", error);
    throw error;
  }
}
export async function GET(request: NextRequest) {
  await connectDB();
  try {
    const url = new URL(request.url);
    const email = url.searchParams.get("email");
    const requests = await Request.find({
      user: { $ne: email },
      status: { $nin: ["reviewing", "approved"] },
      $or: [
        // Case 1: documents is missing, null, or empty
        { documents: { $exists: false } },
        { documents: null },
        { documents: { $size: 0 } },
        // Case 2: documents has at least one with files missing/null/empty
        { "documents.files": { $exists: false } },
        { "documents.files": null },
        { "documents.files": { $size: 0 } },
        // Case 3: documents has at least one file with status pending
        {
          documents: {
            $elemMatch: {
              files: {
                $elemMatch: {
                  status: "pending",
                },
              },
            },
          },
        },
      ],
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("Error fetching requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch requests" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  await connectDB();
  try {
    const body = await request.json();

    const newRequest = new Request({
      user: body.email,
      subject: body.subject,
      subjectCode: body.subjectCode,
      branch: body.branch,
      semester: body.semester,
      postedAt: new Date(),
      documents: body.items,
      status: "pending",
    });
    const savedRequest = await newRequest.save();
    const user = await User.findOne({ email: body.email });
    if (user) {
      user.requests.push(savedRequest._id);
      await user.save();
    } else {
      const newUser = new User({
        name: body.fullName,
        email: body.email,
        imageUrl: body.image,
        requests: [savedRequest._id],
      });
      await newUser.save();
    }

    return NextResponse.json(
      { success: true, request: savedRequest },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error creating request:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create request" },
      { status: 500 }
    );
  }
}
