import mongoose from "mongoose";
import { TimeTable, courseSchema } from "./attendance";
import "./requests";

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
      subject: {
        type: String,
        default: null,
      },
      fileId: {
        type: String,
        required: true,
      },
      fileName: {
        type: String,
        required: true,
      },
      webViewLink: {
        type: String,
        required: true,
      },
      webContentLink: {
        type: String,
        required: true,
      },
      description: {
        type: String,
        default: null,
      },
      docType: {
        type: String,
        required: true,
      },
      contributedTo: {
        type: String,
        default: null,
      },
      uploadSessionId: {
        type: String,
        required: true,
      },
      semester: {
        type: String,
        required: true,
      },
      branch: {
        type: String,
        required: true,
      },
      subjectCode: {
        type: String,
        required: true,
      },
      rejectionComment: {
        type: String,
        default: null,
      },
      status: {
        type: String,
        enum: ["pending", "reviewing", "approved", "rejected"],
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
  },
  attendance: [
    {
      date: String,
      dayTimeTable: [
        {
          type: Object,
        },
      ],
    },
  ],
  courses: [courseSchema],
  requests: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Request",
    },
  ],
});

const User = mongoose.models.User || mongoose.model("User", userSchema);

if (User.collection) {
  User.collection.dropIndex("attendance.date_1").catch(() => {
    // Ignore error if index doesn't exist
  });
}

export default User;
