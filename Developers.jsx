import { useState, useEffect, useMemo } from "react";
import { supabase } from "../../lib/supabase";
import { Search, Plus, ChevronDown, X, Loader2 } from "lucide-react";

// ─── Helpers ────────────────────────────────────────────────
function getCategories(raw) {
  if (!raw) return ["residential"];
  const t = raw.toLowerCase();
  const cats = [];
  if (t.includes("residential") || t.includes("coastal")) cats.push("residential");
  if (t.includes("commercial") || t.includes("admin") || t.includes("medical")) cats.push("commercial");
  if (t === "mixed") return ["residential", "commercial"];
  return cats.length ? cats : ["residential"];
}

function typeLabel(raw) {
  const cats = getCategories(raw);
  if (cats.length === 2) return "Res & Com";
  if (cats[0] === "commercial") return "Commercial";
  return "Residential";
}

function typeBadgeClass(raw) {
  const cats = getCategories(raw);
  if (cats.length === 2) return "bg-purple-500/10 text-purple-400 border-purple-500/20";
  if (cats[0] === "commercial") return "bg-orange-500/10 text-orange-400 border-orange-500/20";
  return "bg-covo-teal/10 text-covo-teal border-covo-teal/20";
}

// ─── Logo component ─────────────────────────────────────────
function DevLogo({ name, url, size = 36 }) {
  const [failed, setFailed] = useState(false);
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  const showImg = url && !failed;
  return (
    <div
      style={{ width: size, height: size }}
      className="shrink-0 rounded-full bg-white border border-line flex items-center justify-center overflow-hidden"
    >
      {showImg ? (
        <img
          src={url}
          alt=""
          onError={() => setFailed(true)}
          className="w-full h-full object-contain p-1"
          loading="lazy"
        />
      ) : (
        <span className="text-covo-gold font-bold" style={{ fontSize: size * 0.4 }}>
          {initial}
        </span>
      )}
    </div>
  );
}

export default function Developers() {
  const [developers, setDevelopers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [expanded, setExpanded] = useState(null);

  // Add developer
  const [showAddDev, setShowAddDev] = useState(false);
  const [newDev, setNewDev] = useState({ name: "", logo_url: "" });
  const [savingDev, setSavingDev] = useState(false);

  // Add project
  const [showAddProj, setShowAddProj] = useState(false);
  const [targetDev, setTargetDev] = useState(null);
  const [newProj, setNewProj] = useState({ name: "", city: "", type: "Residential" });
  const [savingProj, setSavingProj] = useState(false);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const { data: devs, error: devErr } = await supabase
        .from("developers")
        .select("id, name, logo_url")
        .order("name");
      if (devErr) throw devErr;

      const { data: projs, error: projErr } = await supabase
        .from("projects")
        .select("id, name, city, dominant_type, developer_id, developer_name")
        .order("name");
      if (projErr) throw projErr;

      const projectsByDev = {};
      for (const p of projs || []) {
        const key = p.developer_id;
        if (!projectsByDev[key]) projectsByDev[key] = [];
        projectsByDev[key].push(p);
      }

      setDevelopers(
        (devs || []).map((d) => ({ ...d, projects: projectsByDev[d.id] || [] }))
      );
    } catch (e) {
      console.error(e);
      setError(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(() => {
    return developers.filter((dev) => {
      const matchSearch = !search || dev.name.toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;
      if (typeFilter === "all") return true;
      return dev.projects.some((p) => getCategories(p.dominant_type).includes(typeFilter));
    });
  }, [developers, search, typeFilter]);

  const totalProjects = filtered.reduce((s, d) => s + d.projects.length, 0);

  async function handleAddDev() {
    if (!newDev.name.trim()) return;
    setSavingDev(true);
    try {
      const { error: e } = await supabase.from("developers").insert({
        name: newDev.name.trim(),
        logo_url: newDev.logo_url.trim() || null,
      });
      if (e) throw e;
      setNewDev({ name: "", logo_url: "" });
      setShowAddDev(false);
      await fetchData();
    } catch (e) {
      alert("Error: " + e.message);
    } finally {
      setSavingDev(false);
    }
  }

  function openAddProject(dev) {
    setTargetDev(dev);
    setShowAddProj(true);
  }

  async function handleAddProj() {
    if (!newProj.name.trim() || !targetDev) return;
    setSavingProj(true);
    try {
      const cats = getCategories(newProj.type);
      const { error: e } = await supabase.from("projects").insert({
        name: newProj.name.trim(),
        city: newProj.city.trim() || null,
        developer_id: targetDev.id,
        developer_name: targetDev.name,
        dominant_type: cats.length === 2 ? "mixed" : cats[0],
        is_residential: cats.includes("residential"),
        is_commercial: cats.includes("commercial"),
        logo_url: targetDev.logo_url || null,
      });
      if (e) throw e;
      setNewProj({ name: "", city: "", type: "Residential" });
      setShowAddProj(false);
      await fetchData();
    } catch (e) {
      alert("Error: " + e.message);
    } finally {
      setSavingProj(false);
    }
  }

  const TYPE_FILTERS = [
    { id: "all", label: "All" },
    { id: "residential", label: "Residential" },
    { id: "commercial", label: "Commercial" },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-ink">Developers</h1>
          <p className="text-xs text-ink-faint mt-1">
            {loading ? "Loading…" : `${filtered.length} developers · ${totalProjects} projects`}
          </p>
        </div>
        <button
          onClick={() => setShowAddDev(true)}
          className="flex items-center gap-1.5 bg-covo-gold hover:opacity-90 text-black px-3.5 py-2 rounded-md text-xs font-semibold transition-opacity"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Developer
        </button>
      </div>

      {/* Search + filter */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search developers..."
            className="w-full bg-bg-base border border-line rounded-md pl-9 pr-3 py-2 text-xs text-ink placeholder:text-ink-faint focus:outline-none focus:border-covo-gold/60"
          />
        </div>
        <div className="flex gap-1.5">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setTypeFilter(f.id)}
              className={`px-3 py-2 rounded-md text-xs font-semibold border transition-colors ${
                typeFilter === f.id
                  ? "bg-covo-gold text-black border-covo-gold"
                  : "bg-bg-base text-ink-muted border-line hover:text-ink"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-ink-faint text-sm">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Loading from database…
        </div>
      ) : error ? (
        <div className="text-center py-20">
          <p className="text-covo-pink text-sm mb-2">Failed to load: {error}</p>
          <button onClick={fetchData} className="text-xs text-covo-gold underline">
            Try again
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-ink-faint text-sm">No results</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((dev) => {
            const isOpen = expanded === dev.id;
            const visibleProjects =
              typeFilter === "all"
                ? dev.projects
                : dev.projects.filter((p) => getCategories(p.dominant_type).includes(typeFilter));
            const resCount = dev.projects.filter((p) => getCategories(p.dominant_type).includes("residential")).length;
            const comCount = dev.projects.filter((p) => getCategories(p.dominant_type).includes("commercial")).length;

            return (
              <div key={dev.id} className="bg-bg-card border border-line rounded-lg overflow-hidden">
                <div
                  className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-bg-hover transition-colors"
                  onClick={() => setExpanded(isOpen ? null : dev.id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <DevLogo name={dev.name} url={dev.logo_url} size={36} />
                    <p className="text-sm font-semibold text-ink truncate">{dev.name}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {resCount > 0 && (
                      <span className="text-[10px] bg-covo-teal/10 text-covo-teal border border-covo-teal/20 px-2 py-0.5 rounded-full font-semibold">
                        {resCount} Res
                      </span>
                    )}
                    {comCount > 0 && (
                      <span className="text-[10px] bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded-full font-semibold">
                        {comCount} Com
                      </span>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); openAddProject(dev); }}
                      className="text-[10px] bg-bg-base hover:bg-covo-gold/10 hover:text-covo-gold text-ink-muted border border-line px-2.5 py-1 rounded transition-colors font-semibold"
                    >
                      + Project
                    </button>
                    <ChevronDown className={`w-4 h-4 text-ink-faint transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t border-line bg-bg-base/40">
                    {visibleProjects.length === 0 ? (
                      <p className="text-center text-xs text-ink-faint py-4">
                        No projects in this category
                      </p>
                    ) : (
                      <div className="divide-y divide-line/40">
                        {visibleProjects.map((proj) => (
                          <div key={proj.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-bg-hover/40">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-1.5 h-1.5 rounded-full bg-covo-gold/40 shrink-0" />
                              <div className="min-w-0">
                                <p className="text-xs text-ink font-medium truncate">{proj.name}</p>
                                {proj.city && <p className="text-[10px] text-ink-faint">{proj.city}</p>}
                              </div>
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${typeBadgeClass(proj.dominant_type)}`}>
                              {typeLabel(proj.dominant_type)}
                            </span>
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

      {showAddDev && (
        <Modal title="Add New Developer" onClose={() => setShowAddDev(false)}>
          <div className="space-y-3">
            <Field label="Developer Name *">
              <input
                type="text"
                value={newDev.name}
                onChange={(e) => setNewDev({ ...newDev, name: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && handleAddDev()}
                placeholder="e.g. City Edge"
                autoFocus
                className="w-full bg-bg-base border border-line rounded-md px-3 py-2 text-xs text-ink placeholder:text-ink-faint focus:outline-none focus:border-covo-gold/60"
              />
            </Field>
            <Field label="Logo URL (optional)">
              <input
                type="text"
                value={newDev.logo_url}
                onChange={(e) => setNewDev({ ...newDev, logo_url: e.target.value })}
                placeholder="/logos/CityEdge.png"
                className="w-full bg-bg-base border border-line rounded-md px-3 py-2 text-[11px] text-ink placeholder:text-ink-faint focus:outline-none focus:border-covo-gold/60"
              />
              <p className="text-[10px] text-ink-faint mt-1">Path like /logos/Name.png or a full URL</p>
            </Field>
            {newDev.name && (
              <div className="flex items-center gap-3 p-3 bg-bg-base border border-line rounded-md">
                <DevLogo name={newDev.name} url={newDev.logo_url} size={36} />
                <span className="text-sm text-ink">{newDev.name}</span>
              </div>
            )}
          </div>
          <ModalFooter onCancel={() => setShowAddDev(false)} onSave={handleAddDev} saving={savingDev} disabled={!newDev.name.trim()} />
        </Modal>
      )}

      {showAddProj && targetDev && (
        <Modal title="Add Project" subtitle={targetDev.name} onClose={() => setShowAddProj(false)}>
          <div className="space-y-3">
            <Field label="Project Name *">
              <input
                type="text"
                value={newProj.name}
                onChange={(e) => setNewProj({ ...newProj, name: e.target.value })}
                placeholder="e.g. Madinaty"
                autoFocus
                className="w-full bg-bg-base border border-line rounded-md px-3 py-2 text-xs text-ink placeholder:text-ink-faint focus:outline-none focus:border-covo-gold/60"
              />
            </Field>
            <Field label="City">
              <input
                type="text"
                value={newProj.city}
                onChange={(e) => setNewProj({ ...newProj, city: e.target.value })}
                placeholder="e.g. New Cairo"
                className="w-full bg-bg-base border border-line rounded-md px-3 py-2 text-xs text-ink placeholder:text-ink-faint focus:outline-none focus:border-covo-gold/60"
              />
            </Field>
            <Field label="Type">
              <select
                value={newProj.type}
                onChange={(e) => setNewProj({ ...newProj, type: e.target.value })}
                className="w-full bg-bg-base border border-line rounded-md px-3 py-2 text-xs text-ink focus:outline-none focus:border-covo-gold/60"
              >
                <option value="Residential">Residential</option>
                <option value="Coastal">Coastal</option>
                <option value="Commercial">Commercial</option>
                <option value="Administration">Administration</option>
                <option value="Medical">Medical</option>
                <option value="Commercial - Administrative">Commercial - Administrative</option>
                <option value="Commercial - Medical - Administrative">Commercial - Medical - Administrative</option>
                <option value="Residential - Commercial">Residential - Commercial</option>
              </select>
            </Field>
          </div>
          <ModalFooter onCancel={() => setShowAddProj(false)} onSave={handleAddProj} saving={savingProj} disabled={!newProj.name.trim()} />
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, subtitle, children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-bg-card border border-line rounded-lg shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-line">
          <div>
            <h2 className="text-sm font-bold text-ink">{title}</h2>
            {subtitle && <p className="text-[11px] text-ink-faint mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="text-ink-faint hover:text-ink">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-ink-muted mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function ModalFooter({ onCancel, onSave, saving, disabled }) {
  return (
    <div className="flex gap-2 px-5 py-3 border-t border-line -mx-5 -mb-4 mt-4">
      <button
        onClick={onSave}
        disabled={disabled || saving}
        className="flex-1 bg-covo-gold hover:opacity-90 disabled:opacity-40 text-black py-2 rounded-md text-xs font-semibold transition-opacity flex items-center justify-center gap-1.5"
      >
        {saving && <Loader2 className="w-3 h-3 animate-spin" />}
        Save
      </button>
      <button
        onClick={onCancel}
        className="flex-1 bg-bg-base border border-line text-ink-muted py-2 rounded-md text-xs font-semibold hover:text-ink"
      >
        Cancel
      </button>
    </div>
  );
}
