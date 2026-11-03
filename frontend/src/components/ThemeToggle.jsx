import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [light, setLight] = useState(
    () => localStorage.getItem("rr-theme") === "light"
  );

  useEffect(() => {
    document.documentElement.dataset.theme = light ? "light" : "dark";
    localStorage.setItem("rr-theme", light ? "light" : "dark");
  }, [light]);

  return (
    <button
      className="theme-button"
      type="button"
      aria-label={`Switch to ${light ? "dark" : "light"} mode`}
      onClick={() => setLight(!light)}
    >
      {light ? "☀️" : "🌙"}
    </button>
  );
}
