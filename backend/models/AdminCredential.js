import mongoose from "mongoose";

const adminCredentialSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, default: "" },
  resetCodeHash: { type: String, default: "" },
  resetCodeExpires: { type: Date, default: null },
  resetAttempts: { type: Number, default: 0 },
});

export default mongoose.model("AdminCredential", adminCredentialSchema);