import mongoose from "mongoose";

let connectionPromise;

export default async function connectDB() {
  if (mongoose.connection.readyState === 1) return;

  if (!connectionPromise) {
    connectionPromise = mongoose.connect(process.env.MONGO_URI).then(() => {
      console.log("MongoDB connected");
    }).catch((error) => {
      connectionPromise = undefined;
      console.error("MongoDB connection failed:", error.message);
      throw error;
    });
  }

  return connectionPromise;
}
