import nodemailer from "nodemailer";
import Email from "../models/Email.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function buildTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendBulkMail(req, res) {
  const { subject, body, recipients } = req.body;

  if (!subject || !subject.trim()) {
    return res.status(400).json({ error: "Subject is required." });
  }
  if (!body || !body.trim()) {
    return res.status(400).json({ error: "Email body is required." });
  }
  if (!Array.isArray(recipients) || recipients.length === 0) {
    return res.status(400).json({ error: "At least one recipient is required." });
  }

  const invalid = recipients.filter((r) => !EMAIL_PATTERN.test(r.trim()));
  if (invalid.length > 0) {
    return res.status(400).json({
      error: `Invalid recipient email(s): ${invalid.join(", ")}`,
    });
  }

  const transporter = buildTransporter();
  const failedRecipients = [];

  // Sent individually (not one message with everyone in "to") so a bad
  // address for one person doesn't block delivery to the rest, and so we
  // can report exactly who failed.
  for (const recipient of recipients) {
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: recipient.trim(),
        subject: subject.trim(),
        text: body,
      });
    } catch (error) {
      console.error(`Failed to send to ${recipient}:`, error.message);
      failedRecipients.push(recipient.trim());
    }
  }

  let status = "sent";
  if (failedRecipients.length === recipients.length) status = "failed";
  else if (failedRecipients.length > 0) status = "partial";

  const record = await Email.create({
    subject: subject.trim(),
    body,
    recipients: recipients.map((r) => r.trim()),
    status,
    failedRecipients,
    errorMessage:
      failedRecipients.length > 0
        ? `Delivery failed for: ${failedRecipients.join(", ")}`
        : "",
  });

  const httpStatus = status === "failed" ? 502 : 200;

  return res.status(httpStatus).json({
    message:
      status === "sent"
        ? `Sent to all ${recipients.length} recipient(s).`
        : status === "partial"
        ? `Sent to ${recipients.length - failedRecipients.length} of ${recipients.length} recipient(s). Some failed.`
        : "Delivery failed for every recipient.",
    ...(status === "failed" && {
      error: "No emails were delivered. Check SMTP settings and network access to the mail server; Gmail requires an App Password.",
    }),
    record,
  });
}

export async function getHistory(req, res) {
  const records = await Email.find().sort({ createdAt: -1 }).limit(50);
  return res.status(200).json({ records });
}
