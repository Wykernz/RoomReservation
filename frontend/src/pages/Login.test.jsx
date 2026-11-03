import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";
import Login from "./Login";

// Fake out Supabase so the test doesn't need a real database
vi.mock("../supabase", () => ({
  supabase: {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null } }),
      signInWithPassword: vi.fn().mockResolvedValue({
        error: { message: "Incorrect password" },
      }),
    },
  },
}));

describe("Login page", () => {
  it("shows an error when login fails", async () => {
    const user = userEvent.setup();

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    // Fill in the form
    await user.type(screen.getByPlaceholderText("you@gmail.com"), "test@gmail.com");
    await user.type(screen.getByLabelText(/^Password$/), "wrongpass");

    // Click submit
    await user.click(screen.getByRole("button", { name: /log in/i }));

    // Wait for the error message to appear
    expect(await screen.findByText("Incorrect password")).toBeInTheDocument();
  });
});