import "dotenv/config";
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import mailRoutes from "./routes/mailRoutes.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Simple request log — enough to see what's hitting the API during dev.
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRoutes);
app.use("/api/mail", mailRoutes);

// Catch anything that slipped past a route's own error handling.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong on the server." });
});

if (process.env.VERCEL !== "1") {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`Bulk mail API running on http://localhost:${PORT}`);
    });
  });
}

export default app;
