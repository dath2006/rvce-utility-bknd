import { NextRequest, NextResponse } from "next/server";
import Request from "@/lib/models/requests";
import mongoose from "mongoose";
import User from "@/lib/models/user";

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

export async function GET(request: NextRequest) {
  await connectDB();
  try {
    const url = new URL(request.url);
    const email = url.searchParams.get("email");
    const user = await User.findOne({ email }).populate("requests");
    const requests = user?.requests || [];
    return NextResponse.json({ success: true, requests });
  } catch (error) {
    console.error("Error fetching requests:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch requests" },
      { status: 500 }
    );
  }
}

//   {
//     id: "ABC123",
//     department: "ECE",
//     semester: "SEM 3",
//     postedDate: "10/02/25",
//     status: "completed",
//     contributions: [
//       {
//         contributor: "@electronics_pro",
//         date: "11/02/25",
//         files: [
//           {
//             name: "Circuit Theory",
//             fileName: "Basic_Circuits_v2.pdf",
//             type: "Lab Manual",
//             status: "approved",
//           },
//         ],
//       },
//     ],
//   },
