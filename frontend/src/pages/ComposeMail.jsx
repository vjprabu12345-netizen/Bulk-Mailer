import React, { useState } from "react";
import Navbar from "../components/Navbar";
import RecipientInput from "../components/RecipientInput";
import StatusBanner from "../components/StatusBanner";
import client from "../api/client";
import "./ComposeMail.css";

export default function ComposeMail() {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [recipients, setRecipients] = useState([]);
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState(null); // { type, message }
  const [isSending, setIsSending] = useState(false);

  const validate = () => {
    const nextErrors = {};
    if (!subject.trim()) nextErrors.subject = "Subject can't be empty.";
    if (!body.trim()) nextErrors.body = "Write something in the email body.";
    if (recipients.length === 0) nextErrors.recipients = "Add at least one recipient.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBanner(null);
    if (!validate()) return;

    setIsSending(true);
    try {
      const response = await client.post("/mail/send", { subject, body, recipients });
      const record = response.data.record;
      setBanner({
        type: record.status === "sent" ? "success" : "warning",
        message: response.data.message,
      });
      setSubject("");
      setBody("");
      setRecipients([]);
      setErrors({});
    } catch (error) {
      setBanner({
        type: "error",
        message: error.response?.data?.error || "Couldn't send — check the server and try again.",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="compose-page">
      <Navbar />

      <main className="compose-main">
        <h1>Compose campaign</h1>
        <p className="compose-sub">Send one email to a list of recipients and log the result.</p>

        <StatusBanner type={banner?.type} message={banner?.message} />

        <form className="compose-form" onSubmit={handleSubmit} noValidate>
          <div className="compose-field">
            <label htmlFor="subject">Subject</label>
            <input
              id="subject"
              type="text"
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                setErrors((prev) => ({ ...prev, subject: "" }));
              }}
              placeholder="e.g. Your October product update"
            />
            {errors.subject && <p className="compose-error">{errors.subject}</p>}
          </div>

          <RecipientInput
            recipients={recipients}
            onChange={(next) => {
              setRecipients(next);
              setErrors((prev) => ({ ...prev, recipients: "" }));
            }}
            error={errors.recipients}
          />

          <div className="compose-field">
            <label htmlFor="body">Email body</label>
            <textarea
              id="body"
              rows={10}
              value={body}
              onChange={(e) => {
                setBody(e.target.value);
                setErrors((prev) => ({ ...prev, body: "" }));
              }}
              placeholder="Write the message that will be sent to every recipient…"
            />
            {errors.body && <p className="compose-error">{errors.body}</p>}
          </div>

          <button type="submit" className="compose-submit" disabled={isSending}>
            {isSending
              ? `Sending to ${recipients.length || 0}…`
              : `Send to ${recipients.length || 0} recipient${recipients.length === 1 ? "" : "s"}`}
          </button>
        </form>
      </main>
    </div>
  );
}
