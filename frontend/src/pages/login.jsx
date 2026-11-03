import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import ThemeToggle from "../components/ThemeToggle";

const rememberedEmail = localStorage.getItem("rr-remembered-email") || "";

export default function Login() {
  const [email, setEmail] = useState(rememberedEmail);
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(Boolean(rememberedEmail));
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) setMessage(error.message);
      else if (data.session) navigate("/dashboard", { replace: true });
    });
    return () => { active = false; };
  }, [navigate]);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setBusy(true);

    const cleanEmail = email.trim();
    if (!/^[\w.%+-]+@gmail\.com$/i.test(cleanEmail)) {
      setMessage("Please use a valid @gmail.com email address.");
      setBusy(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      setMessage(error.message);
    } else {
      if (remember) localStorage.setItem("rr-remembered-email", cleanEmail);
      else localStorage.removeItem("rr-remembered-email");
      navigate("/dashboard", { replace: true });
    }
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
          <span className="eyebrow">Welcome back</span>
          <h1>Log in to your account</h1>
          <p>Reserve a school room in just a few clicks.</p>
          {message && <div className="alert error" role="alert">{message}</div>}
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" autoComplete="email" placeholder="you@gmail.com"
                value={email} onChange={(event) => setEmail(event.target.value)} required />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <div className="password-input">
                <input id="password" type={showPassword ? "text" : "password"}
                  autoComplete="current-password" value={password}
                  onChange={(event) => setPassword(event.target.value)} required />
                <button type="button" aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? "◉" : "◎"}
                </button>
              </div>
            </div>
            <div className="check-row">
              <input id="remember" type="checkbox" checked={remember}
                onChange={(event) => setRemember(event.target.checked)} />
              <label htmlFor="remember">Remember my email</label>
              <Link style={{ marginLeft: "auto", color: "var(--gold)" }} to="/forgot-password">
                Forgot password?
              </Link>
            </div>
            <button className="button" type="submit" disabled={busy}>
              {busy ? "Signing in..." : "Log In"}
            </button>
          </form>
          <div className="auth-footer">Accounts are created by the school admin.</div>
        </section>
      </div>
    </main>
  );
}
