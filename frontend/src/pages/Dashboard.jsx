import { useEffect, useState } from "react";
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import Overview from "./dashboard/Overview";
import Rooms from "./Room";
import Reserve from "./Reserve";
import Reservations from "./dashboard/Reservations";
import ManageRooms from "./dashboard/ManageRooms";
import ManageUsers from "./dashboard/ManageUsers";
import Profile from "./dashboard/Profile";
import ThemeToggle from "../components/ThemeToggle";

const links = [
  { path: "", label: "Overview", icon: "🏠" },
  { path: "rooms", label: "Rooms", icon: "🏫" },
  { path: "reserve", label: "Reserve", icon: "📝" },
  { path: "reservations", label: "My Reservations", icon: "📅" },
  { path: "profile", label: "Profile", icon: "👤" },
];

const adminLinks = [
  { path: "manage-rooms", label: "Manage Rooms", icon: "🏢" },
  { path: "manage-users", label: "Manage Users", icon: "👥" },
];

export default function Dashboard() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = profile?.role === "admin";
  const activePath = location.pathname.replace("/dashboard", "").replace(/^\//, "");

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (!active) return;
      if (sessionError) {
        setError(sessionError.message);
        setLoading(false);
        return;
      }
      if (!data.session) {
        navigate("/login", { replace: true });
        return;
      }

      setSession(data.session);
      const { data: userProfile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.session.user.id)
        .single();

      if (!active) return;
      if (profileError) setError(`Could not load your profile: ${profileError.message}`);
      else if (userProfile.status === "blocked") {
        await supabase.auth.signOut();
        navigate("/login", { replace: true });
      } else setProfile(userProfile);
      setLoading(false);
    }

    loadProfile();
    return () => { active = false; };
  }, [navigate]);

  async function logout() {
    const { error: logoutError } = await supabase.auth.signOut();
    if (logoutError) setError(logoutError.message);
    else navigate("/login", { replace: true });
  }

  if (loading) return <main className="app-page"><div className="empty">Loading your dashboard…</div></main>;
  if (!session) return <Navigate to="/login" replace />;
  if (error && !profile) {
    return (
      <main className="app-page container">
        <div className="alert error">{error}</div>
        <button className="button" onClick={logout}>Sign out</button>
      </main>
    );
  }

  const adminOnly = ["manage-rooms", "manage-users"].includes(activePath);
  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />;
  if (session.user.user_metadata?.must_change_password) {
    return <ForcePasswordChange onUpdated={(updatedUser) => setSession({ ...session, user: updatedUser })} />;
  }
  const pageProps = { profile, user: session.user };

  return (
    <main className="app-page dashboard">
      <aside className="sidebar">
        <Link className="brand" to="/"><span className="brand-mark">R</span><span>Room Reservation</span></Link>
        <span className="sidebar-subtitle">School Management System</span>
        <nav className="side-nav" aria-label="Dashboard navigation">
          {links.map((link) => (
            <Link key={link.path} className={activePath === link.path ? "active" : ""}
              to={`/dashboard${link.path ? `/${link.path}` : ""}`}>
              <span>{link.icon}</span>{link.label}
            </Link>
          ))}
          {isAdmin && (
            <>
              <span className="eyebrow" style={{ padding: "16px 10px 5px" }}>Administration</span>
              {adminLinks.map((link) => (
                <Link key={link.path} className={activePath === link.path ? "active" : ""}
                  to={`/dashboard/${link.path}`}>
                  <span>{link.icon}</span>{link.label}
                </Link>
              ))}
            </>
          )}
        </nav>
        <div className="sidebar-bottom">
          <div className="user-info">
            <strong>{profile.full_name || session.user.email}</strong>
            <span>{profile.role}</span>
          </div>
          <div className="landing-actions">
            <ThemeToggle />
            <button className="button secondary small" onClick={logout}>Log out</button>
          </div>
        </div>
      </aside>
      <section className="dash-main">
        <div className="mobile-top">
          <Link className="brand" to="/"><span className="brand-mark">R</span>Room Reservation</Link>
          <ThemeToggle />
          <button className="button secondary small" onClick={logout}>Log out</button>
        </div>
        {error && <div className="alert error" role="alert">{error}</div>}
        <Routes>
          <Route index element={<Overview {...pageProps} />} />
          <Route path="rooms" element={<Rooms {...pageProps} />} />
          <Route path="reserve" element={<Reserve {...pageProps} />} />
          <Route path="reservations" element={<Reservations {...pageProps} />} />
          <Route path="manage-rooms" element={<ManageRooms {...pageProps} />} />
          <Route path="manage-users" element={<ManageUsers {...pageProps} />} />
          <Route path="profile" element={<Profile {...pageProps} />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </section>
    </main>
  );
}

function ForcePasswordChange({ onUpdated }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setMessage("Passwords do not match.");
      return;
    }
    setBusy(true);
    const { data, error: updateError } = await supabase.auth.updateUser({
      password,
      data: { must_change_password: false },
    });
    if (updateError) {
      setMessage(updateError.message);
      setBusy(false);
    } else {
      onUpdated(data.user);
    }
  }

  return (
    <main className="app-page">
      <div className="container auth-wrap">
        <section className="card auth-card">
          <span className="eyebrow">One-time step</span>
          <h1>Choose your password</h1>
          <p>Your administrator gave you a temporary password. Set a new one to continue.</p>
          {message && <div className="alert error" role="alert">{message}</div>}
          <form className="auth-form" onSubmit={submit}>
            <div className="field"><label htmlFor="first-password">New password</label>
              <input id="first-password" type="password" autoComplete="new-password" value={password}
                onChange={(event) => setPassword(event.target.value)} required /></div>
            <div className="field"><label htmlFor="confirm-first-password">Confirm password</label>
              <input id="confirm-first-password" type="password" autoComplete="new-password" value={confirm}
                onChange={(event) => setConfirm(event.target.value)} required /></div>
            <button className="button" type="submit" disabled={busy}>{busy ? "Saving…" : "Set password"}</button>
          </form>
        </section>
      </div>
    </main>
  );
}
