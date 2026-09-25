import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import client from "../api/client";
import "./History.css";

const STATUS_LABEL = {
  sent: "Sent",
  partial: "Partial",
  failed: "Failed",
};

export default function History() {
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    client
      .get("/mail/history")
      .then((response) => {
        if (!cancelled) setRecords(response.data.records);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load history — check the server and try again.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="history-page">
      <Navbar />

      <main className="history-main">
        <h1>Sent history</h1>
        <p className="history-sub">The last 50 campaigns, most recent first.</p>

        {isLoading && <p className="history-status">Loading…</p>}
        {error && <p className="history-status history-status-error">{error}</p>}

        {!isLoading && !error && records.length === 0 && (
          <p className="history-status">No campaigns sent yet.</p>
        )}

        {!isLoading && !error && records.length > 0 && (
          <div className="history-list">
            {records.map((record) => (
              <article className="history-card" key={record._id}>
                <div className="history-card-top">
                  <h2>{record.subject}</h2>
                  <span className={`history-badge history-badge-${record.status}`}>
                    {STATUS_LABEL[record.status]}
                  </span>
                </div>
                <p className="history-meta">
                  {record.recipients.length} recipient{record.recipients.length === 1 ? "" : "s"}
                  {" · "}
                  {new Date(record.createdAt).toLocaleString()}
                </p>
                {record.failedRecipients.length > 0 && (
                  <p className="history-failed">
                    Failed for: {record.failedRecipients.join(", ")}
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
