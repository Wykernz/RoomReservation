import express from "express";
import cors from "cors";
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ status: "ok", message: "RoomReserve backend is running" });
});

// Service role key — SERVER ONLY. Never expose this to the browser.
const admin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Admin creates a user (only a valid admin token can do this)
app.post("/api/create-user", async (req, res) => {
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

  if (typeof email !== "string" || !email.endsWith("@gmail.com")) {
    return res.status(400).json({ error: "Must be a @gmail.com email" });
  }
  if (typeof password !== "string" || password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) return res.status(400).json({ error: error.message });

  await admin.from("profiles").insert({
    id: data.user.id,
    full_name: name,
    role,
    status: "approved",
  });

  res.json({ success: true, userId: data.user.id });
});

app.listen(4000, () => console.log("Backend on http://localhost:4000"));