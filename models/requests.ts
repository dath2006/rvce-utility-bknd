import mongoose from "mongoose";

const requestSchema = new mongoose.Schema({
  user: {
    type: String,
    required: true,
  },
  branch: {
    type: String,
    required: true,
  },
  semester: {
    type: String,
    required: true,
  },
  postedAt: {
    type: Date,
    default: Date.now,
  },
  subject: {
    type: String,
    required: true,
  },
  subjectCode: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "reviewing", "completed"],
    default: "pending",
  },
  documents: [
    {
      name: {
        type: String,
        required: true,
      },
      type: {
        type: String,
        required: true,
        enum: ["Notes", "QP", "Other", "Lab", "Textbook"],
      },
      description: {
        type: String,
        default: null,
      },
      files: [
        {
          contributedBy: {
            type: String,
            default: null,
            required: true,
          },
          contributedAt: {
            type: Date,
            default: null,
            required: true,
          },
          status: {
            type: String,
            enum: ["pending", "reviewing", "approved", "rejected"],
            default: "pending",
            required: true,
          },
          fileName: {
            type: String,
            default: null,
            required: true,
          },
          fileId: {
            type: String,
            default: null,
            required: true,
          },
          webViewLink: {
            type: String,
            default: null,
            required: true,
          },
          webContentLink: {
            type: String,
            default: null,
            required: true,
          },
          rejectionComment: {
            type: String,
            default: null,
          },
        },
      ],
    },
  ],
});

const Request =
  mongoose.models.Request || mongoose.model("Request", requestSchema);

export default Request;
