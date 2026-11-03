export function formatTime(t) {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function freeWindows(roomId, bookings) {
  const opening = 8 * 60;
  const closing = 17 * 60;
  const busy = bookings
    .filter((booking) => booking.room_id === roomId)
    .map((booking) => ({
      start: Math.max(opening, toMinutes(booking.start_time)),
      end: Math.min(closing, toMinutes(booking.end_time)),
    }))
    .filter((booking) => booking.end > booking.start)
    .sort((a, b) => a.start - b.start);

  const free = [];
  let cursor = opening;
  for (const window of busy) {
    if (window.start > cursor) free.push({ start: cursor, end: window.start });
    cursor = Math.max(cursor, window.end);
  }
  if (cursor < closing) free.push({ start: cursor, end: closing });
  return free;
}

function toMinutes(value) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}