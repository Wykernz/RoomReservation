import { supabase } from "./src/supabase";

export async function createUser(e, form) {
  e.preventDefault();

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (!session) throw new Error("You must be signed in to create a user.");

  const response = await fetch("http://localhost:4000/api/create-user", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      name: form.name,
      email: form.email,
      password: form.password,
      role: form.role,
    }),
  });

  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Failed to create user.");

  alert("User created!");
}
