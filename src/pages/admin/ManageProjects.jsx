import { useState, useEffect, useMemo } from 'react'
import { Loader2, Save, Upload, Wand2, Trash2, ChevronDown, X, Image as ImageIcon } from 'lucide-react'
import { supabase, uploadAsset } from '../../lib/supabase'
import { autoMatchAll } from '../../utils/layoutMatcher'
import { normalizeUnitType } from '../../utils/parsers'

export default function ManageProjects() {
  const [projects, setProjects] = useState([])
  const [developers, setDevelopers] = useState([]) // [{id, name, logo_url}]
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({})
  const [layouts, setLayouts] = useState([])
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  // NEW: developer filter
  const [devFilterId, setDevFilterId] = useState('') // '' = all
  const [devDropdownOpen, setDevDropdownOpen] = useState(false)
  const [devSearch, setDevSearch] = useState('')

  // NEW: developer-edit modal
  const [editDev, setEditDev] = useState(null) // developer object
  const [devSaving, setDevSaving] = useState(false)
  const [devEditMsg, setDevEditMsg] = useState('')

  const load = async () => {
    const [{ data: projs }, { data: devs }] = await Promise.all([
      supabase.from('projects').select('*').order('name'),
      supabase.from('developers').select('id, name, logo_url').order('name'),
    ])
    setProjects(projs || [])
    setDevelopers(devs || [])
  }
  useEffect(() => { load() }, [])

  const pick = async (p) => {
    setSelected(p)
    setForm({ ...p })
    setMsg('')
    const { data } = await supabase.from('unit_layouts').select('*').eq('project_id', p.id)
    setLayouts(data || [])
  }

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const save = async () => {
    setSaving(true)
    setMsg('')
    const patch = {
      name: form.name,
      phase: form.phase,
      developer_name: form.developer_name,
      city: form.city,
      location: form.location,
      acres: numOrNull(form.acres),
      type: form.type || 'residential',
      status: form.status || 'available',
      finishing: form.finishing || null,
      launch_date: form.launch_date || null,
      delivery_years: numOrNull(form.delivery_years),
      delivery_label: form.delivery_label,
      cash_discount: numOrNull(form.cash_discount) || 0,
      maintenance_pct: numOrNull(form.maintenance_pct) || 0,
      club_fees: form.club_fees,
      parking_fees: numOrNull(form.parking_fees) || 0,
      booking_type: form.booking_type,
      has_offer: !!form.has_offer,
      location_url: form.location_url,
    }
    const { error } = await supabase.from('projects').update(patch).eq('id', selected.id)
    setSaving(false)
    if (error) setMsg('Error: ' + error.message)
    else {
      setMsg('Saved ✓')
      load()
    }
  }

  // Upload helpers (single project)
  const uploadFile = async (file, kind) => {
    if (!file || !selected) return
    setMsg(`Uploading ${kind}…`)
    try {
      const path = `${selected.id}/${kind}-${Date.now()}-${file.name}`
      const url = await uploadAsset(file, path)
      if (kind === 'brochure') {
        await supabase.from('projects').update({ brochure_url: url }).eq('id', selected.id)
        set('brochure_url', url)
      } else if (kind === 'masterplan') {
        await supabase.from('projects').update({ masterplan_url: url }).eq('id', selected.id)
        set('masterplan_url', url)
      } else if (kind === 'logo') {
        await supabase.from('projects').update({ logo_url: url }).eq('id', selected.id)
        set('logo_url', url)
      }
      setMsg(`${kind} uploaded ✓`)
    } catch (e) {
      setMsg('Upload error: ' + e.message)
    }
  }

  // Add a layout (floor plan image + matching metadata)
  const addLayout = async (file, meta) => {
    if (!file || !selected) return
    setMsg('Uploading layout…')
    try {
      const path = `${selected.id}/layout-${Date.now()}-${file.name}`
      const url = await uploadAsset(file, path)
      const row = {
        project_id: selected.id,
        name: meta.name,
        category: meta.category,
        unit_type: normalizeUnitType(meta.category),
        bedrooms: numOrNull(meta.bedrooms),
        bua: numOrNull(meta.bua),
        bua_min: meta.bua ? Number(meta.bua) - 10 : null,
        bua_max: meta.bua ? Number(meta.bua) + 10 : null,
        floor_type: meta.floor_type,
        image_url: url,
      }
      const { data, error } = await supabase.from('unit_layouts').insert(row).select().single()
      if (error) throw error
      setLayouts((l) => [...l, data])
      setMsg('Layout added ✓')
    } catch (e) {
      setMsg('Error: ' + e.message)
    }
  }

  const deleteLayout = async (id) => {
    await supabase.from('unit_layouts').delete().eq('id', id)
    setLayouts((l) => l.filter((x) => x.id !== id))
  }

  // Run auto-matching: link units to layouts by category + BUA
  const runMatch = async () => {
    if (!selected) return
    setMsg('Matching units to layouts…')
    const { data: units } = await supabase
      .from('units')
      .select('*')
      .eq('project_id', selected.id)
    const matches = autoMatchAll(units || [], layouts)
    let n = 0
    for (const m of matches) {
      await supabase.from('units').update({ layout_id: m.layout_id }).eq('id', m.unit_id)
      n++
    }
    setMsg(`Matched ${n} units to layouts ✓`)
  }

  // ── NEW: Update developer logo + cascade to all their projects ──
  const saveDeveloperLogo = async (file) => {
    if (!file || !editDev) return
    setDevSaving(true)
    setDevEditMsg('Uploading logo…')
    try {
      // Upload to storage
      const path = `developers/${editDev.id}/logo-${Date.now()}-${file.name}`
      const url = await uploadAsset(file, path)

      // Update developers table
      const { error: devErr } = await supabase
        .from('developers')
        .update({ logo_url: url })
        .eq('id', editDev.id)
      if (devErr) throw devErr

      // Update ALL projects of this developer (cascade)
      const { error: projErr } = await supabase
        .from('projects')
        .update({ logo_url: url })
        .eq('developer_id', editDev.id)
      if (projErr) throw projErr

      setDevEditMsg('Logo applied to developer and all projects ✓')
      await load()
      // Update preview locally
      setEditDev((d) => ({ ...d, logo_url: url }))

      // If the currently-edited project belongs to this dev, refresh its form too
      if (selected && selected.developer_id === editDev.id) {
        setForm((f) => ({ ...f, logo_url: url }))
      }
    } catch (e) {
      setDevEditMsg('Error: ' + e.message)
    } finally {
      setDevSaving(false)
    }
  }

  const saveDeveloperName = async (newName) => {
    if (!editDev || !newName.trim()) return
    setDevSaving(true)
    setDevEditMsg('Renaming…')
    try {
      const trimmed = newName.trim()
      const { error: devErr } = await supabase
        .from('developers')
        .update({ name: trimmed })
        .eq('id', editDev.id)
      if (devErr) throw devErr

      // Cascade to projects (developer_name is denormalized)
      const { error: projErr } = await supabase
        .from('projects')
        .update({ developer_name: trimmed })
        .eq('developer_id', editDev.id)
      if (projErr) throw projErr

      setDevEditMsg('Renamed ✓ (applied to all projects)')
      await load()
      setEditDev((d) => ({ ...d, name: trimmed }))
      if (selected && selected.developer_id === editDev.id) {
        setForm((f) => ({ ...f, developer_name: trimmed }))
      }
    } catch (e) {
      setDevEditMsg('Error: ' + e.message)
    } finally {
      setDevSaving(false)
    }
  }

  // ── Derived: filtered project list ──
  const filteredProjects = useMemo(() => {
    if (!devFilterId) return projects
    return projects.filter((p) => p.developer_id === devFilterId)
  }, [projects, devFilterId])

  const filteredDevsForDropdown = useMemo(() => {
    if (!devSearch) return developers
    return developers.filter((d) =>
      d.name.toLowerCase().includes(devSearch.toLowerCase())
    )
  }, [developers, devSearch])

  const activeDev = useMemo(() => {
    return developers.find((d) => d.id === devFilterId) || null
  }, [developers, devFilterId])

  return (
    <div className="flex h-full">
      {/* Project list */}
      <div className="w-72 border-r border-line overflow-y-auto p-3 shrink-0">
        {/* NEW: Developer filter */}
        <div className="mb-3 relative">
          <label className="text-[10px] font-semibold text-ink-faint uppercase tracking-wide block mb-1.5 px-1">
            Filter by Developer
          </label>
          <button
            onClick={() => setDevDropdownOpen((o) => !o)}
            className="w-full flex items-center justify-between bg-bg-card border border-line rounded-md px-3 py-2 text-xs text-ink hover:border-covo-gold/40"
          >
            <span className="flex items-center gap-2 truncate">
              {activeDev ? (
                <>
                  <DevLogoMini name={activeDev.name} url={activeDev.logo_url} />
                  <span className="truncate">{activeDev.name}</span>
                </>
              ) : (
                <span className="text-ink-muted">— All developers —</span>
              )}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-ink-faint transition-transform ${devDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {devDropdownOpen && (
            <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-bg-card border border-line rounded-md shadow-2xl max-h-80 flex flex-col">
              <input
                type="text"
                value={devSearch}
                onChange={(e) => setDevSearch(e.target.value)}
                placeholder="Search developer..."
                autoFocus
                className="bg-bg-base border-b border-line px-3 py-2 text-xs text-ink placeholder:text-ink-faint focus:outline-none"
              />
              <div className="overflow-y-auto flex-1">
                <button
                  onClick={() => { setDevFilterId(''); setDevDropdownOpen(false); setDevSearch('') }}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-bg-hover ${!devFilterId ? 'text-covo-gold font-semibold' : 'text-ink-muted'}`}
                >
                  — All developers ({developers.length}) —
                </button>
                {filteredDevsForDropdown.map((d) => {
                  const count = projects.filter((p) => p.developer_id === d.id).length
                  return (
                    <button
                      key={d.id}
                      onClick={() => { setDevFilterId(d.id); setDevDropdownOpen(false); setDevSearch('') }}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs hover:bg-bg-hover ${devFilterId === d.id ? 'text-covo-gold font-semibold' : 'text-ink'}`}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <DevLogoMini name={d.name} url={d.logo_url} />
                        <span className="truncate">{d.name}</span>
                      </span>
                      <span className="text-[10px] text-ink-faint shrink-0">{count}</span>
                    </button>
                  )
                })}
                {filteredDevsForDropdown.length === 0 && (
                  <p className="text-center text-xs text-ink-faint py-4">No match</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* NEW: Edit developer button when filter is active */}
        {activeDev && (
          <button
            onClick={() => { setEditDev(activeDev); setDevEditMsg('') }}
            className="w-full flex items-center justify-center gap-1.5 text-[11px] font-semibold bg-covo-gold/10 text-covo-gold border border-covo-gold/30 rounded-md py-1.5 mb-3 hover:bg-covo-gold/20"
          >
            <ImageIcon className="w-3 h-3" />
            Edit Developer (logo / name)
          </button>
        )}

        <p className="text-[10px] text-ink-faint mb-2 px-1 uppercase tracking-wide">
          {filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'}
        </p>

        {filteredProjects.length === 0 ? (
          <p className="text-xs text-ink-faint text-center py-6">No projects match this filter</p>
        ) : (
          filteredProjects.map((p) => (
            <button
              key={p.id}
              onClick={() => pick(p)}
              className={`w-full text-left px-3 py-2 rounded-md text-xs mb-1 transition-colors ${
                selected?.id === p.id ? 'bg-covo-gold text-black font-semibold' : 'text-ink-muted hover:bg-bg-hover'
              }`}
            >
              <p className="truncate">{p.name}</p>
              {p.developer_name && !activeDev && (
                <p className={`text-[10px] truncate ${selected?.id === p.id ? 'text-black/60' : 'text-ink-faint'}`}>
                  {p.developer_name}
                </p>
              )}
            </button>
          ))
        )}
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto p-6">
        {!selected ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <p className="text-ink-faint text-sm mb-2">Select a project to edit.</p>
              {activeDev && (
                <p className="text-[11px] text-ink-faint">
                  Showing {filteredProjects.length} projects from <span className="text-covo-gold">{activeDev.name}</span>
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-ink">{selected.name}</h2>
              <button
                onClick={save}
                disabled={saving}
                className="flex items-center gap-2 bg-covo-gold text-black text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save
              </button>
            </div>
            {msg && <p className="text-xs text-covo-teal mb-3">{msg}</p>}

            {/* Detail fields */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Developer" value={form.developer_name} onChange={(v) => set('developer_name', v)} />
              <Field label="Phase" value={form.phase} onChange={(v) => set('phase', v)} />
              <Field label="City" value={form.city} onChange={(v) => set('city', v)} />
              <Field label="Location / Area" value={form.location} onChange={(v) => set('location', v)} />
              <Field label="Acres" type="number" value={form.acres} onChange={(v) => set('acres', v)} />
              <Field label="Launch Date" type="date" value={form.launch_date?.slice(0, 10)} onChange={(v) => set('launch_date', v)} />
              <Field label="Delivery (years)" type="number" value={form.delivery_years} onChange={(v) => set('delivery_years', v)} />
              <Field label="Delivery Label" value={form.delivery_label} onChange={(v) => set('delivery_label', v)} />
              <Field label="Cash Discount %" type="number" value={form.cash_discount} onChange={(v) => set('cash_discount', v)} />
              <Field label="Maintenance %" type="number" value={form.maintenance_pct} onChange={(v) => set('maintenance_pct', v)} />
              <Field label="Club Fees" value={form.club_fees} onChange={(v) => set('club_fees', v)} />
              <Field label="Parking Fees" type="number" value={form.parking_fees} onChange={(v) => set('parking_fees', v)} />
              <Field label="Booking Type" value={form.booking_type} onChange={(v) => set('booking_type', v)} />
              <Field label="Location URL (Maps)" value={form.location_url} onChange={(v) => set('location_url', v)} />
              <div>
                <label className="text-xs text-ink-faint">Type</label>
                <select
                  value={form.type || 'residential'}
                  onChange={(e) => set('type', e.target.value)}
                  className="w-full bg-bg-card border border-line rounded-lg px-3 py-2 text-sm text-ink mt-1"
                >
                  <option value="residential">Residential</option>
                  <option value="commercial">Commercial</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-ink-faint">Status</label>
                <select
                  value={form.status || 'available'}
                  onChange={(e) => set('status', e.target.value)}
                  className="w-full bg-bg-card border border-line rounded-lg px-3 py-2 text-sm text-ink mt-1"
                >
                  <option value="available">Available</option>
                  <option value="coming_soon">Coming Soon</option>
                  <option value="sold_out">Sold Out</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-ink-faint">Finishing</label>
                <select
                  value={form.finishing || ''}
                  onChange={(e) => set('finishing', e.target.value)}
                  className="w-full bg-bg-card border border-line rounded-lg px-3 py-2 text-sm text-ink mt-1"
                >
                  <option value="">— Not set —</option>
                  <option value="fully_finished">Fully Finished</option>
                  <option value="semi_finished">Semi Finished</option>
                  <option value="not_finished">Not Finished</option>
                  <option value="core_shell">Core &amp; Shell</option>
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm text-ink-muted col-span-2 mt-1">
                <input type="checkbox" checked={!!form.has_offer} onChange={(e) => set('has_offer', e.target.checked)} className="accent-covo-gold" />
                Has Offer
              </label>
            </div>

            {/* Asset uploads */}
            <h3 className="text-sm font-semibold text-ink mt-6 mb-2">Assets</h3>
            <div className="grid grid-cols-3 gap-3">
              <UploadBox label="Logo" current={form.logo_url} accept="image/*" onFile={(f) => uploadFile(f, 'logo')} />
              <UploadBox label="Brochure (PDF)" current={form.brochure_url} accept=".pdf" onFile={(f) => uploadFile(f, 'brochure')} />
              <UploadBox label="Master Plan" current={form.masterplan_url} accept="image/*" onFile={(f) => uploadFile(f, 'masterplan')} />
            </div>

            {/* Layouts */}
            <div className="flex items-center justify-between mt-6 mb-2">
              <h3 className="text-sm font-semibold text-ink">Floor Plan Layouts</h3>
              <button
                onClick={runMatch}
                className="flex items-center gap-1.5 text-xs bg-covo-blue/20 text-covo-blue border border-covo-blue/40 rounded-lg px-3 py-1.5 hover:bg-covo-blue/30"
              >
                <Wand2 className="w-3.5 h-3.5" /> Auto-match units
              </button>
            </div>
            <AddLayoutForm onAdd={addLayout} />
            <div className="grid grid-cols-2 gap-2 mt-3">
              {layouts.map((l) => (
                <div key={l.id} className="flex items-center gap-2 bg-bg-card border border-line rounded-lg p-2">
                  <img src={l.image_url} alt="" className="w-12 h-12 object-cover rounded" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-ink font-medium truncate">{l.name}</p>
                    <p className="text-[10px] text-ink-faint">{l.category} · {l.bua} m² · {l.bedrooms}BR</p>
                  </div>
                  <button onClick={() => deleteLayout(l.id)} className="text-ink-faint hover:text-covo-pink">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Edit Developer modal ── */}
      {editDev && (
        <EditDeveloperModal
          dev={editDev}
          onClose={() => setEditDev(null)}
          onUploadLogo={saveDeveloperLogo}
          onRename={saveDeveloperName}
          saving={devSaving}
          msg={devEditMsg}
          projectCount={projects.filter((p) => p.developer_id === editDev.id).length}
        />
      )}
    </div>
  )
}

// ─── Mini logo (for dropdown rows) ─────────────────────
function DevLogoMini({ name, url }) {
  const [failed, setFailed] = useState(false)
  const initial = (name || '?').trim().charAt(0).toUpperCase()
  if (url && !failed) {
    return (
      <span className="w-5 h-5 rounded-full bg-white border border-line flex items-center justify-center overflow-hidden shrink-0">
        <img src={url} alt="" onError={() => setFailed(true)} className="w-full h-full object-contain p-[1px]" />
      </span>
    )
  }
  return (
    <span className="w-5 h-5 rounded-full bg-white border border-line flex items-center justify-center text-covo-gold font-bold text-[9px] shrink-0">
      {initial}
    </span>
  )
}

// ─── Edit Developer Modal ─────────────────────────────
function EditDeveloperModal({ dev, onClose, onUploadLogo, onRename, saving, msg, projectCount }) {
  const [name, setName] = useState(dev.name || '')
  const [file, setFile] = useState(null)

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-bg-card border border-line rounded-lg shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-line">
          <div>
            <h2 className="text-sm font-bold text-ink">Edit Developer</h2>
            <p className="text-[11px] text-ink-faint mt-0.5">
              Changes will apply to all {projectCount} {projectCount === 1 ? 'project' : 'projects'}
            </p>
          </div>
          <button onClick={onClose} className="text-ink-faint hover:text-ink">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Current logo preview */}
          <div className="flex items-center gap-3 p-3 bg-bg-base border border-line rounded-md">
            <div className="w-14 h-14 rounded-full bg-white border border-line flex items-center justify-center overflow-hidden shrink-0">
              {dev.logo_url ? (
                <img src={dev.logo_url} alt="" className="w-full h-full object-contain p-1" />
              ) : (
                <span className="text-covo-gold font-bold text-lg">
                  {(dev.name || '?').charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-ink font-semibold truncate">{dev.name}</p>
              <p className="text-[10px] text-ink-faint">{dev.logo_url ? 'Current logo' : 'No logo'}</p>
            </div>
          </div>

          {/* Rename */}
          <div>
            <label className="block text-[11px] font-semibold text-ink-muted mb-1.5">Developer Name</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Developer name"
                className="flex-1 bg-bg-base border border-line rounded-md px-3 py-2 text-xs text-ink placeholder:text-ink-faint focus:outline-none focus:border-covo-gold/60"
              />
              <button
                onClick={() => onRename(name)}
                disabled={saving || !name.trim() || name.trim() === dev.name}
                className="bg-covo-gold hover:opacity-90 disabled:opacity-30 text-black text-xs font-semibold px-3 rounded-md"
              >
                Rename
              </button>
            </div>
          </div>

          {/* Upload logo */}
          <div>
            <label className="block text-[11px] font-semibold text-ink-muted mb-1.5">
              Upload New Logo (image)
            </label>
            <div className="flex gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="flex-1 text-[10px] text-ink-muted file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-bg-base file:text-ink file:text-[10px] file:cursor-pointer"
              />
              <button
                onClick={() => { onUploadLogo(file); setFile(null) }}
                disabled={saving || !file}
                className="bg-covo-gold hover:opacity-90 disabled:opacity-30 text-black text-xs font-semibold px-3 rounded-md flex items-center gap-1"
              >
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                Apply
              </button>
            </div>
            <p className="text-[10px] text-ink-faint mt-1">
              PNG/JPG/SVG · Will update {projectCount} {projectCount === 1 ? 'project' : 'projects'}
            </p>
          </div>

          {/* Status message */}
          {msg && (
            <p className={`text-xs ${msg.startsWith('Error') ? 'text-covo-pink' : 'text-covo-teal'}`}>
              {msg}
            </p>
          )}
        </div>

        <div className="px-5 py-3 border-t border-line flex justify-end">
          <button
            onClick={onClose}
            className="bg-bg-base border border-line text-ink-muted text-xs font-semibold px-4 py-2 rounded-md hover:text-ink"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <label className="text-xs text-ink-faint">{label}</label>
      <input
        type={type}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-bg-card border border-line rounded-lg px-3 py-2 text-sm text-ink mt-1 focus:outline-none focus:border-covo-gold/60"
      />
    </div>
  )
}

function UploadBox({ label, current, accept, onFile }) {
  return (
    <label className="border border-dashed border-line rounded-lg p-3 text-center cursor-pointer hover:border-covo-gold/50 block">
      <Upload className="w-4 h-4 mx-auto mb-1 text-ink-faint" />
      <p className="text-[11px] text-ink-muted">{label}</p>
      {current && <p className="text-[9px] text-covo-teal mt-1">✓ uploaded</p>}
      <input type="file" accept={accept} className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
    </label>
  )
}

function AddLayoutForm({ onAdd }) {
  const [meta, setMeta] = useState({ name: '', category: '', bedrooms: '', bua: '', floor_type: '' })
  const [file, setFile] = useState(null)
  return (
    <div className="bg-bg-card border border-line rounded-lg p-3 grid grid-cols-3 gap-2 items-end">
      <input placeholder="Name" value={meta.name} onChange={(e) => setMeta({ ...meta, name: e.target.value })} className="bg-bg-base border border-line rounded px-2 py-1.5 text-xs text-ink" />
      <input placeholder="Category" value={meta.category} onChange={(e) => setMeta({ ...meta, category: e.target.value })} className="bg-bg-base border border-line rounded px-2 py-1.5 text-xs text-ink" />
      <input placeholder="Floor type" value={meta.floor_type} onChange={(e) => setMeta({ ...meta, floor_type: e.target.value })} className="bg-bg-base border border-line rounded px-2 py-1.5 text-xs text-ink" />
      <input placeholder="Bedrooms" type="number" value={meta.bedrooms} onChange={(e) => setMeta({ ...meta, bedrooms: e.target.value })} className="bg-bg-base border border-line rounded px-2 py-1.5 text-xs text-ink" />
      <input placeholder="BUA (m²)" type="number" value={meta.bua} onChange={(e) => setMeta({ ...meta, bua: e.target.value })} className="bg-bg-base border border-line rounded px-2 py-1.5 text-xs text-ink" />
      <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0])} className="text-[10px] text-ink-muted" />
      <button
        onClick={() => { onAdd(file, meta); setMeta({ name: '', category: '', bedrooms: '', bua: '', floor_type: '' }); setFile(null) }}
        className="col-span-3 bg-covo-teal text-black text-xs font-semibold py-1.5 rounded hover:opacity-90"
      >
        + Add Layout
      </button>
    </div>
  )
}

const numOrNull = (v) => (v === '' || v == null ? null : Number(v))
