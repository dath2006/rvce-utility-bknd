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

export async function getStats(email: string) {
  if (!email || typeof email !== "string") {
    throw new Error("Invalid email provided");
  }

  await connectDB();
  try {
    const user = await User.findOne({ email }).populate("timeTable");
    if (!user) {
      throw new Error("User not found");
    }

    if (!user.timeTable) {
      throw new Error("Timetable not found for user");
    }

    const attendance = user.attendance;
    let attendanceState = [] as {
      courseId: string;
      pending: number;
      absent: number;
      present: number;
      ignore: number;
      totalClasses: number;
    }[];

    if (!user.courseStart || !user.courseEnd) {
      throw new Error("Course start or end date not found");
    }

    const dayCount = getClasses(user.courseStart, user.courseEnd);

    attendance.forEach((ele: any) => {
      if (!ele.dayTimeTable) {
        console.warn(`Missing dayTimeTable for date: ${ele.date}`);
        return;
      }

      ele.dayTimeTable.forEach((course: any) => {
        if (!course.courseId) {
          console.warn("Course without courseId found");
          return;
        }

        const existingCourse = attendanceState.find(
          (el: any) => el.courseId === course.courseId
        );

        if (existingCourse) {
          switch (course.attendance) {
            case "pending":
              existingCourse.pending++;
              break;
            case "absent":
              existingCourse.absent++;
              break;
            case "present":
              existingCourse.present++;
              break;
            case "ignore":
              existingCourse.ignore++;
              break;
            default:
              console.warn(`Invalid attendance status: ${course.attendance}`);
          }
        } else {
          const newCourse = {
            courseId: course.courseId,
            pending: 0,
            absent: 0,
            present: 0,
            ignore: 0,
            totalClasses: 0,
          };

          switch (course.attendance) {
            case "pending":
              newCourse.pending = 1;
              break;
            case "absent":
              newCourse.absent = 1;
              break;
            case "present":
              newCourse.present = 1;
              break;
            case "ignore":
              newCourse.ignore = 1;
              break;
            default:
              console.warn(`Invalid attendance status: ${course.attendance}`);
          }

          attendanceState.push(newCourse);
        }
      });
    });

    if (!user.timeTable.events) {
      throw new Error("No events found in timetable");
    }

    user.timeTable.events.forEach((event: any) => {
      if (!event.courseId) {
        console.warn("Event without courseId found");
        return;
      }

      const existingCourse = attendanceState.find(
        (el: any) => el.courseId === event.courseId
      );

      if (!existingCourse) {
        attendanceState.push({
          courseId: event.courseId,
          pending: 0,
          absent: 0,
          present: 0,
          ignore: 0,
          totalClasses: 0,
        });
      }
    });

    dayCount.forEach((day: any) => {
      if (!day.day) {
        console.warn("Day without day name found");
        return;
      }

      const dayEvents = user.timeTable.events.filter(
        (event: any) => event.day === day.day
      );

      dayEvents.forEach((event: any) => {
        if (!event.courseId) {
          console.warn("Event without courseId found");
          return;
        }

        const courseStats = attendanceState.find(
          (stats: any) => stats.courseId === event.courseId
        );

        if (courseStats) {
          courseStats.totalClasses += day.count;

          const customEvents = user.attendance
            .filter((record: any) => {
              if (!record.date) {
                console.warn("Record without date found");
                return false;
              }
              const recordDate = new Date(record.date);
              const recordDay = recordDate
                .toDateString()
                .split(" ")[0]
                .toUpperCase();
              return recordDay === day.day;
            })
            .flatMap((record: any) =>
              record.dayTimeTable.filter(
                (event: any) =>
                  event.custom && event.courseId === courseStats.courseId
              )
            );

          courseStats.totalClasses += customEvents.length;
        }
      });
    });

    const dayEvents = user.attendance.filter((event: any) => {
      if (!event.date) {
        console.warn("Event without date found");
        return false;
      }
      const date = new Date(event.date)
        .toDateString()
        .split(" ")[0]
        .toUpperCase();
      return date === "SAT" || date === "SUN";
    });

    dayEvents?.forEach((event: any) => {
      if (!event.dayTimeTable) {
        console.warn(`Missing dayTimeTable for date: ${event.date}`);
        return;
      }

      event.dayTimeTable?.forEach((ele: any) => {
        if (!ele.courseId) {
          console.warn("Course without courseId found");
          return;
        }

        const courseStats = attendanceState.find(
          (stats: any) => stats.courseId === ele.courseId && ele.custom
        );
        if (courseStats) {
          courseStats.totalClasses += 1;
        }
      });
    });

    const overallAttendanceState = {
      present: 0,
      absent: 0,
      pending: 0,
      ignore: 0,
      attendancePercent: 0,
      totalClasses: 0,
    };

    attendanceState.forEach((course: any) => {
      overallAttendanceState.present += course.present;
      overallAttendanceState.absent += course.absent;
      overallAttendanceState.pending += course.pending;
      overallAttendanceState.ignore += course.ignore;
      overallAttendanceState.totalClasses += course.totalClasses;
    });

    const totalAttendedClasses =
      overallAttendanceState.present + overallAttendanceState.absent;
    if (totalAttendedClasses > 0) {
      overallAttendanceState.attendancePercent = Math.round(
        (overallAttendanceState.present / totalAttendedClasses) * 100
      );
    }

    if (!user.courses) {
      throw new Error("No courses found for user");
    }

    attendanceState = attendanceState.map((course: any) => {
      const courseInfo = user.courses.find(
        (el: any) => el.name === course.courseId
      );
      const minAttendance = courseInfo?.minAttendance || user.minAttendance;

      if (typeof minAttendance !== "number") {
        console.warn(`Invalid minAttendance for course: ${course.courseId}`);
        return {
          ...course,
          minAttendance: 0,
          attendancePercentage: 0,
          isEligible: false,
          classCount: { requiredPresent: 0, allowedAbsent: 0 },
        };
      }

      const totalAttended = course.present + course.absent;

      return {
        ...course,
        minAttendance,
        attendancePercentage:
          totalAttended > 0
            ? Math.round((course.present / totalAttended) * 100)
            : 0,
        isEligible:
          totalAttended > 0
            ? (course.present / totalAttended) * 100 >= minAttendance
            : false,
        classCount: getClassCount(minAttendance, course.present, course.absent),
      };
    });

    return { success: true, attendanceState, overallAttendanceState };
  } catch (error) {
    console.error("Error in getStats:", error);
    throw error instanceof Error
      ? error
      : new Error("Failed to fetch statistics");
  }
}

const getClasses = (courseStart: Date, courseEnd: Date) => {
  if (!courseStart || !courseEnd) {
    throw new Error("Invalid course dates provided");
  }

  const sDate = new Date(courseStart);
  const eDate = new Date(courseEnd);
  const arr = [] as { day: string; count: number }[];

  if (sDate > eDate) {
    throw new Error("Course start date cannot be after end date");
  }

  function main() {
    const temp = sDate.toDateString().split(" ")[0].toUpperCase();
    const found = arr.find((el: any) => el.day === temp);
    if (found) {
      found.count++;
    } else {
      arr.push({ day: temp, count: 1 });
    }
    sDate.setDate(sDate.getDate() + 1);
  }

  while (sDate.getTime() <= eDate.getTime()) {
    main();
  }
  return arr;
};

interface AttendanceCount {
  requiredPresent?: number;
  allowedAbsent?: number;
}

const getClassCount = (
  minAtt: number,
  present: number,
  absent: number
): AttendanceCount => {
  if (
    typeof minAtt !== "number" ||
    typeof present !== "number" ||
    typeof absent !== "number"
  ) {
    throw new Error("Invalid input parameters for getClassCount");
  }

  if (minAtt < 0 || minAtt > 100) {
    throw new Error("Minimum attendance must be between 0 and 100");
  }

  if (present < 0 || absent < 0) {
    throw new Error("Present and absent counts cannot be negative");
  }

  const totalClassesHeld = present + absent;

  if (totalClassesHeld === 0) {
    return { requiredPresent: 0, allowedAbsent: 0 };
  }

  // Calculate required present classes to meet minimum attendance
  let requiredPresent = 0;
  let allowedAbsent = 0;

  const currentAttendancePercentage = (present / totalClassesHeld) * 100;

  if (currentAttendancePercentage < minAtt) {
    // If current attendance is below the requirement
    // We need to solve: (present + x) / (totalClassesHeld + x) >= minAtt/100
    // This simplifies to: x >= (minAtt*totalClassesHeld - 100*present) / (100 - minAtt)

    if (minAtt === 100) {
      // If 100% attendance is required, student needs to attend all absences plus one
      requiredPresent = absent + 1;
      allowedAbsent = 0;
    } else {
      const additionalRequired = Math.ceil(
        (minAtt * totalClassesHeld - 100 * present) / (100 - minAtt)
      );
      requiredPresent = additionalRequired;
      allowedAbsent = 0;
    }
  } else {
    // If current attendance is already meeting the requirement
    // Calculate how many more classes can be missed while maintaining minimum attendance
    // Let's say the student can afford to miss x more classes.
    // We solve: present / (totalClassesHeld + x) >= minAtt/100
    // This simplifies to: x <= (present * 100 / minAtt) - totalClassesHeld

    if (minAtt === 0) {
      requiredPresent = 0;
      allowedAbsent = Number.POSITIVE_INFINITY; // Can miss infinite classes if 0% attendance is required
    } else {
      requiredPresent = 0;
      const maxAbsences = Math.floor(
        (present * 100) / minAtt - totalClassesHeld
      );
      allowedAbsent = maxAbsences;
    }
  }

  return { requiredPresent, allowedAbsent };
};
