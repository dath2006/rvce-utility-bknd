import mongoose from "mongoose";
import User from "@/lib/models/user";
import { Attendance, TimeTable } from "@/lib/models/attendance";
import { NextResponse } from "next/server";
import { getDaySchedules } from "@/utils/daySchedules";

interface DaySchedule {
  day: string;
  dates: string[];
}

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

// Utility function to convert a date to IST and set time to 00:00:00
function toISTMidnight(date: Date | string): Date {
  const d = typeof date === "string" ? new Date(date) : new Date(date);
  // Convert to IST
  const utc = d.getTime() + d.getTimezoneOffset() * 60000;
  const ist = new Date(utc + 5.5 * 60 * 60 * 1000);
  // Set time to 00:00:00
  ist.setHours(0, 0, 0, 0);
  return ist;
}

export async function POST(request: Request) {
  await connectDB();
  try {
    const body = await request.json();
    if (!body || !body.user) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { user } = body;

    // Validate user data
    if (!user.email || !user.branch || !user.courseStart) {
      return NextResponse.json(
        { error: "Missing required user data" },
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({ email: user.email });

    if (existingUser) {
      if (existingUser.timeTable) {
        const customTimeTable =
          (await Attendance.findOne({
            timeTable: existingUser.timeTable,
            custom: true,
          })) || null;

        if (customTimeTable) {
          await Attendance.findByIdAndDelete(customTimeTable._id);

          await TimeTable.deleteOne({ _id: existingUser.timeTable });
        }
      }
    }

    // Use IST midnight for 'now'
    const now = toISTMidnight(new Date());
    const attendance = await Attendance.findOne({
      class: user.branch + user.section,
    }).populate("timeTable");

    if (!attendance) {
      return NextResponse.json(
        { error: "Attendance record not found" },
        { status: 404 }
      );
    }

    if (!attendance.timeTable) {
      return NextResponse.json(
        { error: "Timetable not found for attendance record" },
        { status: 404 }
      );
    }

    // Get attendance records for each day
    const daySchedules = getDaySchedules(user.courseStart, now);
    const attendanceRecords = daySchedules.flatMap((schedule: any) =>
      schedule.dates.map((date: any) => ({
        date: toISTMidnight(date),
        dayTimeTable: attendance.timeTable.events
          .filter((event: any) => event.day === schedule.day)
          .map((event: any) => {
            if (!event.slotId) {
              console.warn("Event without slotId found");
              return null;
            }

            const timeSlot = attendance.timeTable
              .toObject()
              .timeSlots.find((slot: any) => slot.slotId === event.slotId);

            return {
              ...event.toObject(),
              display: timeSlot?.display || "",
              attendance: "pending",
              custom: false,
            };
          })
          .filter(Boolean), // Remove null entries
      }))
    );

    if (!attendanceRecords.length) {
      return NextResponse.json(
        { error: "No attendance records generated" },
        { status: 400 }
      );
    }

    const userData = {
      name: user.fullName,
      email: user.email,
      imageUrl: user.imageUrl,
      branch: user.branch,
      section: user.section,
      courseStart: user.courseStart,
      courseEnd: user.courseEnd,
      minAttendance: user.minAttendance || 75, // Default to 75% if not specified
      timeTable: attendance.timeTable._id,
      courses: attendance.timeTable.courses.map((course: any) => ({
        ...course.toObject(),
        minAttendance: user.minAttendance || 75,
      })),
      attendance: attendanceRecords,
    };

    if (!existingUser) {
      const newUser = new User(userData);
      await newUser.save();
      return NextResponse.json({
        success: true,
        message: "User created with attendance records",
      });
    } else {
      Object.assign(existingUser, userData);
      await existingUser.save();
      return NextResponse.json({
        success: true,
        message: "User updated with new attendance records",
      });
    }
  } catch (error) {
    console.error("Error in POST /api/attendance/initialize:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to initialize attendance",
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
