import mongoose from "mongoose";

const emailSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true },
    body: { type: String, required: true },
    recipients: {
      type: [String],
      required: true,
      validate: (list) => list.length > 0,
    },
    status: {
      type: String,
      enum: ["sent", "failed", "partial"],
      required: true,
    },
    failedRecipients: { type: [String], default: [] },
    errorMessage: { type: String, default: "" },
  },
  { timestamps: true } // gives us createdAt for the history list
);

export default mongoose.model("Email", emailSchema);
