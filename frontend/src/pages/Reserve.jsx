import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import { todayString } from "../utils";

export default function Reserve() {
  const [rooms, setRooms] = useState([]);
  const [roomId, setRoomId] = useState("");
  const [date, setDate] = useState(todayString());
  const [start, setStart] = useState("08:00");
  const [end, setEnd] = useState("09:00");
  const [purpose, setPurpose] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    supabase.from("rooms").select("*").order("name").then(({ data }) => setRooms(data || []));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");

    if (start >= end) {
      setMessage("End time must be after start time.");
      return;
    }

    // 1. Check for conflicts
    const { data: conflicts } = await supabase
      .from("bookings")
      .select("id")
      .eq("room_id", roomId)
      .eq("date", date)
      .in("status", ["pending", "approved"])
      .lt("start_time", end)
      .gt("end_time", start);

    if (conflicts && conflicts.length > 0) {
      setMessage("❌ That time is already booked for this room.");
      return;
    }

    // 2. Get the logged-in user
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login");
      return;
    }

    // 3. Insert the booking
    const { error } = await supabase.from("bookings").insert({
      room_id: Number(roomId),
      user_id: session.user.id,
      date,
      start_time: start,
      end_time: end,
      purpose,
      status: "pending",
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("✅ Reservation submitted!");
    setPurpose("");
  }

  return (
    <div style={{ padding: 24, maxWidth: 500 }}>
      <h2>📝 Reserve a Room</h2>

      {message && <div className="alert">{message}</div>}

      <form onSubmit={handleSubmit}>
        <label>Room</label>
        <select value={roomId} onChange={(e) => setRoomId(e.target.value)} required>
          <option value="">Select a room</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name} ({r.capacity} seats)
            </option>
          ))}
        </select>

        <label>Date</label>
        <input type="date" value={date} min={todayString()}
               onChange={(e) => setDate(e.target.value)} required />

        <label>Start Time</label>
        <input type="time" min="08:00" max="17:00" step="900"
               value={start} onChange={(e) => setStart(e.target.value)} required />

        <label>End Time</label>
        <input type="time" min="08:00" max="17:00" step="900"
               value={end} onChange={(e) => setEnd(e.target.value)} required />

        <label>Purpose</label>
        <input type="text" value={purpose}
               onChange={(e) => setPurpose(e.target.value)}
               placeholder="Example: Math Class" required />

        <button className="btn success" type="submit" style={{ marginTop: 16 }}>
          Request Reservation
        </button>
      </form>
    </div>
  );
}