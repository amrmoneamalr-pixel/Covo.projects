// AUTO-GENERATED from Developers_with_logos.xlsx
import { useState, useMemo } from "react";
import DeveloperLogo from "../../components/DeveloperLogo";

function getCategories(raw) {
  if (!raw) return ["residential"];
  const t = raw.toLowerCase();
  const cats = [];
  if (t.includes("residential") || t.includes("coastal")) cats.push("residential");
  if (t.includes("commercial") || t.includes("admin") || t.includes("medical")) cats.push("commercial");
  return cats.length ? cats : ["residential"];
}

function typeLabel(raw) {
  const cats = getCategories(raw);
  if (cats.length === 2) return "Residential & Commercial";
  if (cats[0] === "commercial") return "Commercial";
  return "Residential";
}

function typeBadgeClass(raw) {
  const cats = getCategories(raw);
  if (cats.length === 2) return "bg-purple-50 text-purple-700 border-purple-200";
  if (cats[0] === "commercial") return "bg-orange-50 text-orange-700 border-orange-200";
  return "bg-blue-50 text-blue-700 border-blue-200";
}

const RAW_DEVELOPERS = [{"name": "A Capital", "logo": "https://www.google.com/s2/favicons?domain=acapitaleg.com&sz=128", "projects": [{"name": "Marriott Residence", "city": "Cairo", "location": "Heliopolis", "type": "Residential"}]}, {"name": "ADH", "logo": "https://www.google.com/s2/favicons?domain=adhgroup.com&sz=128", "projects": [{"name": "Nyoum Mostakbal", "city": "New Cairo", "location": "Mostakbal City", "type": "Residential"}]}, {"name": "Afaq Developments", "logo": "https://www.google.com/s2/favicons?domain=afaqdevelopments.com&sz=128", "projects": [{"name": "Amorada", "city": "New Cairo", "location": "Ard Algam3yat", "type": "Residential"}]}, {"name": "Ajna Developments", "logo": "https://www.google.com/s2/favicons?domain=ajnadevelopments.com&sz=128", "projects": [{"name": "East ville", "city": "New Cairo", "location": "6th settlement", "type": "Residential"}]}, {"name": "Al Jazi Egypt", "logo": "https://www.google.com/s2/favicons?domain=aljazi-egypt.com&sz=128", "projects": [{"name": "Al jazi", "city": "New Cairo", "location": "Fifth Settlement", "type": "Residential"}]}, {"name": "Al Qamzi", "logo": "https://www.google.com/s2/favicons?domain=alqamzidevelopments.com&sz=128", "projects": [{"name": "Eastshire", "city": "New Cairo", "location": "Fifth settlement", "type": "Residential"}]}, {"name": "Al-Ahly For Real Estate Development ( Sabbour )", "logo": "https://www.google.com/s2/favicons?domain=alahlysabbour.com&sz=128", "projects": [{"name": "At East", "city": "Mostakbal city", "location": "Mostakbal City", "type": "Residential"}, {"name": "Green Square", "city": "Mostakbal city", "location": "Mostakbal City", "type": "Residential"}, {"name": "L'Avenir", "city": "Mostakbal city", "location": "Mostakbal City", "type": "Residential"}, {"name": "Layan", "city": "New Cairo", "location": "Golden Square", "type": "Residential"}, {"name": "Rare", "city": "Mostakbal city", "location": "Mostakbal City", "type": "Residential"}, {"name": "The Square", "city": "New Cairo", "location": "Fifth Settlement", "type": "Residential"}]}, {"name": "Al-Marasem", "logo": "https://www.google.com/s2/favicons?domain=almarasem.com.eg&sz=128", "projects": [{"name": "Fifth Square", "city": "New Cairo", "location": "Fifth Settlement", "type": "Residential"}, {"name": "Moon Residence", "city": "New Cairo", "location": "Fifth Settlement", "type": "Residential"}]}, {"name": "Aljar Development", "logo": "https://www.google.com/s2/favicons?domain=aljardevelopments.com&sz=128", "projects": [{"name": "Al Jar Sherton", "city": "Cairo", "location": "Sheraton Heliopolis", "type": "Residential"}, {"name": "Al Jar Brtitish District", "city": "El Shorouk", "location": "El Shorouk", "type": "Residential"}, {"name": "Valore El Thawra", "city": "Cairo", "location": "Heliopolis", "type": "Residential"}]}, {"name": "Arabia Holding", "logo": "https://www.google.com/s2/favicons?domain=arabiaholding.com&sz=128", "projects": [{"name": "Galleria Moon Valley Residence", "city": "New Cairo", "location": "Golden Square", "type": "Residential"}]}, {"name": "Arabian Mark", "logo": "https://www.google.com/s2/favicons?domain=arabianmark.com&sz=128", "projects": [{"name": "Rewaq", "city": "New Cairo", "location": "Fifth Settlement", "type": "Residential"}]}, {"name": "Ardic", "logo": "https://www.google.com/s2/favicons?domain=ardicdevelopments.com&sz=128", "projects": [{"name": "Vera", "city": "Mostakbal city", "location": "Mostakbal City", "type": "Residential"}]}, {"name": "Ashrafeya", "logo": "https://www.google.com/s2/favicons?domain=ashrafeya.com&sz=128", "projects": [{"name": "Ashrafeya Residence", "city": "New Cairo", "location": "Fifth Settlement", "type": "Residential"}]}, {"name": "Beta Egypt", "logo": "https://www.google.com/s2/favicons?domain=betaegypt.com&sz=128", "projects": [{"name": "Beta Greens", "city": "Mostakbal city", "location": "Mostakbal City", "type": "Residential"}]}, {"name": "Brouq Developments", "logo": "https://www.google.com/s2/favicons?domain=brouqdevelopments.com&sz=128", "projects": [{"name": "Brouq", "city": "New Cairo", "location": "Fifth settlement", "type": "Residential"}]}, {"name": "Dar El Alamia", "logo": "https://www.google.com/s2/favicons?domain=dareloalamia.com&sz=128", "projects": [{"name": "Acasa mia", "city": "New Cairo", "location": "Andalus", "type": "Residential"}]}, {"name": "Dorra Group", "logo": "https://www.google.com/s2/favicons?domain=dorra.com&sz=128", "projects": [{"name": "The Address East", "city": "New Cairo", "location": "Fifth Settlement", "type": "Residential"}]}, {"name": "El Batal Development", "logo": "https://www.google.com/s2/favicons?domain=elbatalgroup.com&sz=128", "projects": [{"name": "Rock Vera", "city": "New Cairo", "location": "Fifth Settlement", "type": "Residential"}]}, {"name": "El Hazek Group", "logo": "https://www.google.com/s2/favicons?domain=elhazekgroup.com&sz=128", "projects": [{"name": "Lake View", "city": "New Cairo", "location": "Fifth Settlement", "type": "Residential"}]}, {"name": "El Reedy Group", "logo": "https://www.google.com/s2/favicons?domain=elreedygroup.com&sz=128", "projects": [{"name": "Azzar infinty", "city": "New Cairo", "location": "Golden Square", "type": "Residential"}, {"name": "Dijar", "city": "New Cairo", "location": "Ard Algam3yat", "type": "Residential"}, {"name": "Azzar new cairo", "city": "New Cairo", "location": "Golden Square", "type": "Residential"}]}, {"name": "Grand plaza", "logo": "https://www.google.com/s2/favicons?domain=grandplazadevelopments.com&sz=128", "projects": [{"name": "La Mirada", "city": "Mostakbal city", "location": "Mostakbal City", "type": "Residential"}]}, {"name": "Hassan Allam", "logo": "https://www.google.com/s2/favicons?domain=hassanallam.com&sz=128", "projects": [{"name": "Central Park", "city": "Mostakbal city", "location": "Mostakbal City", "type": "Residential"}, {"name": "Hap Town", "city": "Mostakbal city", "location": "Mostakbal City", "type": "Residential"}, {"name": "Lake Residence", "city": "New Cairo", "location": "Mostakbal City", "type": "Residential"}, {"name": "swan lake residence", "city": "New Cairo", "location": "Fifth Settlement", "type": "Residential"}]}, {"name": "HDP", "logo": "https://www.google.com/s2/favicons?domain=hdp-eg.com&sz=128", "projects": [{"name": "Grand Lane", "city": "New Cairo", "location": "6th settlement", "type": "Residential"}]}, {"name": "Horizon Egypt Developments", "logo": "https://www.google.com/s2/favicons?domain=horizonegyptdev.com&sz=128", "projects": [{"name": "Saada Boutique", "city": "New Cairo", "location": "6th settlement", "type": "Residential"}, {"name": "Saada", "city": "New Cairo", "location": "Suez Road", "type": "Residential"}]}, {"name": "Hyde Park", "logo": "https://www.google.com/s2/favicons?domain=hydeparkdevelopments.com&sz=128", "projects": [{"name": "Hyde Park Central", "city": "New Cairo", "location": "6th settlement", "type": "Residential"}, {"name": "Hyde Park New Cairo", "city": "New Cairo", "location": "Fifth Settlement", "type": "Residential"}]}, {"name": "IL Cazar", "logo": "https://www.google.com/s2/favicons?domain=ilcazardevelopments.com&sz=128", "projects": [{"name": "Vea", "city": "New Cairo", "location": "6th settlement", "type": "Residential"}, {"name": "Glen", "city": "New Cairo", "location": "6th settlement", "type": "Residential"}, {"name": "Crest", "city": "New Cairo", "location": "Ard Algam3yat", "type": "Residential"}, {"name": "Creek Town", "city": "New Cairo", "location": "Fifth Settlement", "type": "Residential"}, {"name": "Stoda", "city": "Cairo", "location": "Heliopolis", "type": "Residential"}]}, {"name": "IMKAN Misr  ( CGP )", "logo": "https://www.google.com/s2/favicons?domain=imkan.ae&sz=128", "projects": [{"name": "Al Buroj", "city": "El Shorouk", "location": "El Shorouk", "type": "Residential"}]}, {"name": "Khalid Sabry Holding", "logo": "https://www.google.com/s2/favicons?domain=khalidsabryholding.com&sz=128", "projects": [{"name": "ROSAIL", "city": "New Cairo", "location": "Mostakbal City", "type": "Residential"}]}, {"name": "La Vista Developments", "logo": "https://www.google.com/s2/favicons?domain=lavistadevelopments.com&sz=128", "projects": [{"name": "EL Patio Casa", "city": "El Shorouk", "location": "El Shorouk", "type": "Residential"}, {"name": "EL Patio 5 East", "city": "El Shorouk", "location": "El Shorouk", "type": "Residential"}, {"name": "EL Patio prime", "city": "El Shorouk", "location": "El Shorouk", "type": "Residential"}, {"name": "EL Patio Sola", "city": "El Shorouk", "location": "El Shorouk", "type": "Residential"}, {"name": "EL Patio Hills", "city": "New Cairo", "location": "6th settlement", "type": "Residential"}, {"name": "EL Patio Riva", "city": "New Cairo", "location": "6th settlement", "type": "Residential"}, {"name": "EL Patio Vida", "city": "New Cairo", "location": "6th settlement", "type": "Residential"}, {"name": "EL Patio 7", "city": "New Cairo", "location": "Fifth Settlement", "type": "Residential"}, {"name": "EL Patio Town", "city": "New Cairo", "location": "Fifth Settlement", "type": "Residential"}, {"name": "EL Patio Oro", "city": "New Cairo", "location": "Golden Square", "type": "Residential"}]}, {"name": "Landmark Sabbour", "logo": "https://www.google.com/s2/favicons?domain=landmarksabbour.com&sz=128", "projects": [{"name": "One Ninety", "city": "New Cairo", "location": "South 90 Street", "type": "Residential"}, {"name": "Stei8ht", "city": "New Cairo", "location": "Fifth settlement", "type": "Residential"}]}, {"name": "M Square", "logo": "https://www.google.com/s2/favicons?domain=msquare-developments.com&sz=128", "projects": [{"name": "TRIO GARDENS", "city": "New Cairo", "location": "Fifth Settlement", "type": "Residential"}]}, {"name": "Madinet Nasr Housing and Development ( MNHD )", "logo": "https://www.google.com/s2/favicons?domain=mnhd.com&sz=128", "projects": [{"name": "Butterfly", "city": "Mostakbal city", "location": "Mostakbal City", "type": "Residential"}, {"name": "Sarai", "city": "New Cairo", "location": "Suez Road", "type": "Residential"}, {"name": "Taj City", "city": "New Cairo", "location": "Suez Road", "type": "Residential"}, {"name": "Talala", "city": "El Shorouk", "location": "El Shorouk", "type": "Residential"}, {"name": "Kinda", "city": "Cairo", "location": "Heliopolis", "type": "Residential"}]}, {"name": "Marakez", "logo": "https://www.google.com/s2/favicons?domain=marakez.net&sz=128", "projects": [{"name": "DISTRICT 5", "city": "New Cairo", "location": "New Katameya", "type": "Residential"}]}, {"name": "Misr Italia", "logo": "https://www.google.com/s2/favicons?domain=misritaliaproperties.com&sz=128", "projects": [{"name": "Il Bosco city", "city": "Mostakbal city", "location": "Mostakbal City", "type": "Residential"}, {"name": "La Nouva Vista", "city": "New Cairo", "location": "Fifth Settlement", "type": "Residential"}]}, {"name": "Mountain View", "logo": "https://www.google.com/s2/favicons?domain=mountainviewegypt.com&sz=128", "projects": [{"name": "1.1", "city": "New Cairo", "location": "Fifth Settlement", "type": "Residential"}, {"name": "Aliva", "city": "Mostakbal city", "location": "Mostakbal City", "type": "Residential"}, {"name": "Creek view", "city": "New Cairo", "location": "Fifth Settlement", "type": "Residential"}, {"name": "Mountain View Hyde Park", "city": "New Cairo", "location": "Fifth Settlement", "type": "Residential"}, {"name": "Mountain View Icity", "city": "New Cairo", "location": "Fifth Settlement", "type": "Residential"}]}, {"name": "Nawassy Development", "logo": "https://www.google.com/s2/favicons?domain=nawassy.com&sz=128", "projects": [{"name": "Nest", "city": "New Cairo", "location": "6th settlement", "type": "Residential"}]}, {"name": "Nile Developments", "logo": "https://www.google.com/s2/favicons?domain=niledevelopments.com&sz=128", "projects": [{"name": "Nile Boulevard", "city": "New Cairo", "location": "North 90 Street", "type": "Residential"}]}, {"name": "Ora Developers", "logo": "https://www.google.com/s2/favicons?domain=oradevelopers.com&sz=128", "projects": [{"name": "Zed East", "city": "New Cairo", "location": "6th settlement", "type": "Residential"}]}, {"name": "OUD", "logo": "https://www.google.com/s2/favicons?domain=oud-egypt.com&sz=128", "projects": [{"name": "Azadir", "city": "New Cairo", "location": "Ard Algam3yat", "type": "Residential"}]}, {"name": "Palm Hills", "logo": "https://www.google.com/s2/favicons?domain=palmhillsdevelopments.com&sz=128", "projects": [{"name": "capital gardens", "city": "New Cairo", "location": "Suez Road", "type": "Residential"}, {"name": "Palm Hills Katameya Extension (PK2)", "city": "New Cairo", "location": "Golden Square", "type": "Residential"}, {"name": "Palm Hills New Cairo", "city": "New Cairo", "location": "Fifth Settlement", "type": "Residential"}]}, {"name": "Pioneers Real Estate ( PRE )", "logo": "https://www.google.com/s2/favicons?domain=pioneers-holding.com&sz=128", "projects": [{"name": "Ivoire Eest", "city": "New Cairo", "location": "Fifth settlement", "type": "Residential"}, {"name": "Stone Residence", "city": "New Cairo", "location": "Fifth Settlement", "type": "Residential"}, {"name": "The Brooks", "city": "New Cairo", "location": "Ring Road - Katameya", "type": "Residential"}, {"name": "Stone Park", "city": "New Cairo", "location": "Ring Road - Katameya", "type": "Residential"}, {"name": "Telal East", "city": "New Cairo", "location": "Fifth Settlement", "type": "Residential"}]}, {"name": "Reportage", "logo": "https://www.google.com/s2/favicons?domain=reportageproperties.com&sz=128", "projects": [{"name": "Monte Napoleon", "city": "Mostakbal city", "location": "Mostakbal City", "type": "Residential"}]}, {"name": "SAG", "logo": "https://www.google.com/s2/favicons?domain=sag-developments.com&sz=128", "projects": [{"name": "ALCA", "city": "New Cairo", "location": "6th settlement", "type": "Residential"}]}, {"name": "Salam", "logo": "https://www.google.com/s2/favicons?domain=salamdevelopments.com&sz=128", "projects": [{"name": "The Residence", "city": "New Cairo", "location": "Fifth Settlement", "type": "Residential"}]}, {"name": "Samco Development", "logo": "https://www.google.com/s2/favicons?domain=samcodevelopments.com&sz=128", "projects": [{"name": "Rivali", "city": "New Cairo", "location": "Ard Algam3yat", "type": "Residential"}]}, {"name": "SED", "logo": "https://www.google.com/s2/favicons?domain=sed-eg.com&sz=128", "projects": [{"name": "Jayd ( SED )", "city": "New Cairo", "location": "Fifth Settlement", "type": "Residential"}, {"name": "tierra", "city": "New Cairo", "location": "6th settlement", "type": "Residential"}]}, {"name": "Sephora Development", "logo": "https://www.google.com/s2/favicons?domain=sephoradevelopments.com&sz=128", "projects": [{"name": "Sephora", "city": "New Cairo", "location": "Ard Algam3yat", "type": "Residential"}]}, {"name": "Serac Development", "logo": "https://www.google.com/s2/favicons?domain=seracdevelopments.com&sz=128", "projects": [{"name": "City Hall", "city": "New Cairo", "location": "North 90 Street", "type": "Residential"}]}, {"name": "Sodic", "logo": "https://www.google.com/s2/favicons?domain=sodic.com&sz=128", "projects": [{"name": "East Vale", "city": "Mostakbal city", "location": "Mostakbal City", "type": "Residential"}, {"name": "Sodic East", "city": "El Shorouk", "location": "El Shorouk", "type": "Residential"}, {"name": "Villette", "city": "New Cairo", "location": "Golden Square", "type": "Residential"}]}, {"name": "Star Light", "logo": "https://www.google.com/s2/favicons?domain=starlightdevelopments.com&sz=128", "projects": [{"name": "Katameya Creeks", "city": "New Cairo", "location": "New Katameya", "type": "Residential"}]}, {"name": "Style Home Development", "logo": "https://www.google.com/s2/favicons?domain=stylehomedevelopments.com&sz=128", "projects": [{"name": "The Icon", "city": "New Cairo", "location": "Ard Algam3yat", "type": "Residential"}, {"name": "The Icon Residence 2", "city": "New Cairo", "location": "Ard Algam3yat", "type": "Residential"}]}, {"name": "Tabarak", "logo": "https://www.google.com/s2/favicons?domain=tabarakholding.com&sz=128", "projects": [{"name": "90 Avenue", "city": "New Cairo", "location": "South 90 Street", "type": "Residential"}]}, {"name": "Tameer Arabian Developments", "logo": "https://www.google.com/s2/favicons?domain=tameerarabian.com&sz=128", "projects": [{"name": "Azad", "city": "New Cairo", "location": "Fifth Settlement", "type": "Residential"}]}, {"name": "Tatweer Misr", "logo": "https://www.google.com/s2/favicons?domain=tatweermisr.com&sz=128", "projects": [{"name": "Bloomfields", "city": "Mostakbal city", "location": "Mostakbal City", "type": "Residential"}, {"name": "scenes", "city": "Mostakbal city", "location": "Mostakbal City", "type": "Residential"}]}, {"name": "TG Development", "logo": "https://www.google.com/s2/favicons?domain=tgdevelopments.com&sz=128", "projects": [{"name": "Palm East ( TG )", "city": "New Cairo", "location": "New Cairo", "type": "Residential"}, {"name": "Palm Island ( TG )", "city": "El Shorouk", "location": "El Shorouk", "type": "Residential"}]}, {"name": "The Address", "logo": "https://www.google.com/s2/favicons?domain=theaddressinvestments.com&sz=128", "projects": [{"name": "The Marq", "city": "New Cairo", "location": "Fifth Settlement", "type": "Residential"}]}, {"name": "Times Development", "logo": "https://www.google.com/s2/favicons?domain=timesdevelopments.com&sz=128", "projects": [{"name": "Aster", "city": "New Cairo", "location": "Golden Square", "type": "Residential"}]}, {"name": "Trio Gardens", "logo": "https://www.google.com/s2/favicons?domain=triogardens.com&sz=128", "projects": [{"name": "Trio", "city": "New Cairo", "location": "Fifth Settlement", "type": "Residential"}]}, {"name": "Vantage Development", "logo": "https://www.google.com/s2/favicons?domain=vantagedevelopments.com&sz=128", "projects": [{"name": "Century City", "city": "New Cairo", "location": "Ard Algam3yat", "type": "Residential"}]}, {"name": "Wadi Degla", "logo": "https://www.google.com/s2/favicons?domain=wadidegla.com&sz=128", "projects": [{"name": "Neopolis", "city": "Mostakbal city", "location": "Mostakbal City", "type": "Residential"}, {"name": "Promenade New Cairo", "city": "New Cairo", "location": "Fifth Settlement", "type": "Residential"}]}, {"name": "Zaghlol Developments", "logo": "https://www.google.com/s2/favicons?domain=zaghloldevelopments.com&sz=128", "projects": [{"name": "Al-Masrawya", "city": "New Cairo", "location": "Fifth Settlement", "type": "Residential"}]}];

export default function Developers() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [expanded, setExpanded] = useState(null);

  const [showAddDev, setShowAddDev] = useState(false);
  const [newDev, setNewDev] = useState({ name: "", logo: "" });
  const [addedDevs, setAddedDevs] = useState([]);

  const [showAddProj, setShowAddProj] = useState(false);
  const [targetDev, setTargetDev] = useState(null);
  const [addedProjects, setAddedProjects] = useState({});
  const [newProj, setNewProj] = useState({ name: "", city: "", location: "", type: "Residential" });

  const allDevelopers = useMemo(() => {
    const merged = [...RAW_DEVELOPERS];
    addedDevs.forEach(d => {
      if (!merged.find(x => x.name === d.name)) merged.push(d);
    });
    return merged.map(dev => {
      const extra = addedProjects[dev.name] || [];
      return extra.length ? { ...dev, projects: [...dev.projects, ...extra] } : dev;
    }).sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
  }, [addedDevs, addedProjects]);

  const filtered = useMemo(() => {
    return allDevelopers.filter(dev => {
      const matchSearch = !search || dev.name.toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;
      if (typeFilter === "all") return true;
      return dev.projects.some(p => getCategories(p.type).includes(typeFilter));
    });
  }, [allDevelopers, search, typeFilter]);

  const totalProjects = filtered.reduce((s, d) => s + d.projects.length, 0);

  function handleAddDev() {
    if (!newDev.name.trim()) return;
    setAddedDevs(prev => [...prev, {
      name: newDev.name.trim(),
      logo: newDev.logo.trim(),
      projects: []
    }]);
    setNewDev({ name: "", logo: "" });
    setShowAddDev(false);
  }

  function handleAddProject() {
    if (!newProj.name.trim() || !targetDev) return;
    setAddedProjects(prev => ({
      ...prev,
      [targetDev]: [...(prev[targetDev] || []), { ...newProj }]
    }));
    setNewProj({ name: "", city: "", location: "", type: "Residential" });
    setShowAddProj(false);
  }

  function openAddProject(devName) {
    setTargetDev(devName);
    setShowAddProj(true);
  }

  const TYPE_FILTERS = [
    { id: "all", label: "All" },
    { id: "residential", label: "Residential" },
    { id: "commercial", label: "Commercial" },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Developers</h1>
          <p className="text-sm text-gray-400 mt-1">
            {filtered.length} developers &bull; {totalProjects} projects
          </p>
        </div>
        <button
          onClick={() => setShowAddDev(true)}
          className="flex items-center gap-2 bg-[#B8860B] hover:bg-[#9a7009] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Add Developer
        </button>
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search developers..."
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#B8860B]/30 focus:border-[#B8860B] pl-9"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {TYPE_FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setTypeFilter(f.id)}
              className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                typeFilter === f.id
                  ? "bg-[#B8860B] text-white border-[#B8860B]"
                  : "bg-white text-gray-600 border-gray-200 hover:border-[#B8860B]/40"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No results found</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(dev => {
            const isOpen = expanded === dev.name;
            const visibleProjects = typeFilter === "all"
              ? dev.projects
              : dev.projects.filter(p => getCategories(p.type).includes(typeFilter));
            const resCount = dev.projects.filter(p => getCategories(p.type).includes("residential")).length;
            const comCount = dev.projects.filter(p => getCategories(p.type).includes("commercial")).length;

            return (
              <div key={dev.name} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div
                  className="flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpanded(isOpen ? null : dev.name)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <DeveloperLogo name={dev.name} url={dev.logo} size={40} />
                    <p className="font-semibold text-gray-900 text-sm truncate">{dev.name}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {resCount > 0 && (
                      <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
                        🏠 {resCount}
                      </span>
                    )}
                    {comCount > 0 && (
                      <span className="text-xs bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-full">
                        🏢 {comCount}
                      </span>
                    )}
                    <button
                      onClick={e => { e.stopPropagation(); openAddProject(dev.name); }}
                      className="text-xs bg-gray-100 hover:bg-[#B8860B]/10 hover:text-[#B8860B] text-gray-600 px-2.5 py-1 rounded-lg transition-colors"
                    >
                      + Project
                    </button>
                    <span className={`text-gray-400 text-xs transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>▾</span>
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t border-gray-100">
                    {visibleProjects.length === 0 ? (
                      <p className="text-center text-sm text-gray-400 py-4">No projects in this category</p>
                    ) : (
                      <div className="divide-y divide-gray-50">
                        {visibleProjects.map((proj, i) => (
                          <div key={i} className="flex items-center justify-between px-5 py-2.5 hover:bg-gray-50/50">
                            <div className="flex items-center gap-2.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-[#B8860B]/30 shrink-0" />
                              <div>
                                <p className="text-sm text-gray-800 font-medium">{proj.name}</p>
                                <p className="text-xs text-gray-400">
                                  {[proj.city, proj.location].filter(Boolean).join(" • ")}
                                </p>
                              </div>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${typeBadgeClass(proj.type)}`}>
                              {typeLabel(proj.type)}
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Add New Developer</h2>
              <button onClick={() => setShowAddDev(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Developer Name *</label>
                <input
                  type="text"
                  value={newDev.name}
                  onChange={e => setNewDev({ ...newDev, name: e.target.value })}
                  onKeyDown={e => e.key === "Enter" && handleAddDev()}
                  placeholder="e.g. City Edge"
                  autoFocus
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#B8860B]/30 focus:border-[#B8860B]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Logo URL (optional)</label>
                <input
                  type="text"
                  value={newDev.logo}
                  onChange={e => setNewDev({ ...newDev, logo: e.target.value })}
                  placeholder="https://www.google.com/s2/favicons?domain=example.com&sz=128"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#B8860B]/30 focus:border-[#B8860B]"
                />
                <p className="text-xs text-gray-400 mt-1">Leave empty to show initial letter</p>
              </div>
              {newDev.name && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <DeveloperLogo name={newDev.name} url={newDev.logo} size={40} />
                  <span className="text-sm text-gray-700">{newDev.name}</span>
                </div>
              )}
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={handleAddDev} disabled={!newDev.name.trim()} className="flex-1 bg-[#B8860B] hover:bg-[#9a7009] disabled:opacity-40 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">Save</button>
              <button onClick={() => setShowAddDev(false)} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showAddProj && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="font-bold text-gray-900">Add Project</h2>
                <p className="text-xs text-gray-400 mt-0.5">{targetDev}</p>
              </div>
              <button onClick={() => setShowAddProj(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Project Name *</label>
                <input type="text" value={newProj.name} onChange={e => setNewProj({...newProj, name: e.target.value})}
                  placeholder="e.g. Madinaty" autoFocus
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#B8860B]/30 focus:border-[#B8860B]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
                <input type="text" value={newProj.city} onChange={e => setNewProj({...newProj, city: e.target.value})}
                  placeholder="e.g. New Cairo"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#B8860B]/30 focus:border-[#B8860B]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Location</label>
                <input type="text" value={newProj.location} onChange={e => setNewProj({...newProj, location: e.target.value})}
                  placeholder="e.g. Fifth Settlement"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#B8860B]/30 focus:border-[#B8860B]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
                <select value={newProj.type} onChange={e => setNewProj({...newProj, type: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#B8860B]/30 focus:border-[#B8860B] bg-white">
                  <option value="Residential">Residential</option>
                  <option value="Coastal">Coastal</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Administration">Administration</option>
                  <option value="Medical">Medical</option>
                  <option value="Commercial - Administrative">Commercial - Administrative</option>
                  <option value="Commercial - Medical - Administrative">Commercial - Medical - Administrative</option>
                  <option value="Residential - Commercial">Residential - Commercial</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={handleAddProject} disabled={!newProj.name.trim()} className="flex-1 bg-[#B8860B] hover:bg-[#9a7009] disabled:opacity-40 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">Save</button>
              <button onClick={() => setShowAddProj(false)} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
