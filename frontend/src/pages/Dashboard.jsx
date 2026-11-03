import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../supabase";

export default function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      // 1. Check we have a session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      // 2. Load the matching profile row
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (profile?.status === "blocked") {
        await supabase.auth.signOut();
        navigate("/login");
        return;
      }

      setProfile(profile);
      setLoading(false);
    }
    load();
  }, [navigate]);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  if (loading) return <p style={{ padding: 24 }}>Loading…</p>;

  return (
    <div style={{ padding: 24 }}>
      <header style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h2>👋 Welcome, {profile.full_name}</h2>
          <p>Role: {profile.role}</p>
        </div>
        <button className="btn" onClick={handleLogout}>Logout</button>
      </header>

      <nav style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <Link className="btn" to="/rooms">🏫 Rooms</Link>
        <Link className="btn" to="/reserve">📝 Reserve</Link>
      </nav>

      <div className="box">
        <h3>What's next?</h3>
        <p>Use the buttons above to browse rooms or make a reservation.</p>
      </div>
    </div>
  );
}