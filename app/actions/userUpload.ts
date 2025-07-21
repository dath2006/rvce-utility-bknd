"use server";

import mongoose from "mongoose";
import User from "@/lib/models/user";
import Contributors from "@/lib/models/contibutors";

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

// Initialize MongoDB connection
let isConnected = false;

async function connectDB() {
  if (isConnected) return;

  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI environment variable is not defined");
    }

    const options = {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      connectTimeoutMS: 10000, // Give up initial connection after 10s
    };

    await mongoose.connect(process.env.MONGODB_URI, options);
    isConnected = true;
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("DB Connection Error:", error);
    isConnected = false; // Reset connection state on error
    throw new Error("Failed to connect to database");
  }
}

export const userUpload = async (
  user: UserProp,
  subject: string,
  uploadSessionId: string,
  file: FileProp
) => {
  // Input validation
  if (!user || !user.email || !user.fullName) {
    throw new Error("Invalid user data provided");
  }

  if (!subject || typeof subject !== "string") {
    throw new Error("Invalid subject provided");
  }

  if (!file || typeof file !== "object") {
    throw new Error("Invalid file provided");
  }

  try {
    await connectDB();

    const existingUser = await User.findOne({ email: user.email }).maxTimeMS(
      5000
    );
    const contribution = {
      subject,
      uploadSessionId,
      fileId: file.fileId.toString(),
      fileName: file.fileName.toString(),
      docType: file.docType.toString(),
      webViewLink: file.webViewLink.toString().replace("view", "preview"),
      webContentLink: file.webContentLink.toString(),
      description: file.description.toString(),
      semester: file.semester.toString(),
      branch: file.branch.toString(),
      subjectCode: file.subjectCode.toString(),
      contributedTo: file.contributedTo?.toString() || null,
      status: "pending",
      uploadedAt: new Date(),
    };

    if (existingUser) {
      existingUser.contribution.push(contribution);
      await existingUser.save();
    } else {
      const newUser = new User({
        name: user.fullName,
        email: user.email,
        imageUrl: user.imageUrl,
        contribution: [contribution],
        attendance: [],
      });
      await newUser.save();
    }

    return { success: true, message: "Contribution recorded successfully" };
  } catch (error) {
    console.error("Error in userUpload:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to record contribution: ${error.message}`);
    }
    throw new Error("Failed to record contribution");
  }
};

export const getUsersContribution = async () => {
  await connectDB();
  try {
    const contributors = await Contributors.find();
    if (!contributors) {
      throw new Error("No contributors found");
    }
    return contributors;
  } catch (error) {
    console.error("Error in getUsersContribution:", error);
    throw error instanceof Error
      ? error
      : new Error("Failed to fetch contributors");
  }
};

// export const updateUserContributionb = async () => {
//   await connectDB();
//   try {

//   } catch (error) {
//     console.log(error);

//   }
// }
