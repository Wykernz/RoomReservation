import { useEffect, useState } from "react";
import { supabase } from "../../supabase";

export default function Reservations({ profile, user }) {
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadBookings() {
    setLoading(true);
    let query = supabase.from("bookings").select("*").order("date", { ascending: false });
    if (profile.role !== "admin") query = query.eq("user_id", user.id);
    const [bookingResult, roomResult, profileResult] = await Promise.all([
      query,
      supabase.from("rooms").select("id,name"),
      profile.role === "admin"
        ? supabase.from("profiles").select("id,full_name")
        : Promise.resolve({ data: [], error: null }),
    ]);
    const loadError = bookingResult.error || roomResult.error || profileResult.error;
    if (loadError) setError(loadError.message);
    else {
      setBookings(bookingResult.data || []);
      setRooms(roomResult.data || []);
      setUsers(profileResult.data || []);
      setError("");
    }
    setLoading(false);
  }

  useEffect(() => {
    let active = true;
    async function loadInitialBookings() {
      const bookingQuery = supabase.from("bookings").select("*").order("date", { ascending: false });
      if (profile.role !== "admin") bookingQuery.eq("user_id", user.id);
      const [bookingResult, roomResult, profileResult] = await Promise.all([
        bookingQuery,
        supabase.from("rooms").select("id,name"),
        profile.role === "admin"
          ? supabase.from("profiles").select("id,full_name")
          : Promise.resolve({ data: [], error: null }),
      ]);
      if (!active) return;
      const loadError = bookingResult.error || roomResult.error || profileResult.error;
      if (loadError) setError(loadError.message);
      else {
        setBookings(bookingResult.data || []);
        setRooms(roomResult.data || []);
        setUsers(profileResult.data || []);
      }
      setLoading(false);
    }
    loadInitialBookings();
    return () => { active = false; };
  }, [profile.role, user.id]);

  async function changeStatus(id, status) {
    const { error: updateError } = await supabase.from("bookings").update({ status }).eq("id", id);
    if (updateError) setError(updateError.message);
    else loadBookings();
  }

  const roomName = (id) => rooms.find((room) => room.id === id)?.name || "Room";
  const userName = (id) => users.find((item) => item.id === id)?.full_name || "User";

  return (
    <div className="stack">
      <div className="section-heading">
        <div><span className="eyebrow">{profile.role === "admin" ? "All bookings" : "Your activity"}</span>
          <h1>Reservations</h1><p>Review and manage reservation requests.</p></div>
        <button className="button secondary small" onClick={loadBookings}>Refresh</button>
      </div>
      {error && <div className="alert error" role="alert">{error}</div>}
      <section className="card panel table-wrap">
        {loading ? <div className="empty">Loading reservations…</div> : bookings.length === 0
          ? <div className="empty">No reservations yet.</div>
          : <table>
            <thead><tr><th>Room</th>{profile.role === "admin" && <th>Reserved by</th>}
              <th>Date</th><th>Time</th><th>Purpose</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>{bookings.map((booking) => (
              <tr key={booking.id}>
                <td>{roomName(booking.room_id)}</td>
                {profile.role === "admin" && <td>{userName(booking.user_id)}</td>}
                <td>{booking.date}</td>
                <td>{booking.start_time?.slice(0, 5)}–{booking.end_time?.slice(0, 5)}</td>
                <td>{booking.purpose}</td>
                <td><span className={`badge ${booking.status}`}>{booking.status}</span></td>
                <td><div className="actions-cell">
                  {profile.role === "admin" && booking.status === "pending" && <>
                    <button className="button small" onClick={() => changeStatus(booking.id, "approved")}>Approve</button>
                    <button className="button danger small" onClick={() => changeStatus(booking.id, "rejected")}>Reject</button>
                  </>}
                  {booking.user_id === user.id && ["pending", "approved"].includes(booking.status) &&
                    <button className="button secondary small" onClick={() => changeStatus(booking.id, "cancelled")}>Cancel</button>}
                </div></td>
              </tr>
            ))}</tbody>
          </table>}
      </section>
    </div>
  );
}
