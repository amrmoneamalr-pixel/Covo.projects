import { useState, useEffect } from 'react'
import { Loader2, Save, Upload, Wand2, Trash2 } from 'lucide-react'
import { supabase, uploadAsset } from '../../lib/supabase'
import { autoMatchAll } from '../../utils/layoutMatcher'
import { normalizeUnitType } from '../../utils/parsers'

export default function ManageProjects() {
  const [projects, setProjects] = useState([])
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({})
  const [layouts, setLayouts] = useState([])
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const load = async () => {
    const { data } = await supabase.from('projects').select('*').order('name')
    setProjects(data || [])
  }
  useEffect(() => {
    load()
  }, [])

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

  // Upload helpers
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

  return (
    <div className="flex h-full">
      {/* Project list */}
      <div className="w-64 border-r border-line overflow-y-auto p-3 shrink-0">
        <p className="text-xs text-ink-faint mb-2 px-1">{projects.length} projects</p>
        {projects.map((p) => (
          <button
            key={p.id}
            onClick={() => pick(p)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 transition-colors ${
              selected?.id === p.id ? 'bg-covo-gold text-black font-semibold' : 'text-ink-muted hover:bg-bg-hover'
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto p-6">
        {!selected ? (
          <p className="text-ink-faint text-sm">Select a project to edit.</p>
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
