import { useEffect, useState } from "react";
import { supabase } from "../../supabase";

const roles = ["teacher", "staff", "student"];

async function fetchUsers() {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) throw new Error(error?.message || "Please sign in again.");
  const response = await fetch("http://localhost:4000/api/users", {
    headers: { Authorization: `Bearer ${data.session.access_token}` },
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Could not load users.");
  return result.users;
}

export default function ManageUsers({ profile }) {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "teacher" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function loadUsers() {
    try {
      const data = await fetchUsers();
      setUsers(data.filter((item) => item.id !== profile.id && item.role !== "admin"));
      setError(false);
    } catch (loadError) {
      setError(true);
      setMessage(loadError.message);
    }
  }

  useEffect(() => {
    let active = true;
    fetchUsers().then((data) => {
        if (!active) return;
        setUsers(data.filter((item) => item.id !== profile.id && item.role !== "admin"));
      }).catch((loadError) => {
        if (!active) return;
        setError(true);
        setMessage(loadError.message);
      });
    return () => { active = false; };
  }, [profile.id]);

  async function createUser(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      setError(true);
      setMessage(sessionError?.message || "Please sign in again.");
      setBusy(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:4000/api/create-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not create user.");
      setError(false);
      setMessage("Account created. The user must change their password after signing in.");
      setForm({ name: "", email: "", password: "", role: "teacher" });
      await loadUsers();
    } catch (requestError) {
      setError(true);
      setMessage(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function updateUser(id, changes) {
    const { error: updateError } = await supabase.from("profiles").update(changes).eq("id", id);
    if (updateError) {
      setError(true);
      setMessage(updateError.message);
    } else {
      setError(false);
      setMessage("User updated.");
      loadUsers();
    }
  }

  return (
    <div className="stack">
      <div className="section-heading"><div><span className="eyebrow">Administration</span>
        <h1>Manage Users</h1><p>Create accounts and update user roles or access.</p></div></div>
      {message && <div className={`alert ${error ? "error" : "success"}`} role="status">{message}</div>}
      <section className="card panel">
        <h2>Create account</h2>
        <form onSubmit={createUser}>
          <div className="form-grid">
            <div className="field"><label htmlFor="new-name">Full name</label>
              <input id="new-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></div>
            <div className="field"><label htmlFor="new-email">Gmail address</label>
              <input id="new-email" type="email" value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })} required /></div>
            <div className="field"><label htmlFor="new-password">Temporary password</label>
              <input id="new-password" type="password" minLength="6" value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })} required /></div>
            <div className="field"><label htmlFor="new-role">Role</label>
              <select id="new-role" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
                {roles.map((role) => <option key={role} value={role}>{role}</option>)}
              </select></div>
          </div>
          <button className="button" type="submit" disabled={busy}>{busy ? "Creating…" : "Create account"}</button>
        </form>
      </section>
      <section className="card panel table-wrap">
        {users.length === 0 ? <div className="empty">No other user profiles found.</div> : <table>
          <thead><tr><th>Name</th><th>User ID</th><th>Role</th><th>Status</th></tr></thead>
          <tbody>{users.map((item) => <tr key={item.id}>
            <td>{item.full_name || "—"}</td><td>{item.id}</td>
            <td><select aria-label={`Role for ${item.full_name || item.email}`} value={item.role}
              onChange={(event) => updateUser(item.id, { role: event.target.value })}>
              {roles.map((role) => <option key={role} value={role}>{role}</option>)}
            </select></td>
            <td><select aria-label={`Status for ${item.full_name || item.email}`} value={item.status || "approved"}
              onChange={(event) => updateUser(item.id, { status: event.target.value })}>
              <option value="approved">Approved</option><option value="blocked">Blocked</option>
            </select></td>
          </tr>)}</tbody>
        </table>}
      </section>
    </div>
  );
}
