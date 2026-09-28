import { createHmac, randomBytes, randomInt, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import AdminCredential from "../models/AdminCredential.js";

const scrypt = promisify(scryptCallback);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const key = await scrypt(password, salt, 64);
  return `${salt}:${key.toString("hex")}`;
}

async function verifyPassword(password, storedHash) {
  const [salt, keyHex] = storedHash.split(":");
  if (!salt || !keyHex) return false;
  const expectedKey = Buffer.from(keyHex, "hex");
  const actualKey = await scrypt(password, salt, expectedKey.length);
  return actualKey.length === expectedKey.length && timingSafeEqual(actualKey, expectedKey);
}

function hashResetCode(email, code) {
  return createHmac("sha256", process.env.JWT_SECRET)
    .update(`${email}:${code}`)
    .digest("hex");
}

// Single static admin account, read from environment — matches the
// assignment's "no database needed for auth" scope. Swap this for a real
// Admin collection + hashed passwords if you need more than one admin.
export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const adminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const normalizedEmail = email.trim().toLowerCase();
  const validEmail = normalizedEmail === adminEmail;
  const credential = validEmail ? await AdminCredential.findOne({ email: adminEmail }) : null;
  const validPassword = credential?.passwordHash
    ? await verifyPassword(password, credential.passwordHash)
    : password === process.env.ADMIN_PASSWORD;

  if (!validEmail || !validPassword) {
    return res.status(401).json({ error: "Incorrect email or password." });
  }

  const token = jwt.sign(
    { email: adminEmail, role: "admin" },
    process.env.JWT_SECRET,
    { expiresIn: "8h" }
  );

  return res.status(200).json({
    message: "Login successful.",
    token,
    admin: { email: adminEmail },
  });
}

export async function requestPasswordReset(req, res) {
  const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  if (!EMAIL_PATTERN.test(email)) {
    return res.status(400).json({ error: "Enter a valid email address." });
  }

  const adminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const genericMessage = "If that admin email exists, a reset code has been sent.";
  if (email !== adminEmail) return res.status(200).json({ message: genericMessage });

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const resetCodeHash = hashResetCode(email, code);
  const resetCodeExpires = new Date(Date.now() + 10 * 60 * 1000);

  await AdminCredential.findOneAndUpdate(
    { email },
    { $set: { resetCodeHash, resetCodeExpires, resetAttempts: 0 } },
    { upsert: true }
  );

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: adminEmail,
      subject: "Your Bulk Mailer password reset code",
      text: `Your password reset code is ${code}. It expires in 10 minutes.`,
    });
    return res.status(200).json({ message: genericMessage });
  } catch (error) {
    await AdminCredential.updateOne(
      { email, resetCodeHash },
      { $unset: { resetCodeHash: "", resetCodeExpires: "" } }
    );
    console.error("Password reset email failed:", error.message);
    return res.status(503).json({ error: "Could not send a reset code. Check the SMTP settings and try again." });
  }
}

export async function resetPassword(req, res) {
  const { code, password } = req.body;
  const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  if (!EMAIL_PATTERN.test(email) || typeof code !== "string" || !/^\d{6}$/.test(code)) {
    return res.status(400).json({ error: "Enter the email and 6-digit reset code." });
  }
  if (typeof password !== "string" || password.length < 8) {
    return res.status(400).json({ error: "Choose a password with at least 8 characters." });
  }

  const resetCodeHash = hashResetCode(email, code);
  const credential = await AdminCredential.findOne({
    email,
    resetCodeExpires: { $gt: new Date() },
    resetAttempts: { $lt: 5 },
  });
  if (!credential?.resetCodeHash) {
    return res.status(400).json({ error: "That reset code is invalid or expired." });
  }

  const expectedHash = Buffer.from(credential.resetCodeHash, "hex");
  const submittedHash = Buffer.from(resetCodeHash, "hex");
  if (!timingSafeEqual(expectedHash, submittedHash)) {
    await AdminCredential.updateOne(
      {
        email,
        resetCodeHash: credential.resetCodeHash,
        resetCodeExpires: { $gt: new Date() },
        resetAttempts: { $lt: 5 },
      },
      { $inc: { resetAttempts: 1 } }
    );
    return res.status(400).json({ error: "That reset code is invalid or expired." });
  }

  const passwordHash = await hashPassword(password);
  const updated = await AdminCredential.findOneAndUpdate(
    { email, resetCodeHash, resetCodeExpires: { $gt: new Date() }, resetAttempts: { $lt: 5 } },
    {
      $set: { passwordHash },
      $unset: { resetCodeHash: "", resetCodeExpires: "", resetAttempts: "" },
    }
  );
  if (!updated) {
    return res.status(400).json({ error: "That reset code is invalid or expired." });
  }

  return res.status(200).json({ message: "Password updated. You can now sign in." });
}
