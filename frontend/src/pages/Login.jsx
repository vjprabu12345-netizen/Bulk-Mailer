import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const response = await client.post("/auth/login", formData);
      localStorage.setItem("bulkmail_token", response.data.token);
      localStorage.setItem("bulkmail_admin", JSON.stringify(response.data.admin));
      navigate("/");
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
        <p className="login-sub">Sign in to compose and send campaigns.</p>

        {serverError && <p className="login-server-error">{serverError}</p>}

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

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Signing in…" : "Sign In"}
        </button>
      </form>
    </div>
  );
}
