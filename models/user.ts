import mongoose from "mongoose";
import { TimeTable, courseSchema } from "./attendance";

const userSchema = new mongoose.Schema({
  name: String,
  email: {
    type: String,
    required: true,
    unique: true,
  },
  imageUrl: String,
  contribution: [
    {
      subject: String,
      file: String,
      approved: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
      },
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  branch: String,
  section: String,
  courseStart: Date,
  courseEnd: Date,
  minAttendance: Number,
  timeTable: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TimeTable",
    required: true,
  },
  attendance: [
    {
      date: {
        type: String,
        unique: true,
      },
      dayTimeTable: [
        {
          type: Object,
          required: true,
        },
      ],
    },
  ],
  courses: [courseSchema],
});

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
