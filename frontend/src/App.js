import { useEffect, useState } from "react";
import "@/App.css";
import { Toaster } from "sonner";
import { GlobalHeader } from "@/components/flow/GlobalHeader";
import { AccountFlow } from "@/components/flow/AccountFlow";

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <div className="App min-h-screen bg-[#F3F5F9] dark:bg-[#0B132B]">
      <GlobalHeader theme={theme} onToggleTheme={toggle} />
      <main>
        <AccountFlow />
      </main>
      <Toaster position="top-right" richColors closeButton />
    </div>
  );
}

export default App;
