import mongoose from "mongoose";

const contributorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  resources: [
    {
      fileId: String,
      fileType: {
        type: String,
        required: true,
        enum: ["Notes", "QP", "Other", "Lab", "Textbook"],
      },
    },
  ],
  github: {
    type: String,
    default: null,
  },
});

const Contributors =
  mongoose.models.Contributors ||
  mongoose.model("Contributors", contributorSchema);

export default Contributors;
