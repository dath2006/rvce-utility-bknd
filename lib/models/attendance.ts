import mongoose from "mongoose";

// Time Slot Schema
const timeSlotSchema = new mongoose.Schema({
  slotId: {
    type: String,
    required: true,
  },
  display: {
    type: String,
    required: true,
  },
  start: {
    type: Number, // minutes from midnight
    required: true,
  },
  end: {
    type: Number, // minutes from midnight
    required: true,
  },
});

// Course Schema
const courseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  fullName: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["theory", "lab", "session"],
    required: true,
  },
  instructor: {
    type: String,
    default: "TBD",
  },
  parentCourse: {
    type: String,
    default: null,
  },
  minAttendance: {
    type: Number,
    default: 85,
  },
});

// Event Schema
const eventSchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ["MON", "TUE", "WED", "THU", "FRI"],
    required: true,
  },
  dayIndex: {
    type: Number,
    required: true,
    min: 0,
    max: 4,
  },
  courseId: {
    type: String,
    required: true,
  },
  slotId: {
    type: String,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
    min: 1,
    max: 2,
  },
  attendance: {
    type: String,
    enum: ["pending", "present", "absent", "ignore"],
    default: "pending",
  },
  description: {
    type: String,
    default: "",
  },
});

// Create indexes for better query performance
eventSchema.index({ day: 1, dayIndex: 1 });
eventSchema.index({ courseId: 1 });
eventSchema.index({ slotId: 1 });

const timeTableSchema = new mongoose.Schema({
  timeSlots: [timeSlotSchema],
  courses: [courseSchema],
  events: [eventSchema],
});

const attendanceSchema = new mongoose.Schema({
  class: {
    type: String,
    required: true,
  },
  custom: {
    type: Boolean,
    default: false,
  },
  timeTable: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TimeTable",
    required: true,
  },
});

const TimeTable =
  mongoose.models.TimeTable || mongoose.model("TimeTable", timeTableSchema);
const Attendance =
  mongoose.models.Attendance || mongoose.model("Attendance", attendanceSchema);

export { Attendance, TimeTable, courseSchema };
