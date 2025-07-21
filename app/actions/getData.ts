"use server";

import mongoose from "mongoose";
import User from "@/lib/models/user";

// Initialize MongoDB connection
let isConnected = false;

async function connectDB() {
  if (isConnected) return;

  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI environment variable is not defined");
    }
    await mongoose.connect(process.env.MONGODB_URI);
    isConnected = true;
  } catch (error) {
    console.error("DB Connection Error:", error);
    throw new Error("Failed to connect to database");
  }
}

export const getTimeTable = async (email: string) => {
  if (!email || typeof email !== "string") {
    throw new Error("Invalid email provided");
  }

  await connectDB();
  try {
    const user = await User.findOne({ email: email }).populate("timeTable");

    if (!user) {
      throw new Error("User not found");
    }

    if (!user.timeTable) {
      throw new Error("No timetable found for user");
    }

    return user.timeTable.toObject();
  } catch (error) {
    console.error("Error in getTimeTable:", error);
    throw error instanceof Error
      ? error
      : new Error("Failed to fetch timetable");
  }
};

export const hasTimeTable = async (email: string) => {
  if (!email || typeof email !== "string") {
    throw new Error("Invalid email provided");
  }

  await connectDB();
  try {
    const user = await User.findOne({ email: email });

    if (!user) {
      return { hasTimeTable: false };
    }
    const checkTimeTable = user.timeTable;

    const hasTable = Boolean(checkTimeTable?.toString()?.length);
    return { hasTimeTable: hasTable };
  } catch (error) {
    console.error("Error in hasTimeTable:", error);
    throw error instanceof Error
      ? error
      : new Error("Failed to check timetable status");
  }
};
