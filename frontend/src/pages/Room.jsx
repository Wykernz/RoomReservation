import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import { formatTime, freeWindows, todayString } from "../utils";

function displayTime(minutes) {
  return formatTime(`${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`);
}

export default function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [date, setDate] = useState(todayString());
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("name");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    async function loadRooms() {
      setLoading(true);
      const [{ data: roomData, error: roomError }, { data: bookingData, error: bookingError }] = await Promise.all([
        supabase.from("rooms").select("*").order("name"),
        supabase.from("bookings").select("room_id,start_time,end_time,status")
          .eq("date", date).in("status", ["pending", "approved"]),
      ]);
      if (!active) return;
      if (roomError || bookingError) setError(roomError?.message || bookingError?.message);
      else {
        setRooms(roomData || []);
        setBookings(bookingData || []);
        setError("");
      }
      setLoading(false);
    }
    loadRooms();
    return () => { active = false; };
  }, [date]);

  const visibleRooms = useMemo(() => {
    let results = rooms.map((room) => ({ ...room, free: freeWindows(room.id, bookings) }));
    if (filter === "available") results = results.filter((room) => room.free.length > 0);
    if (sort === "capacity-desc") results.sort((a, b) => b.capacity - a.capacity);
    else if (sort === "capacity-asc") results.sort((a, b) => a.capacity - b.capacity);
    else results.sort((a, b) => a.name.localeCompare(b.name));
    return results;
  }, [rooms, bookings, filter, sort]);

  return (
    <div className="stack">
      <div className="section-heading">
        <div><span className="eyebrow">Campus spaces</span><h1>Rooms</h1>
          <p>Check availability for a date and choose a room.</p></div>
      </div>
      {error && <div className="alert error" role="alert">{error}</div>}
      <section className="card panel">
        <div className="form-grid">
          <div className="field"><label htmlFor="availability-date">Availability date</label>
            <input id="availability-date" type="date" min={todayString()} value={date}
              onChange={(event) => setDate(event.target.value)} /></div>
          <div className="field"><label htmlFor="room-filter">Filter rooms</label>
            <select id="room-filter" value={filter} onChange={(event) => setFilter(event.target.value)}>
              <option value="all">All Rooms</option><option value="available">Available Only</option>
            </select></div>
          <div className="field"><label htmlFor="room-sort">Sort by</label>
            <select id="room-sort" value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="name">Name (A–Z)</option><option value="capacity-desc">Capacity (High–Low)</option>
              <option value="capacity-asc">Capacity (Low–High)</option>
            </select></div>
        </div>
      </section>
      {loading ? <div className="empty">Loading rooms…</div> : visibleRooms.length === 0
        ? <div className="card empty">No rooms found for this filter.</div>
        : <div className="room-grid">
          {visibleRooms.map((room) => (
            <article className="card room-card" key={room.id}>
              <h3>{room.name}</h3>
              <p>👥 {room.capacity} seats</p>
              {room.location && <p>📍 {room.location}</p>}
              <p>📽 {room.projector ? "Projector available" : "No projector"}</p>
              <div className="timeline">
                <span className="free" style={{ width: `${room.free.reduce((sum, item) => sum + item.end - item.start, 0) / 540 * 100}%` }} />
                <span className="busy" style={{ width: `${100 - room.free.reduce((sum, item) => sum + item.end - item.start, 0) / 540 * 100}%` }} />
              </div>
              <p className="note">
                {room.free.length
                  ? `Open: ${room.free.slice(0, 2).map((item) => `${displayTime(item.start)}–${displayTime(item.end)}`).join(", ")}`
                  : "No open time today"}
              </p>
              <button className="button small" style={{ marginTop: 12 }}
                onClick={() => navigate(`/dashboard/reserve?room=${room.id}&date=${date}`)}>
                Reserve this room
              </button>
            </article>
          ))}
        </div>}
    </div>
  );
}
