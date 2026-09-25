import React from "react";
import "./StatusBanner.css";

export default function StatusBanner({ type = "success", message }) {
  if (!message) return null;

  return (
    <div className={`status-banner status-${type}`} role="status">
      <span className="status-icon">{type === "success" ? "✓" : "!"}</span>
      {message}
    </div>
  );
}
