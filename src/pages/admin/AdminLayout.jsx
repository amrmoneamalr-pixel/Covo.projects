import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, LogOut, Lock } from "lucide-react";
import ImportExcel from "./ImportExcel";
import ManageProjects from "./ManageProjects";
import Developers from "./Developers";

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "admin123";

const TABS = [
  { id: "developers", label: "Developers" },
  { id: "import",     label: "Import Data" },
  { id: "manage",     label: "Manage Projects" },
];

function BackToSiteButton({ size = "default" }) {
  const padding = size === "small" ? "px-3 py-1.5 text-[11px]" : "px-4 py-2 text-xs";
  return (
    <Link
      to="/"
      className={`inline-flex items-center gap-1.5 bg-covo-teal hover:opacity-90 text-black font-semibold rounded-md transition-opacity ${padding}`}
    >
      <ArrowLeft className="w-3.5 h-3.5" />
      Back to Site
    </Link>
  );
}

export default function AdminLayout() {
  const [authed, setAuthed] = useState(
    () => sessionStorage.getItem("covo_admin") === "1"
  );
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
  const [activeTab, setActiveTab] = useState("developers");

  function handleLogin() {
    if (pw === ADMIN_PASSWORD) {
      sessionStorage.setItem("covo_admin", "1");
      setAuthed(true);
    } else {
      setErr(true);
      setTimeout(() => setErr(false), 2000);
    }
  }

  function handleLogout() {
    sessionStorage.removeItem("covo_admin");
    setAuthed(false);
  }

  // ── Login ──
  if (!authed) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center p-4">
        <div className="bg-bg-card border border-line rounded-xl shadow-2xl w-full max-w-sm p-8">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-full bg-covo-gold/10 flex items-center justify-center mx-auto mb-3">
              <Lock className="w-5 h-5 text-covo-gold" />
            </div>
            <h1 className="text-lg font-bold text-ink">Admin Panel</h1>
            <p className="text-xs text-ink-faint mt-1">COVO Projects</p>
          </div>
          <div className="space-y-3">
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="Password"
              className={`w-full bg-bg-base border rounded-md px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none transition-colors ${
                err ? "border-covo-pink" : "border-line focus:border-covo-gold/60"
              }`}
            />
            {err && <p className="text-covo-pink text-xs text-center">Wrong password</p>}
            <button
              onClick={handleLogin}
              className="w-full bg-covo-gold hover:opacity-90 text-black py-2.5 rounded-md text-sm font-semibold transition-opacity"
            >
              Login
            </button>
            <div className="text-center pt-2">
              <BackToSiteButton size="small" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Admin panel ──
  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      {/* Top bar */}
      <header className="bg-bg-card border-b border-line sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BackToSiteButton />
            <span className="text-line hidden sm:inline">|</span>
            <div className="hidden sm:flex items-center gap-2">
              <span className="font-black text-covo-gold text-base tracking-wide">COVO</span>
              <span className="text-line">|</span>
              <span className="text-ink-muted text-xs font-semibold">Admin Panel</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-[11px] text-ink-faint hover:text-ink transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>

        {/* Tabs */}
        <div className="max-w-6xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-covo-gold text-covo-gold"
                  : "border-transparent text-ink-faint hover:text-ink"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full pb-6">
        {activeTab === "developers" && <Developers />}
        {activeTab === "import"     && <ImportExcel />}
        {activeTab === "manage"     && <ManageProjects />}
      </main>

      {/* Bottom Back to Site */}
      <footer className="border-t border-line bg-bg-card">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-center">
          <BackToSiteButton />
        </div>
      </footer>
    </div>
  );
}
