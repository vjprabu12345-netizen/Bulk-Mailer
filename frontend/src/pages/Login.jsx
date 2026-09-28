import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState("login");
  const [resetData, setResetData] = useState({ code: "", password: "" });

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (mode === "reset" && name in resetData) {
      setResetData((prev) => ({ ...prev, [name]: value }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const errors = {};
    if (!formData.email.trim()) errors.email = "Enter the admin email.";
    if (!formData.password) errors.password = "Enter the password.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setServerError("");
    setStatusMessage("");

    if (!formData.email.trim()) {
      setFieldErrors({ email: "Enter the admin email." });
      return;
    }
    if (mode === "login" && !validate()) return;
    if (mode === "reset" && !/^\d{6}$/.test(resetData.code)) {
      setFieldErrors({ code: "Enter the 6-digit code from your email." });
      return;
    }
    if (mode === "reset" && resetData.password.length < 8) {
      setFieldErrors({ password: "Use at least 8 characters for your new password." });
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === "login") {
        const response = await client.post("/auth/login", formData);
        localStorage.setItem("bulkmail_token", response.data.token);
        localStorage.setItem("bulkmail_admin", JSON.stringify(response.data.admin));
        navigate("/");
      } else if (mode === "request") {
        const response = await client.post("/auth/forgot-password", { email: formData.email });
        setMode("reset");
        setStatusMessage(response.data.message);
      } else {
        const response = await client.post("/auth/reset-password", {
          email: formData.email,
          ...resetData,
        });
        setMode("login");
        setResetData({ code: "", password: "" });
        setFormData((prev) => ({ ...prev, password: "" }));
        setStatusMessage(response.data.message);
      }
    } catch (error) {
      setServerError(
        error.response?.data?.error || "Couldn't reach the server. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit} noValidate>
        <p className="login-eyebrow">Admin access</p>
        <h1>Bulk Mailer</h1>
        <p className="login-sub">
          {mode === "login" ? "Sign in to compose and send campaigns." : "Reset your admin password."}
        </p>

        {serverError && <p className="login-server-error">{serverError}</p>}
        {statusMessage && <p className="login-status-message" role="status">{statusMessage}</p>}

        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          autoComplete="username"
        />
        {fieldErrors.email && <p className="login-field-error">{fieldErrors.email}</p>}

        {mode === "login" && (
          <>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="current-password"
            />
            {fieldErrors.password && <p className="login-field-error">{fieldErrors.password}</p>}
          </>
        )}

        {mode === "reset" && (
          <>
            <label htmlFor="code">Reset code</label>
            <input
              id="code"
              name="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={resetData.code}
              onChange={handleChange}
            />
            {fieldErrors.code && <p className="login-field-error">{fieldErrors.code}</p>}
            <label htmlFor="password">New password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={resetData.password}
              onChange={handleChange}
            />
            {fieldErrors.password && <p className="login-field-error">{fieldErrors.password}</p>}
          </>
        )}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Please waitâ€¦"
            : mode === "login"
            ? "Sign In"
            : mode === "request"
            ? "Send reset code"
            : "Update password"}
        </button>
        {mode === "login" ? (
          <button
            className="login-text-button"
            type="button"
            onClick={() => {
              setMode("request");
              setServerError("");
              setStatusMessage("");
            }}
          >
            Forgot password?
          </button>
        ) : (
          <button
            className="login-text-button"
            type="button"
            onClick={() => {
              setMode("login");
              setServerError("");
              setStatusMessage("");
              setFieldErrors({});
            }}
          >
            Back to sign in
          </button>
        )}
      </form>
    </div>
  );
}
