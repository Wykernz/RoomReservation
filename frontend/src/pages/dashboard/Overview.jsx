import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../supabase";

export default function Overview({ profile, user }) {
  const [stats, setStats] = useState({ rooms: 0, pending: 0, approved: 0, cancelled: 0 });
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadStats() {
      const [{ data: rooms, error: roomsError }, bookingsResult] = await Promise.all([
        supabase.from("rooms").select("id"),
        (() => {
          let query = supabase.from("bookings").select("id,status");
          if (profile.role !== "admin") query = query.eq("user_id", user.id);
          return query;
        })(),
      ]);
      if (!active) return;
      const bookingsError = bookingsResult.error;
      if (roomsError || bookingsError) {
        setError(roomsError?.message || bookingsError?.message || "Could not load dashboard data.");
        return;
      }
      const bookings = bookingsResult.data || [];
      setStats({
        rooms: rooms?.length || 0,
        pending: bookings.filter((item) => item.status === "pending").length,
        approved: bookings.filter((item) => item.status === "approved").length,
        cancelled: bookings.filter((item) => item.status === "cancelled").length,
      });
    }
    loadStats();
    return () => { active = false; };
  }, [profile.role, user.id]);

  const tiles = [
    ["🏫", stats.rooms, "Total Rooms"],
    ["⏳", stats.pending, "Pending Reservations"],
    ["✅", stats.approved, "Approved Reservations"],
    ["🚫", stats.cancelled, "Cancelled Reservations"],
  ];

  return (
    <div className="stack">
      <div className="section-heading">
        <div><span className="eyebrow">Overview</span><h1>Welcome, {profile.full_name || "there"}</h1>
          <p>Here’s what’s happening with room reservations.</p></div>
      </div>
      {error && <div className="alert error">{error}</div>}
      <div className="stats-grid">
        {tiles.map(([icon, value, label]) => (
          <article className="card stat-card" key={label}>
            <span aria-hidden="true">{icon}</span><strong className="stat-value">{value}</strong>
            <span className="stat-label">{label}</span>
          </article>
        ))}
      </div>
      <section className="card panel">
        <h2>Reservation Pulse</h2>
        <p className="note">Pending: {stats.pending} · Approved: {stats.approved}</p>
        <div className="timeline" aria-label={`${stats.pending} pending and ${stats.approved} approved`}>
          <span className="busy" style={{ width: `${stats.pending + stats.approved ? stats.pending / (stats.pending + stats.approved) * 100 : 0}%` }} />
          <span className="free" style={{ width: `${stats.pending + stats.approved ? stats.approved / (stats.pending + stats.approved) * 100 : 0}%` }} />
        </div>
        <div className="booking-actions">
          <Link className="button" to="/dashboard/reserve">Request a room</Link>
          <Link className="button secondary" to="/dashboard/rooms">Browse rooms</Link>
        </div>
      </section>
    </div>
  );
}
