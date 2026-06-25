import { useState } from "react";
import { Navigate } from "react-router-dom";
import ImportExcel from "./ImportExcel";
import ManageProjects from "./ManageProjects";
import Developers from "./Developers";

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "admin123";

const TABS = [
  { id: "developers", label: "المطورين", icon: "🏢" },
  { id: "import",     label: "استيراد بيانات", icon: "📤" },
  { id: "manage",     label: "إدارة المشاريع", icon: "⚙️" },
];

export default function AdminLayout() {
  const [authed, setAuthed] = useState(
    () => sessionStorage.getItem("covo_admin") === "1"
  );
  const [pw, setPw]         = useState("");
  const [err, setErr]       = useState(false);
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir="rtl">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8">
          <div className="text-center mb-8">
            <div className="text-4xl mb-3">🔐</div>
            <h1 className="text-xl font-bold text-gray-900">لوحة الإدارة</h1>
            <p className="text-sm text-gray-400 mt-1">COVO Projects</p>
          </div>
          <div className="space-y-4">
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="كلمة المرور"
              className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-colors ${
                err
                  ? "border-red-300 focus:ring-red-200"
                  : "border-gray-200 focus:ring-[#B8860B]/30 focus:border-[#B8860B]"
              }`}
            />
            {err && <p className="text-red-500 text-xs text-center">كلمة المرور غلط</p>}
            <button
              onClick={handleLogin}
              className="w-full bg-[#B8860B] hover:bg-[#9a7009] text-white py-3 rounded-xl text-sm font-medium transition-colors"
            >
              دخول
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Admin panel ── */
  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#B8860B] text-lg">COVO</span>
            <span className="text-gray-300 text-sm">|</span>
            <span className="text-gray-600 text-sm font-medium">لوحة الإدارة</span>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors"
          >
            خروج ↩
          </button>
        </div>

        {/* Tabs */}
        <div className="max-w-6xl mx-auto px-4 flex gap-1 pb-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
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
      <main className="max-w-6xl mx-auto">
        {activeTab === "developers" && <Developers />}
        {activeTab === "import"     && <ImportExcel />}
        {activeTab === "manage"     && <ManageProjects />}
      </main>
    </div>
  );
}
