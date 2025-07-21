"use server";

import mongoose from "mongoose";
import User from "@/lib/models/user";
import { Attendance, TimeTable } from "@/lib/models/attendance";
import { getDaySchedules } from "@/utils/daySchedules";

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

interface TimeSlotData {
  id: string;
  display: string;
  start: number;
  end: number;
}

interface CourseData {
  name: string;
  fullName: string;
  type: "theory" | "lab" | "session";
  instructor?: string;
  parentCourse?: string;
}

interface EventData {
  day: string;
  dayIndex: number;
  courseId: string;
  slotId: string;
  duration: number;
  attendance?: "pending" | "present" | "absent" | "ignore";
  description?: string;
}

interface AttendanceData {
  class: string;
  timeTable: string; // MongoDB ObjectId as string
}

interface UserData {
  name: string;
  email: string;
  imageUrl?: string;
  branch?: string;
  section?: string;
  courseStart?: Date;
  courseEnd?: Date;
  minAttendance?: number;
}

interface InitDay {
  email: string;
  date: Date;
}

interface NewSubject {
  day: string;
  dayIndex: number;
  courseId: string;
  slotId: string;
  duration: number;
  attendance: "pending" | "present" | "absent" | "ignore";
  display: string;
  custom: boolean;
}

interface DeleteSubject {
  email: string;
  date: Date;
  slotId: string;
  courseId: string;
}

export async function initDay(data: InitDay) {
  if (!data.email || !data.date) {
    throw new Error("Invalid input data");
  }

  await connectDB();

  try {
    const user = await User.findOne({ email: data.email });
    if (!user) {
      throw new Error("User not found");
    }

    const timeTable = await TimeTable.findById(user.timeTable);
    if (!timeTable) {
      throw new Error("Timetable not found");
    }

    // Compare only the day (not time), in IST
    const dataDateIST = new Date(
      new Date(data.date).toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
    );
    const courseEndIST = new Date(
      new Date(user.courseEnd).toLocaleString("en-US", {
        timeZone: "Asia/Kolkata",
      })
    );
    // Set time to 00:00:00 for both dates to compare only the day
    dataDateIST.setHours(0, 0, 0, 0);
    courseEndIST.setHours(0, 0, 0, 0);

    if (dataDateIST > courseEndIST) {
      return {
        success: true,
        dayTable: JSON.stringify(
          user.attendance.find(
            (el: any) => el.date === new Date(user.courseEnd).toDateString()
          )?.dayTimeTable
        ),
        courses: timeTable.toObject().courses,
        accStart: user.courseStart,
        accEnd: user.courseEnd,
      };
    }

    if (dataDateIST < user.courseStart) {
      return {
        success: true,
        dayTable: JSON.stringify([]),
        courses: timeTable.toObject().courses,
      };
    }

    const day = new Date(data.date).toDateString().split(" ")[0].toUpperCase();
    const courses = timeTable.toObject().courses;

    // Check for duplicate date if found return it
    const dateString = new Date(data.date).toDateString();
    const prevTimeTable =
      user.attendance.find((el: any) => el.date === dateString) || null;
    if (prevTimeTable) {
      return {
        success: true,
        dayTable: JSON.stringify(prevTimeTable.dayTimeTable),
        courses,
        accStart: user.courseStart,
        accEnd: user.courseEnd,
      };
    }

    const dayTable = timeTable.events
      .filter((e: any) => e.day === day)
      .map((e: any) => {
        const timeSlotInfo = timeTable
          .toObject()
          .timeSlots.find((slot: any) => slot.slotId === e.slotId);

        return {
          ...e.toObject(),
          display: timeSlotInfo ? timeSlotInfo.display : "",
        };
      });

    if (!user.attendance.some((el: any) => el.date === dateString)) {
      user.attendance.push({
        date: dateString,
        dayTimeTable: dayTable,
      });
      await user.save();
    }

    const newDaySchedule = await user.attendance
      .find((ele: any) => ele.date === dateString)
      .toObject().dayTimeTable;

    return {
      success: true,
      dayTable: JSON.stringify(newDaySchedule),
      courses,
      accStart: user.courseStart,
      accEnd: user.courseEnd,
    };
  } catch (error) {
    console.error("Error in initDay:", error);
    throw error instanceof Error
      ? error
      : new Error("Failed to initialize day");
  }
}

export async function addSubject(data: {
  user: { email: string; date: Date };
  subject: NewSubject;
}) {
  if (!data.user?.email || !data.user?.date || !data.subject) {
    throw new Error("Invalid input data");
  }

  await connectDB();
  try {
    const user = await User.findOne({ email: data.user.email });
    if (!user) {
      throw new Error("User not found");
    }

    const attendance = user.attendance.find(
      (ele: any) => ele.date === new Date(data.user.date).toDateString()
    );

    if (!attendance) {
      throw new Error("Attendance record not found for the specified date");
    }

    attendance.dayTimeTable.push(data.subject);
    await user.save();

    return { success: true, newSubject: data.subject };
  } catch (error) {
    console.error("Error in addSubject:", error);
    throw error instanceof Error ? error : new Error("Failed to add subject");
  }
}

export async function deleteSubject(data: DeleteSubject) {
  if (!data.email || !data.date || !data.slotId || !data.courseId) {
    throw new Error("Invalid input data");
  }

  await connectDB();

  try {
    const user = await User.findOne({ email: data.email });
    if (!user) {
      throw new Error("User not found");
    }

    const dateString = new Date(data.date).toDateString();
    const attendanceRecord = user.attendance.find(
      (ele: any) => ele.date === dateString
    );

    if (!attendanceRecord) {
      throw new Error("Attendance record not found for the specified date");
    }

    const initialLength = attendanceRecord.dayTimeTable.length;
    attendanceRecord.dayTimeTable = attendanceRecord.dayTimeTable.filter(
      (el: any) => !(el.slotId === data.slotId && el.courseId === data.courseId)
    );

    if (attendanceRecord.dayTimeTable.length === initialLength) {
      throw new Error("Subject not found in the timetable");
    }

    await user.save();

    return {
      success: true,
      message: "Subject deleted successfully",
      daySchedule: attendanceRecord.dayTimeTable,
    };
  } catch (error) {
    console.error("Error in deleteSubject:", error);
    throw error instanceof Error
      ? error
      : new Error("Failed to delete subject");
  }
}

export async function updateAttendance(data: {
  user: InitDay;
  daySchedule: any;
}) {
  if (!data.user?.email || !data.user?.date || !data.daySchedule) {
    throw new Error("Invalid input data");
  }

  await connectDB();
  try {
    const user = await User.findOne({ email: data.user.email });
    if (!user) {
      throw new Error("User not found");
    }

    const dateString = new Date(data.user.date).toDateString();
    const attendanceRecord = user.attendance.find(
      (ele: any) => ele.date === dateString
    );

    if (!attendanceRecord) {
      throw new Error("Attendance record not found for the specified date");
    }

    attendanceRecord.dayTimeTable = data.daySchedule;
    await user.save();

    return {
      success: true,
      message: "Attendance Updated",
      daySchedule: attendanceRecord.dayTimeTable,
    };
  } catch (error) {
    console.error("Error in updateAttendance:", error);
    throw error instanceof Error
      ? error
      : new Error("Failed to update attendance");
  }
}

export async function updateSubjectPercentage(data: {
  email: string;
  courseId: string;
  percentage: number;
}) {
  if (!data.email || !data.courseId || typeof data.percentage !== "number") {
    throw new Error("Invalid input data");
  }

  await connectDB();
  try {
    const user = await User.findOne({ email: data.email });
    if (!user) {
      throw new Error("User not found");
    }

    const course = user.courses.find(
      (course: any) => course.name === data.courseId
    );
    if (!course) {
      throw new Error("Course not found");
    }

    course.minAttendance = data.percentage;
    await user.save();
    return { success: true };
  } catch (error) {
    console.error("Error in updateSubjectPercentage:", error);
    throw error instanceof Error
      ? error
      : new Error("Failed to update subject percentage");
  }
}

export async function uploadTimeTable(data: { user: any; timeTable: any }) {
  await connectDB();

  try {
    const { user, timeTable } = data;
    const istOffset = 5.5 * 60 * 60 * 1000;
    const now = new Date(Date.now() + istOffset);

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

    const customTimeTable = new TimeTable({
      ...timeTable,
    });

    const result = await customTimeTable.save();

    if (result) {
      const customAttendance = new Attendance({
        class: user.branch + user.semester.toString(),
        custom: true,
        timeTable: result._id,
      });

      await customAttendance.save();

      // Get attendance records for each day
      const daySchedules = getDaySchedules(user.courseStartDate, now);
      const attendanceRecords = daySchedules.flatMap((schedule: any) =>
        schedule.dates.map((date: any) => ({
          date,
          dayTimeTable: result.events
            .filter((event: any) => event.day === schedule.day)
            .map((event: any) => {
              const timeSlot = result
                .toObject()
                .timeSlots.find((slot: any) => slot.slotId === event.slotId);

              return {
                ...event.toObject(),
                display: timeSlot?.display || "",
                attendance: "pending",
                custom: false, // Add flag for custom events
              };
            }),
        }))
      );

      // Validate attendance records
      if (!attendanceRecords.length) {
        throw new Error("No attendance records generated");
      }

      const userData = {
        name: user.fullName,
        email: user.email,
        imageUrl: user.imageUrl,
        branch: user.branch,
        section: user.semester,
        courseStart: user.courseStartDate,
        courseEnd: user.courseEndDate,
        minAttendance: user.minAttendance,
        timeTable: result._id,
        courses: result.courses.map((course: any) => ({
          ...course.toObject(),
        })),
        attendance: attendanceRecords,
      };

      if (!existingUser) {
        const newUser = new User(userData);
        await newUser.save();
        return {
          success: true,
          message: "User created with attendance records",
        };
      } else {
        // Update existing user
        Object.assign(existingUser, userData);
        await existingUser.save();
        return {
          success: true,
          message: "User updated with new attendance records",
        };
      }
    }
  } catch (error) {
    console.error("Error uploading timetable:", error);
    throw error;
  }
}

export async function uploadAttendance(data: AttendanceData) {
  await connectDB();

  try {
    const attendance = new Attendance(data);
    await attendance.save();
    return { success: true, attendanceId: attendance._id };
  } catch (error) {
    console.error("Error uploading attendance:", error);
    throw error;
  }
}

export async function uploadUser(data: UserData) {
  await connectDB();

  try {
    const existingUser = await User.findOne({ email: data.email });

    if (existingUser) {
      // Update existing user
      Object.assign(existingUser, data);
      await existingUser.save();
      return { success: true, userId: existingUser._id, updated: true };
    } else {
      // Create new user
      const user = new User(data);
      await user.save();
      return { success: true, userId: user._id, updated: false };
    }
  } catch (error) {
    console.error("Error uploading user:", error);
    throw error;
  }
}

export async function updateUserAttendance(
  userId: string,
  attendanceData: { date: Date; timeTable: string }
) {
  await connectDB();

  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    user.attendance.push(attendanceData);
    await user.save();
    return { success: true };
  } catch (error) {
    console.error("Error updating user attendance:", error);
    throw error;
  }
}
