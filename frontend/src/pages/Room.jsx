import { useEffect, useState } from "react";
import { supabase } from "../supabase";

export default function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("rooms")
      .select("*")
      .order("name")
      .then(({ data }) => {
        setRooms(data || []);
        setLoading(false);
      });
  }, []);

  if (loading) return <p style={{ padding: 24 }}>Loading rooms…</p>;

  return (
    <div style={{ padding: 24 }}>
      <h2>🏫 Rooms</h2>

      {rooms.length === 0 && <p>No rooms yet.</p>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 12 }}>
        {rooms.map((room) => (
          <div key={room.id} className="room-card">
            <h3>{room.name}</h3>
            <p>👥 {room.capacity} students</p>
            {room.location && <p>📍 {room.location}</p>}
            <p>📽 {room.projector ? "Has Projector" : "No Projector"}</p>
          </div>
        ))}
      </div>
    </div>
  );
}