import { useState } from "react";
import { Link } from "react-router-dom";
import ImportExcel from "./ImportExcel";
import ManageProjects from "./ManageProjects";
import Developers from "./Developers";

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "admin123";

const TABS = [
  { id: "developers", label: "Developers",      icon: "🏢" },
  { id: "import",     label: "Import Data",     icon: "📤" },
  { id: "manage",     label: "Manage Projects", icon: "⚙️" },
];

// Reusable "Back to Site" button
function BackToSiteButton({ variant = "default" }) {
  const base = "inline-flex items-center gap-2 text-sm font-medium transition-colors";
  const styles = variant === "primary"
    ? "bg-[#B8860B] hover:bg-[#9a7009] text-white px-4 py-2 rounded-lg"
    : "text-gray-600 hover:text-[#B8860B]";
  return (
    <Link to="/" className={`${base} ${styles}`}>
      <span>←</span>
      Back to Site
    </Link>
  );
}

export default function AdminLayout() {
  const [authed, setAuthed] = useState(
    () => sessionStorage.getItem("covo_admin") === "1"
  );
  const [pw, setPw]   = useState("");
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

  /* ── Login screen ── */
  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8">
          <div className="text-center mb-8">
            <div className="text-4xl mb-3">🔐</div>
            <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
            <p className="text-sm text-gray-400 mt-1">COVO Projects</p>
          </div>
          <div className="space-y-4">
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="Password"
              className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-colors ${
                err
                  ? "border-red-300 focus:ring-red-200"
                  : "border-gray-200 focus:ring-[#B8860B]/30 focus:border-[#B8860B]"
              }`}
            />
            {err && <p className="text-red-500 text-xs text-center">Wrong password</p>}
            <button
              onClick={handleLogin}
              className="w-full bg-[#B8860B] hover:bg-[#9a7009] text-white py-3 rounded-xl text-sm font-medium transition-colors"
            >
              Login
            </button>
            <div className="text-center pt-2">
              <BackToSiteButton />
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Admin panel ── */
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BackToSiteButton variant="primary" />
            <span className="text-gray-200 hidden sm:inline">|</span>
            <div className="hidden sm:flex items-center gap-2">
              <span className="font-bold text-[#B8860B] text-lg">COVO</span>
              <span className="text-gray-300 text-sm">|</span>
              <span className="text-gray-600 text-sm font-medium">Admin Panel</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors"
          >
            Logout ↩
          </button>
        </div>

        {/* Tabs */}
        <div className="max-w-6xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-[#B8860B] text-[#B8860B]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <span>{tab.icon}</span>
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
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-center">
          <BackToSiteButton variant="primary" />
        </div>
      </footer>
    </div>
  );
}
