import jwt from "jsonwebtoken";

// Single static admin account, read from environment — matches the
// assignment's "no database needed for auth" scope. Swap this for a real
// Admin collection + hashed passwords if you need more than one admin.
export function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const validEmail = email.trim().toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase();
  const validPassword = password === process.env.ADMIN_PASSWORD;

  if (!validEmail || !validPassword) {
    return res.status(401).json({ error: "Incorrect email or password." });
  }

  const token = jwt.sign(
    { email: process.env.ADMIN_EMAIL, role: "admin" },
    process.env.JWT_SECRET,
    { expiresIn: "8h" }
  );

  return res.status(200).json({
    message: "Login successful.",
    token,
    admin: { email: process.env.ADMIN_EMAIL },
  });
}
