import { useEffect, useState } from "react";
import { supabase } from "../../supabase";

const emptyRoom = { name: "", capacity: "", location: "", projector: false };

export default function ManageRooms() {
  const [rooms, setRooms] = useState([]);
  const [room, setRoom] = useState(emptyRoom);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function loadRooms() {
    const { data, error: loadError } = await supabase.from("rooms").select("*").order("name");
    if (loadError) {
      setError(true);
      setMessage(loadError.message);
    } else setRooms(data || []);
  }

  useEffect(() => {
    let active = true;
    supabase.from("rooms").select("*").order("name").then(({ data, error: loadError }) => {
      if (!active) return;
      if (loadError) {
        setError(true);
        setMessage(loadError.message);
      } else setRooms(data || []);
    });
    return () => { active = false; };
  }, []);

  function resetForm() {
    setRoom(emptyRoom);
    setEditingId(null);
  }

  async function saveRoom(event) {
    event.preventDefault();
    setBusy(true);
    const values = {
      name: room.name.trim(),
      capacity: Number(room.capacity),
      location: room.location.trim(),
      projector: room.projector,
    };
    const result = editingId
      ? await supabase.from("rooms").update(values).eq("id", editingId)
      : await supabase.from("rooms").insert(values);
    if (result.error) {
      setError(true);
      setMessage(result.error.message);
    } else {
      setError(false);
      setMessage(editingId ? "Room updated." : "Room added.");
      resetForm();
      await loadRooms();
    }
    setBusy(false);
  }

  async function deleteRoom(id) {
    if (!window.confirm("Delete this room? Existing reservations may prevent deletion.")) return;
    const { error: deleteError } = await supabase.from("rooms").delete().eq("id", id);
    if (deleteError) {
      setError(true);
      setMessage(deleteError.message);
    } else {
      setError(false);
      setMessage("Room deleted.");
      loadRooms();
    }
  }

  function editRoom(item) {
    setEditingId(item.id);
    setRoom({
      name: item.name || "",
      capacity: item.capacity || "",
      location: item.location || "",
      projector: Boolean(item.projector),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="stack">
      <div className="section-heading"><div><span className="eyebrow">Administration</span>
        <h1>Manage Rooms</h1><p>Add, update, and remove campus spaces.</p></div></div>
      {message && <div className={`alert ${error ? "error" : "success"}`} role="status">{message}</div>}
      <section className="card panel">
        <h2>{editingId ? "Edit room" : "Add a room"}</h2>
        <form onSubmit={saveRoom}>
          <div className="form-grid">
            <div className="field"><label htmlFor="room-name">Room name</label>
              <input id="room-name" value={room.name} onChange={(event) => setRoom({ ...room, name: event.target.value })} required /></div>
            <div className="field"><label htmlFor="room-capacity">Capacity</label>
              <input id="room-capacity" type="number" min="1" value={room.capacity}
                onChange={(event) => setRoom({ ...room, capacity: event.target.value })} required /></div>
            <div className="field"><label htmlFor="room-location">Location</label>
              <input id="room-location" value={room.location}
                onChange={(event) => setRoom({ ...room, location: event.target.value })} /></div>
            <label className="check-row"><input type="checkbox" checked={room.projector}
              onChange={(event) => setRoom({ ...room, projector: event.target.checked })} /> Projector available</label>
          </div>
          <div className="booking-actions">
            <button className="button" type="submit" disabled={busy}>{busy ? "Saving…" : editingId ? "Save changes" : "Add room"}</button>
            {editingId && <button className="button secondary" type="button" onClick={resetForm}>Cancel edit</button>}
          </div>
        </form>
      </section>
      <section className="card panel table-wrap">
        {rooms.length === 0 ? <div className="empty">No rooms yet.</div> : <table>
          <thead><tr><th>Room</th><th>Capacity</th><th>Location</th><th>Projector</th><th>Actions</th></tr></thead>
          <tbody>{rooms.map((item) => <tr key={item.id}>
            <td>{item.name}</td><td>{item.capacity}</td><td>{item.location || "—"}</td>
            <td>{item.projector ? "Yes" : "No"}</td>
            <td><div className="actions-cell">
              <button className="button secondary small" onClick={() => editRoom(item)}>Edit</button>
              <button className="button danger small" onClick={() => deleteRoom(item.id)}>Delete</button>
            </div></td>
          </tr>)}</tbody>
        </table>}
      </section>
    </div>
  );
}
