import mongoose from "mongoose";
import User from "@/lib/models/user";
import { NextRequest, NextResponse } from "next/server";

// Define types for our data structure
interface Document {
  subject: string;
  id: string;
  name: string;
  webViewLink: string;
  webContentLink: string;
  description: string;
  docType: string;
  contributedTo: string | null;
  uploadSessionId: string;
  semester: string;
  branch: string;
  subjectCode: string;
  approved: string;
  _id: mongoose.Types.ObjectId;
  uploadedAt: Date;
}

interface GroupedDocument {
  uploadSessionId: string;
  documents: Document[];
}

// Initialize MongoDB connection
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

export const GET = async (req: NextRequest) => {
  await connectDB();

  try {
    const url = new URL(req.url);
    const email = url.searchParams.get("email");
    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json({ success: true, resources: [] });
    }

    // Group documents by uploadSessionId
    const groupedResources = user.contribution.reduce(
      (acc: { [key: string]: GroupedDocument }, doc: Document) => {
        if (!acc[doc.uploadSessionId]) {
          acc[doc.uploadSessionId] = {
            uploadSessionId: doc.uploadSessionId,
            documents: [],
          };
        }
        acc[doc.uploadSessionId].documents.push(doc);
        return acc;
      },
      {}
    );

    // Sort documents within each group by uploadedAt (latest first)
    Object.values(groupedResources).forEach((group: any) => {
      group.documents.sort(
        (a: any, b: any) =>
          new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      );
    });

    // Convert the grouped object to an array and sort groups by the latest document's uploadedAt
    const resources = Object.values(groupedResources).sort((a: any, b: any) => {
      const latestA = Math.max(
        ...a.documents.map((doc: any) => new Date(doc.uploadedAt).getTime())
      );
      const latestB = Math.max(
        ...b.documents.map((doc: any) => new Date(doc.uploadedAt).getTime())
      );
      return latestB - latestA; // Latest first
    });

    return NextResponse.json({ success: true, resources });
  } catch (error) {
    console.error("Error in userUpload:", error);
    throw error;
  }
};

// {
//   "subject": "XTXISC",
//   "id": "1JTEmkyVY4bFX2Xcn3963sSlFrPfpougL",
//   "name": "Exp-3 Ph of Softdrink.pdf",
//   "webViewLink": "https://drive.google.com/file/d/1JTEmkyVY4bFX2Xcn3963sSlFrPfpougL/view?usp=drivesdk",
//   "webContentLink": "https://drive.google.com/uc?id=1JTEmkyVY4bFX2Xcn3963sSlFrPfpougL&export=download",
//   "description": "Document Type: Notes, Subject: XTXISC, Semester: 4, Branch: Electronics, Uploaded by: hackingman2006@gmail.com",
//   "docType": "Notes",
//   "contributedTo": null,
//   "uploadSessionId": "8d2d29cf-6a09-4b4e-a571-3401bb5d1cc9",
//   "semester": "4",
//   "branch": "Electronics",
//   "subjectCode": "XTXISC",
//   "approved": "pending",
//   "_id": {
//     "$oid": "68433fa19ceecf3641eaf1be"
//   },
//   "uploadedAt": {
//     "$date": "2025-06-06T19:21:05.920Z"
//   }
// }
