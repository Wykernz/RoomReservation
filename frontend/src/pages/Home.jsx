import { useState } from "react";
import { Link } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";

const panels = {
  home: {
    label: "Reserve the right room, every time.",
    text: "Pick a room, choose a time, and get approved in just a few clicks.",
  },
  features: {
    label: "Everything your campus needs",
    text: "Check availability, request a room, and track approvals in one place.",
  },
  "how-it-works": {
    label: "Four steps to a booked room",
    text: "Sign in, browse rooms, choose a time, and wait for approval.",
  },
  faq: {
    label: "Room booking, made simple.",
    text: "Accounts are created by your school administrator. Contact them if you need access.",
  },
};

const features = [
  ["🟢", "Real-Time Availability", "See which rooms are open before you send a request."],
  ["⚡", "Flexible Times", "Choose a start and end time that works for your class."],
  ["✅", "Admin Approval", "Track each request from pending to approved."],
  ["🛡️", "Managed Accounts", "Your school administrator creates and manages accounts."],
  ["🏫", "Room Details", "Browse room capacity, location, and equipment."],
  ["📱", "Any Device", "Use the same booking experience on mobile or desktop."],
];

const howItWorks = [
  ["1", "Get your login", "Your school administrator creates your account."],
  ["2", "Browse rooms", "Check room details and availability for your date."],
  ["3", "Choose a time", "Select an open time and tell us what the room is for."],
  ["4", "Get approved", "An administrator reviews your request and updates its status."],
];

const questions = [
  ["Do I need to install anything?", "No. The reservation system runs in your browser."],
  ["Can two people book overlapping times?", "Pending and approved reservations block overlapping requests."],
  ["How do I get an account?", "Ask your school administrator to create your account."],
  ["Who can approve reservations?", "Only accounts with the administrator role can approve requests."],
  ["Can I change my password?", "Yes. Use the Profile page or request a reset link from the login page."],
];

export default function Home() {
  const [panel, setPanel] = useState("home");
  const current = panels[panel];
  const sectionItems = panel === "how-it-works"
    ? howItWorks
    : panel === "faq"
      ? questions
      : features;

  return (
    <main className="app-page">
      <header className="container landing-nav">
        <Link className="brand" to="/">
          <span className="brand-mark">R</span>
          <span>Room Reservation</span>
        </Link>
        <nav className="landing-links" aria-label="Main navigation">
          {Object.keys(panels).map((name) => (
            <button key={name} type="button" onClick={() => setPanel(name)}>
              {name === "how-it-works" ? "How It Works" : name[0].toUpperCase() + name.slice(1)}
            </button>
          ))}
        </nav>
        <div className="landing-actions">
          <ThemeToggle />
          <Link className="button" to="/login">Sign In</Link>
        </div>
      </header>

      <section className="container hero">
        <div>
          <span className="eyebrow">Campus room booking</span>
          <h1>{current.label}</h1>
          <p className="hero-copy">{current.text}</p>
          <div className="hero-ctas">
            <Link className="button" to="/login">Sign In</Link>
            <button className="button secondary" type="button" onClick={() => setPanel("how-it-works")}>
              See How It Works
            </button>
          </div>
        </div>
        <div className="hero-art" role="img" aria-label="Room booking status preview">
          <div className="preview-grid">
            <div className="preview-room"><strong>Computer Lab</strong><span>● Open</span></div>
            <div className="preview-room booked"><strong>Library</strong><span>● Booked</span></div>
            <div className="preview-room pending"><strong>Science Room</strong><span>● Pending</span></div>
            <div className="preview-room"><strong>Music Room</strong><span>● Open</span></div>
          </div>
        </div>
      </section>

      <section className="container landing-section">
        <span className="eyebrow">Why teams switch</span>
        <h2>{panel === "how-it-works" ? "Four steps to a booked room"
          : panel === "faq" ? "Frequently asked questions"
            : "Everything your campus needs"}</h2>
        <div className="feature-grid">
          {sectionItems.map((item) => {
            const [icon, title, text] = item;
            return (
            <article className="feature-card" key={title}>
              <span aria-hidden="true">{panel === "how-it-works" ? icon : panel === "faq" ? "❔" : icon}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
            );
          })}
        </div>
      </section>

      <footer className="container landing-footer">
        © 2026 Room Reservation System
      </footer>
    </main>
  );
}
