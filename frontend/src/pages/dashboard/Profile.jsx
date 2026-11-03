import { useState } from "react";
import { supabase } from "../../supabase";

export default function Profile({ profile, user }) {
  const [name, setName] = useState(profile.full_name || "");
  const [email, setEmail] = useState(user.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function saveProfile(event) {
    event.preventDefault();
    setMessage("");
    setBusy(true);
    const changedEmail = email.trim() !== user.email;
    const changedPassword = newPassword.length > 0;
    const changedName = name.trim() !== (profile.full_name || "");

    if (!changedEmail && !changedPassword && !changedName) {
      setError(true);
      setMessage("There are no changes to save.");
      setBusy(false);
      return;
    }
    if ((changedEmail || changedPassword) && !currentPassword) {
      setError(true);
      setMessage("Enter your current password to change your email or password.");
      setBusy(false);
      return;
    }
    if (changedPassword && newPassword.length < 6) {
      setError(true);
      setMessage("New password must be at least 6 characters.");
      setBusy(false);
      return;
    }
    if (changedEmail || changedPassword) {
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      if (verifyError) {
        setError(true);
        setMessage("Current password is incorrect.");
        setBusy(false);
        return;
      }
    }

    if (changedName) {
      const { error: profileError } = await supabase.from("profiles")
        .update({ full_name: name.trim() }).eq("id", user.id);
      if (profileError) {
        setError(true);
        setMessage(profileError.message);
        setBusy(false);
        return;
      }
    }
    if (changedEmail || changedPassword) {
      const updates = {};
      if (changedEmail) updates.email = email.trim();
      if (changedPassword) updates.password = newPassword;
      const { error: authError } = await supabase.auth.updateUser(updates);
      if (authError) {
        setError(true);
        setMessage(authError.message);
        setBusy(false);
        return;
      }
    }
    setError(false);
    setMessage(changedEmail
      ? "Profile saved. Check your new email to confirm the address change."
      : "Profile saved.");
    setCurrentPassword("");
    setNewPassword("");
    setBusy(false);
  }

  return (
    <div className="stack">
      <div className="section-heading"><div><span className="eyebrow">Your account</span>
        <h1>Profile</h1><p>Update your name, email, or password.</p></div></div>
      <section className="card panel">
        {message && <div className={`alert ${error ? "error" : "success"}`} role="status">{message}</div>}
        <form onSubmit={saveProfile}>
          <div className="field"><label htmlFor="profile-name">Full name</label>
            <input id="profile-name" value={name} onChange={(event) => setName(event.target.value)} /></div>
          <div className="field"><label htmlFor="profile-email">Email</label>
            <input id="profile-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></div>
          <div className="field"><label htmlFor="current-password">Current password (required for email/password changes)</label>
            <input id="current-password" type="password" autoComplete="current-password" value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)} /></div>
          <div className="field"><label htmlFor="profile-new-password">New password (optional)</label>
            <input id="profile-new-password" type="password" minLength="6" autoComplete="new-password"
              value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /></div>
          <button className="button" type="submit" disabled={busy}>{busy ? "Saving…" : "Save profile"}</button>
        </form>
      </section>
    </div>
  );
}
