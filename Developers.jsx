import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export default function Developers() {
  const [developers, setDevelopers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedDev, setExpandedDev] = useState(null);
  const [search, setSearch] = useState("");

  // Modals
  const [showAddDev, setShowAddDev] = useState(false);
  const [showAddProject, setShowAddProject] = useState(false);
  const [selectedDevId, setSelectedDevId] = useState(null);

  // Forms
  const [newDevName, setNewDevName] = useState("");
  const [newDevNameEn, setNewDevNameEn] = useState("");
  const [newProject, setNewProject] = useState({
    name: "",
    name_en: "",
    city: "",
    type: "Residential",
    min_price: "",
    delivery_from: "",
  });

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    fetchDevelopers();
  }, []);

  async function fetchDevelopers() {
    setLoading(true);
    const { data, error } = await supabase
      .from("developers")
      .select(`id, name, name_en, projects(id, name, name_en, city, dominant_type, min_price, delivery_from)`)
      .order("name");
    if (!error) setDevelopers(data || []);
    setLoading(false);
  }

  const filtered = developers.filter((d) =>
    d.name?.toLowerCase().includes(search.toLowerCase()) ||
    d.name_en?.toLowerCase().includes(search.toLowerCase())
  );

  async function handleAddDeveloper() {
    if (!newDevName.trim()) return;
    setSaving(true);
    const { error } = await supabase
      .from("developers")
      .insert({ name: newDevName.trim(), name_en: newDevNameEn.trim() });
    setSaving(false);
    if (error) {
      setMsg({ type: "error", text: "حصل خطأ: " + error.message });
    } else {
      setMsg({ type: "success", text: "تم إضافة المطور بنجاح ✅" });
      setNewDevName("");
      setNewDevNameEn("");
      setShowAddDev(false);
      fetchDevelopers();
    }
    setTimeout(() => setMsg(null), 3000);
  }

  async function handleAddProject() {
    if (!newProject.name.trim() || !selectedDevId) return;
    setSaving(true);
    const { error } = await supabase.from("projects").insert({
      name: newProject.name.trim(),
      name_en: newProject.name_en.trim(),
      city: newProject.city.trim(),
      dominant_type: newProject.type,
      min_price: newProject.min_price ? Number(newProject.min_price) : null,
      delivery_from: newProject.delivery_from || null,
      developer_id: selectedDevId,
    });
    setSaving(false);
    if (error) {
      setMsg({ type: "error", text: "حصل خطأ: " + error.message });
    } else {
      setMsg({ type: "success", text: "تم إضافة المشروع بنجاح ✅" });
      setNewProject({ name: "", name_en: "", city: "", type: "Residential", min_price: "", delivery_from: "" });
      setShowAddProject(false);
      fetchDevelopers();
    }
    setTimeout(() => setMsg(null), 3000);
  }

  function openAddProject(devId) {
    setSelectedDevId(devId);
    setShowAddProject(true);
  }

  const devName = developers.find((d) => d.id === selectedDevId)?.name;

  return (
    <div className="p-6 max-w-4xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">المطورين</h1>
          <p className="text-sm text-gray-500 mt-1">{developers.length} مطور • {developers.reduce((s, d) => s + (d.projects?.length || 0), 0)} مشروع</p>
        </div>
        <button
          onClick={() => setShowAddDev(true)}
          className="flex items-center gap-2 bg-[#B8860B] hover:bg-[#9a7009] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <span className="text-lg leading-none">+</span>
          إضافة مطور
        </button>
      </div>

      {/* Toast */}
      {msg && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${msg.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {msg.text}
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث عن مطور..."
          className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#B8860B]/30 focus:border-[#B8860B] pr-10"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-base">🔍</span>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">جاري التحميل...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          {search ? "مفيش نتائج للبحث ده" : "مفيش مطورين لحد دلوقتي"}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((dev) => {
            const isOpen = expandedDev === dev.id;
            const projectCount = dev.projects?.length || 0;
            return (
              <div key={dev.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                {/* Developer Row */}
                <div
                  className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedDev(isOpen ? null : dev.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#B8860B]/10 flex items-center justify-center text-[#B8860B] font-bold text-sm">
                      {dev.name?.charAt(0) || "?"}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{dev.name}</p>
                      {dev.name_en && <p className="text-xs text-gray-400">{dev.name_en}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                      {projectCount} {projectCount === 1 ? "مشروع" : "مشاريع"}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); openAddProject(dev.id); }}
                      className="text-xs bg-[#B8860B]/10 hover:bg-[#B8860B]/20 text-[#B8860B] px-3 py-1.5 rounded-lg transition-colors font-medium"
                    >
                      + مشروع
                    </button>
                    <span className={`text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>▾</span>
                  </div>
                </div>

                {/* Projects */}
                {isOpen && (
                  <div className="border-t border-gray-100 bg-gray-50/50">
                    {projectCount === 0 ? (
                      <div className="px-5 py-4 text-sm text-gray-400 text-center">
                        مفيش مشاريع لحد دلوقتي —{" "}
                        <button onClick={() => openAddProject(dev.id)} className="text-[#B8860B] underline">
                          أضف مشروع
                        </button>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {dev.projects.map((proj) => (
                          <div key={proj.id} className="flex items-center justify-between px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full bg-[#B8860B]/40 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-gray-800">{proj.name}</p>
                                {proj.city && <p className="text-xs text-gray-400">{proj.city}</p>}
                              </div>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              {proj.dominant_type && (
                                <span className={`px-2 py-0.5 rounded-full text-xs ${
                                  proj.dominant_type === "Residential" ? "bg-blue-50 text-blue-600" :
                                  proj.dominant_type === "Commercial" ? "bg-orange-50 text-orange-600" :
                                  "bg-purple-50 text-purple-600"
                                }`}>
                                  {proj.dominant_type === "Residential" ? "سكني" :
                                   proj.dominant_type === "Commercial" ? "تجاري" : "مختلط"}
                                </span>
                              )}
                              {proj.min_price && (
                                <span className="text-gray-400">
                                  من {(proj.min_price / 1_000_000).toFixed(1)}M
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ===== Modal: Add Developer ===== */}
      {showAddDev && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" dir="rtl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">إضافة مطور جديد</h2>
              <button onClick={() => setShowAddDev(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">اسم المطور (عربي) *</label>
                <input
                  type="text"
                  value={newDevName}
                  onChange={(e) => setNewDevName(e.target.value)}
                  placeholder="مثال: شركة سيتي إيدج"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#B8860B]/30 focus:border-[#B8860B]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">اسم المطور (إنجليزي)</label>
                <input
                  type="text"
                  value={newDevNameEn}
                  onChange={(e) => setNewDevNameEn(e.target.value)}
                  placeholder="مثال: City Edge"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#B8860B]/30 focus:border-[#B8860B]"
                  dir="ltr"
                />
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
              <button
                onClick={handleAddDeveloper}
                disabled={saving || !newDevName.trim()}
                className="flex-1 bg-[#B8860B] hover:bg-[#9a7009] disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                {saving ? "جاري الحفظ..." : "حفظ المطور"}
              </button>
              <button onClick={() => setShowAddDev(false)} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Modal: Add Project ===== */}
      {showAddProject && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" dir="rtl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900">إضافة مشروع جديد</h2>
                {devName && <p className="text-xs text-gray-400 mt-0.5">تحت: {devName}</p>}
              </div>
              <button onClick={() => setShowAddProject(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">اسم المشروع (عربي) *</label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  placeholder="مثال: مدينتي"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#B8860B]/30 focus:border-[#B8860B]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">اسم المشروع (إنجليزي)</label>
                <input
                  type="text"
                  value={newProject.name_en}
                  onChange={(e) => setNewProject({ ...newProject, name_en: e.target.value })}
                  placeholder="مثال: Madinaty"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#B8860B]/30 focus:border-[#B8860B]"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">المدينة</label>
                <input
                  type="text"
                  value={newProject.city}
                  onChange={(e) => setNewProject({ ...newProject, city: e.target.value })}
                  placeholder="مثال: القاهرة الجديدة"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#B8860B]/30 focus:border-[#B8860B]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">نوع المشروع</label>
                <select
                  value={newProject.type}
                  onChange={(e) => setNewProject({ ...newProject, type: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#B8860B]/30 focus:border-[#B8860B] bg-white"
                >
                  <option value="Residential">سكني</option>
                  <option value="Commercial">تجاري</option>
                  <option value="Mixed">مختلط</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">أدنى سعر (جنيه)</label>
                <input
                  type="number"
                  value={newProject.min_price}
                  onChange={(e) => setNewProject({ ...newProject, min_price: e.target.value })}
                  placeholder="مثال: 3500000"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#B8860B]/30 focus:border-[#B8860B]"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">تسليم من (سنة)</label>
                <input
                  type="number"
                  value={newProject.delivery_from}
                  onChange={(e) => setNewProject({ ...newProject, delivery_from: e.target.value })}
                  placeholder="مثال: 2026"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#B8860B]/30 focus:border-[#B8860B]"
                  dir="ltr"
                />
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
              <button
                onClick={handleAddProject}
                disabled={saving || !newProject.name.trim()}
                className="flex-1 bg-[#B8860B] hover:bg-[#9a7009] disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                {saving ? "جاري الحفظ..." : "حفظ المشروع"}
              </button>
              <button onClick={() => setShowAddProject(false)} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
