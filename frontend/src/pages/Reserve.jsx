import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { todayString } from "../utils";

export default function Reserve({ user }) {
  const search = new URLSearchParams(window.location.search);
  const [rooms, setRooms] = useState([]);
  const [roomId, setRoomId] = useState(search.get("room") || "");
  const [date, setDate] = useState(
    search.get("date") && search.get("date") >= todayString() ? search.get("date") : todayString()
  );
  const [start, setStart] = useState("08:00");
  const [end, setEnd] = useState("09:00");
  const [purpose, setPurpose] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.from("rooms").select("id,name,capacity").order("name")
      .then(({ data, error: queryError }) => {
        if (!active) return;
        if (queryError) setMessage(queryError.message);
        else setRooms(data || []);
      });
    return () => { active = false; };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setBusy(true);
    const fail = (text) => { setError(true); setMessage(text); setBusy(false); };

    if (!roomId) return fail("Please choose a room.");
    if (start < "08:00" || end > "17:00") return fail("Reservations must be between 8:00 AM and 5:00 PM.");
    if (start >= end) return fail("End time must be after start time.");

    const { data: conflicts, error: conflictError } = await supabase
      .from("bookings")
      .select("id")
      .eq("room_id", Number(roomId))
      .eq("date", date)
      .in("status", ["pending", "approved"])
      .lt("start_time", end)
      .gt("end_time", start);
    if (conflictError) return fail(conflictError.message);
    if (conflicts.length) return fail("That time is already booked for this room.");

    const { error: insertError } = await supabase.from("bookings").insert({
      room_id: Number(roomId),
      user_id: user.id,
      date,
      start_time: start,
      end_time: end,
      purpose: purpose.trim(),
      status: "pending",
    });
    if (insertError) return fail(insertError.message);

    setError(false);
    setMessage("Reservation submitted for approval.");
    setPurpose("");
    setBusy(false);
  }

  return (
    <div className="stack">
      <div className="section-heading">
        <div><span className="eyebrow">New request</span><h1>Reserve a Room</h1>
          <p>Choose an open date and time between 8:00 AM and 5:00 PM.</p></div>
      </div>
      <section className="card panel">
        {message && <div className={`alert ${error ? "error" : "success"}`} role="status">{message}</div>}
        <form onSubmit={handleSubmit}>
          <div className="field"><label htmlFor="room">Room</label>
            <select id="room" value={roomId} onChange={(event) => setRoomId(event.target.value)} required>
              <option value="">Select a room</option>
              {rooms.map((room) => <option key={room.id} value={room.id}>{room.name} ({room.capacity} seats)</option>)}
            </select></div>
          <div className="form-grid">
            <div className="field"><label htmlFor="date">Date</label>
              <input id="date" type="date" min={todayString()} value={date}
                onChange={(event) => setDate(event.target.value)} required /></div>
            <div className="field"><label htmlFor="purpose">Purpose</label>
              <input id="purpose" value={purpose} onChange={(event) => setPurpose(event.target.value)}
                placeholder="Example: Math class" required /></div>
            <div className="field"><label htmlFor="start">Start time</label>
              <input id="start" type="time" min="08:00" max="17:00" step="900" value={start}
                onChange={(event) => setStart(event.target.value)} required /></div>
            <div className="field"><label htmlFor="end">End time</label>
              <input id="end" type="time" min="08:00" max="17:00" step="900" value={end}
                onChange={(event) => setEnd(event.target.value)} required /></div>
          </div>
          <button className="button" type="submit" disabled={busy}>{busy ? "Submitting…" : "Request Reservation"}</button>
        </form>
      </section>
    </div>
  );
}
