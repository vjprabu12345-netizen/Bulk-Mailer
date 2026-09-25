import React, { useState } from "react";
import "./RecipientInput.css";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RecipientInput({ recipients, onChange, error }) {
  const [draft, setDraft] = useState("");
  const [draftError, setDraftError] = useState("");

  const commitDraft = () => {
    const candidate = draft.trim().replace(/,$/, "");
    if (!candidate) return;

    if (!EMAIL_PATTERN.test(candidate)) {
      setDraftError(`"${candidate}" isn't a valid email.`);
      return;
    }
    if (recipients.includes(candidate)) {
      setDraftError("That address is already added.");
      return;
    }

    onChange([...recipients, candidate]);
    setDraft("");
    setDraftError("");
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      commitDraft();
    } else if (event.key === "Backspace" && !draft && recipients.length > 0) {
      onChange(recipients.slice(0, -1));
    }
  };

  const removeChip = (email) => {
    onChange(recipients.filter((r) => r !== email));
  };

  return (
    <div className="recipient-field">
      <label htmlFor="recipient-draft">Recipients</label>
      <div className={`recipient-box ${error ? "recipient-box-error" : ""}`}>
        {recipients.map((email) => (
          <span className="recipient-chip" key={email}>
            {email}
            <button
              type="button"
              aria-label={`Remove ${email}`}
              onClick={() => removeChip(email)}
            >
              ×
            </button>
          </span>
        ))}
        <input
          id="recipient-draft"
          type="text"
          value={draft}
          placeholder={recipients.length === 0 ? "Type an email and press Enter" : "Add another…"}
          onChange={(e) => {
            setDraft(e.target.value);
            setDraftError("");
          }}
          onKeyDown={handleKeyDown}
          onBlur={commitDraft}
        />
      </div>
      {(draftError || error) && (
        <p className="recipient-message" role="alert">
          {draftError || error}
        </p>
      )}
      <p className="recipient-hint">
        Press Enter or comma to add each address. {recipients.length} recipient
        {recipients.length === 1 ? "" : "s"} added.
      </p>
    </div>
  );
}
