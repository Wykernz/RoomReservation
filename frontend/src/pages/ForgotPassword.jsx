import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabase";
import ThemeToggle from "../components/ThemeToggle";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setBusy(true);

    if (!/^[\w.%+-]+@gmail\.com$/i.test(email.trim())) {
      setError(true);
      setMessage("Please enter a valid @gmail.com email.");
      setBusy(false);
      return;
    }

    const { error: requestError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setError(Boolean(requestError));
    setMessage(requestError?.message || "Check your email for a password reset link.");
    setBusy(false);
  }

  return (
    <main className="app-page">
      <header className="container page-header">
        <Link className="brand" to="/"><span className="brand-mark">R</span>Room Reservation</Link>
        <ThemeToggle />
      </header>
      <div className="container auth-wrap">
        <section className="card auth-card">
          <span className="eyebrow">Account recovery</span>
          <h1>Forgot your password?</h1>
          <p>Enter your account email and we’ll send you a secure reset link.</p>
          {message && <div className={`alert ${error ? "error" : "success"}`} role="status">{message}</div>}
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="recovery-email">Email</label>
              <input id="recovery-email" type="email" placeholder="you@gmail.com"
                value={email} onChange={(event) => setEmail(event.target.value)} required />
            </div>
            <button className="button" type="submit" disabled={busy}>
              {busy ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
          <p className="auth-footer"><Link to="/login">Back to login</Link></p>
        </section>
      </div>
    </main>
  );
}
