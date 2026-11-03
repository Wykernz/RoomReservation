import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import ThemeToggle from "../components/ThemeToggle";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setMessage("Passwords do not match.");
      return;
    }

    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setMessage(error.message);
      setBusy(false);
      return;
    }
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
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
          <h1>Set a new password</h1>
          <p>Choose a password with at least six characters.</p>
          {message && <div className="alert error" role="alert">{message}</div>}
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="new-password">New password</label>
              <input id="new-password" type="password" autoComplete="new-password"
                value={password} onChange={(event) => setPassword(event.target.value)} required />
            </div>
            <div className="field">
              <label htmlFor="confirm-password">Confirm password</label>
              <input id="confirm-password" type="password" autoComplete="new-password"
                value={confirm} onChange={(event) => setConfirm(event.target.value)} required />
            </div>
            <button className="button" type="submit" disabled={busy}>
              {busy ? "Saving..." : "Update Password"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
