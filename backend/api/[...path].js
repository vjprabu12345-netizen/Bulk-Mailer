import app from "../server.js";
import connectDB from "../config/db.js";

export default async function handler(req, res) {
  try {
    await connectDB();
    app(req, res);
  } catch (error) {
    console.error("API request failed:", error.message);
    res.status(500).json({ error: "The API could not connect to its database." });
  }
}