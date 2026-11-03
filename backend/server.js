import express from "express";
import cors from "cors";
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(cors({ origin: ["http://localhost:5173", "http://127.0.0.1:5173"] }));
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ status: "ok", message: "RoomReserve backend is running" });
});

// Service role key — SERVER ONLY. Never expose this to the browser.
const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const admin = supabaseUrl && serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey)
  : null;

function requireAdminClient(res) {
  if (!admin) {
    res.status(503).json({ error: "Backend Supabase URL or service-role key is not configured." });
    return false;
  }
  return true;
}

// Admin creates a user (only a valid admin token can do this)
app.post("/api/create-user", async (req, res) => {
  if (!requireAdminClient(res)) return;
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ error: "No token" });

  // 1. Who's calling?
  const { data: { user }, error: authError } = await admin.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: "Invalid token" });

  // 2. Is that user an admin?
  const { data: caller } = await admin
    .from("profiles").select("role").eq("id", user.id).single();

  if (caller?.role !== "admin") {
    return res.status(403).json({ error: "Admins only" });
  }

  // 3. Create the new user
  const { name, email, password, role } = req.body ?? {};
  const cleanName = typeof name === "string" ? name.trim() : "";
  const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const allowedRoles = ["teacher", "staff", "student"];

  if (!cleanName) {
    return res.status(400).json({ error: "Name is required" });
  }
  if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(cleanEmail)) {
    return res.status(400).json({ error: "Must be a @gmail.com email" });
  }
  if (typeof password !== "string" || password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ error: "Invalid account role" });
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: cleanEmail,
    password,
    email_confirm: true,
    user_metadata: { must_change_password: true },
  });

  if (error) return res.status(400).json({ error: error.message });

  const { error: profileError } = await admin.from("profiles").insert({
    id: data.user.id,
    full_name: cleanName,
    role,
    status: "approved",
  });

  if (profileError) {
    const { error: deleteError } = await admin.auth.admin.deleteUser(data.user.id);
    if (deleteError) console.error("Could not remove user after profile creation failed:", deleteError.message);
    return res.status(400).json({ error: profileError.message });
  }

  res.json({ success: true, userId: data.user.id });
});

app.get("/api/users", async (req, res) => {
  if (!requireAdminClient(res)) return;
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ error: "No token" });

  const { data: { user }, error: authError } = await admin.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: "Invalid token" });

  const { data: caller, error: profileError } = await admin
    .from("profiles").select("role").eq("id", user.id).single();
  if (profileError || caller?.role !== "admin") {
    return res.status(403).json({ error: "Admins only" });
  }

  const [{ data: profiles, error: profilesError }, { data: authUsers, error: usersError }] =
    await Promise.all([
      admin.from("profiles").select("id,full_name,role,status").order("full_name"),
      admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    ]);

  if (profilesError || usersError) {
    return res.status(500).json({ error: profilesError?.message || usersError.message });
  }

  const emailById = new Map(authUsers.users.map((authUser) => [authUser.id, authUser.email]));
  res.json({
    users: profiles.map((profile) => ({ ...profile, email: emailById.get(profile.id) || "" })),
  });
});

app.listen(4000, () => console.log("Backend on http://localhost:4000"));