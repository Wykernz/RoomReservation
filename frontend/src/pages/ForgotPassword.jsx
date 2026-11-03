import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabase";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/login`,
    });
    setMessage(error ? error.message : "✅ Check your email for a reset link.");
  }

  return (
    <div style={{ maxWidth: 420, margin: "80px auto", padding: 24 }}>
      <h2>Forgot password?</h2>
      {message && <div className="alert">{message}</div>}

      <form onSubmit={handleSubmit}>
        <label>Email</label>
        <input type="email" value={email}
               onChange={(e) => setEmail(e.target.value)} required />

        <button className="btn success" type="submit" style={{ marginTop: 16 }}>
          Send Reset Email
        </button>
      </form>

      <p><Link to="/login">Back to login</Link></p>
    </div>
  );
}