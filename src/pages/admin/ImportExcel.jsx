import { useState } from 'react'
import { Upload, FileSpreadsheet, MessageSquare, Check, AlertCircle, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { parseExcelFile, parseWhatsApp } from '../../utils/parsers'

const fmt = (n) => (n == null ? '—' : new Intl.NumberFormat('en-US').format(Math.round(n)))

const FORMAT_LABELS = {
  developers_master: 'Developers Master (projects + developers + types)',
  mountain_view: 'Mountain View (sheet per project)',
  madinet_masr: 'Madinet Masr (single sheet)',
  generic: 'Generic Excel',
  whatsapp: 'WhatsApp message',
}

export default function ImportExcel() {
  const [tab, setTab] = useState('excel') // excel | whatsapp
  const [parsed, setParsed] = useState(null) // { format, units, projects }
  const [waText, setWaText] = useState('')
  const [waDeveloper, setWaDeveloper] = useState('')
  const [status, setStatus] = useState(null) // {type, msg}
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState('')

  // ---- Excel upload ----
  const handleFile = async (file) => {
    if (!file) return
    setStatus(null)
    setParsed(null)
    try {
      const result = await parseExcelFile(file)
      if (result.units.length === 0) {
        setStatus({ type: 'error', msg: 'No units found. Check the file format.' })
        return
      }
      setParsed({ ...result, fileName: file.name })
    } catch (e) {
      console.error(e)
      setStatus({ type: 'error', msg: 'Failed to read file: ' + e.message })
    }
  }

  // ---- WhatsApp parse ----
  const handleWhatsApp = () => {
    setStatus(null)
    setParsed(null)
    if (!waText.trim()) {
      setStatus({ type: 'error', msg: 'Paste a WhatsApp message first.' })
      return
    }
    const result = parseWhatsApp(waText, waDeveloper.trim())
    if (result.units.length === 0) {
      setStatus({ type: 'error', msg: 'Could not parse any units. Check the message format.' })
      return
    }
    setParsed(result)
  }

  // ---- Import to Supabase (upsert projects + replace their units) ----
  const doImport = async () => {
    if (!parsed) return
    setImporting(true)
    setStatus(null)
    let projCount = 0
    let unitCount = 0

    try {
      for (const proj of parsed.projects) {
        setProgress(`Importing ${proj.name}…`)

        // 1) upsert project (match on name)
        const { data: existing } = await supabase
          .from('projects')
          .select('id')
          .eq('name', proj.name)
          .maybeSingle()

        const projectRow = {
          name: proj.name,
          developer_name: proj.developer_name || null,
          type: proj.type || 'residential',
          city: proj.city || null,
          status: proj.status || 'available',
          start_price: proj.start_price ?? null,
          delivery_years: proj.delivery_years ?? null,
          delivery_label: proj.delivery_label ?? null,
          source: parsed.format,
          updated_at: new Date().toISOString(),
        }
        // developers_master carries classification flags
        if (parsed.format === 'developers_master') {
          projectRow.is_mixed = !!proj.is_mixed
          projectRow.is_commercial = !!proj.is_commercial
          projectRow.is_residential = !!proj.is_residential
          projectRow.is_medical = !!proj.is_medical
          projectRow.is_administrative = !!proj.is_administrative
          projectRow.is_coastal = !!proj.is_coastal
          projectRow.types_raw = proj.types_raw || null
          // don't wipe a price that a prior availability import set
          delete projectRow.start_price
        }

        let projectId
        if (existing) {
          projectId = existing.id
          await supabase.from('projects').update(projectRow).eq('id', projectId)
        } else {
          const { data: ins, error } = await supabase
            .from('projects')
            .insert(projectRow)
            .select('id')
            .single()
          if (error) throw error
          projectId = ins.id
        }
        projCount++

        // 2) replace units for this project (skip for projects-only imports)
        if (!parsed.isProjectsOnly && proj.units.length > 0) {
        await supabase
          .from('units')
          .delete()
          .eq('project_id', projectId)
          .eq('source_file', parsed.fileName || parsed.format)

        const unitRows = proj.units.map((u) => ({
          project_id: projectId,
          unit_code: u.unit_code || null,
          unit_price: u.unit_price ?? null,
          status: (u.status || 'available').toLowerCase().includes('avail')
            ? 'available'
            : 'reserved',
          category: u.category || null,
          unit_type: u.unit_type || null,
          bedrooms: u.bedrooms ?? null,
          bua: u.bua ?? null,
          garden_area: u.garden_area ?? 0,
          roof_area: u.roof_area ?? 0,
          land_area: u.land_area ?? 0,
          floor_no: u.floor_no || null,
          building: u.building || null,
          park: u.park || null,
          phase: u.phase || null,
          model: u.model || null,
          entrance: u.entrance || null,
          delivery_status: u.delivery_status || null,
          source_file: parsed.fileName || parsed.format,
          raw: u.raw || null,
        }))

        // insert in chunks of 500
        for (let i = 0; i < unitRows.length; i += 500) {
          const chunk = unitRows.slice(i, i + 500)
          const { error } = await supabase.from('units').insert(chunk)
          if (error) throw error
          unitCount += chunk.length
        }
        } // end units block

        // 3) payment plans (from WhatsApp)
        if (proj.plans?.length) {
          await supabase.from('payment_plans').delete().eq('project_id', projectId)
          await supabase.from('payment_plans').insert(
            proj.plans.map((p, i) => ({
              project_id: projectId,
              down_payment_pct: p.down_payment_pct ?? null,
              years: p.years ?? null,
              discount_pct: p.discount_pct ?? 0,
              payment_type: p.payment_type || 'equal',
              monthly_after: p.monthly_after || null,
              label: p.label || null,
              sort_order: i,
            }))
          )
        }
      }

      setStatus({
        type: 'success',
        msg: parsed.isProjectsOnly
          ? `Imported ${projCount} projects (developers + cities + types) ✓`
          : `Imported ${unitCount} units across ${projCount} projects ✓`,
      })
      setParsed(null)
      setWaText('')
    } catch (e) {
      console.error(e)
      setStatus({ type: 'error', msg: 'Import failed: ' + e.message })
    } finally {
      setImporting(false)
      setProgress('')
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-xl font-bold text-ink mb-1">Import Availability</h1>
      <p className="text-sm text-ink-muted mb-6">
        Upload an Excel sheet or paste a WhatsApp message. The format is detected
        automatically — review the preview, then import.
      </p>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => { setTab('excel'); setParsed(null); setStatus(null) }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'excel' ? 'bg-covo-gold text-black' : 'bg-bg-card text-ink-muted hover:text-ink'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" /> Excel
        </button>
        <button
          onClick={() => { setTab('whatsapp'); setParsed(null); setStatus(null) }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'whatsapp' ? 'bg-covo-teal text-black' : 'bg-bg-card text-ink-muted hover:text-ink'
          }`}
        >
          <MessageSquare className="w-4 h-4" /> WhatsApp
        </button>
      </div>

      {/* Excel input */}
      {tab === 'excel' && (
        <label className="block border-2 border-dashed border-line rounded-xl p-10 text-center cursor-pointer hover:border-covo-gold/50 transition-colors">
          <Upload className="w-8 h-8 mx-auto mb-3 text-ink-faint" />
          <p className="text-sm text-ink">Drop an .xlsx file here or click to browse</p>
          <p className="text-xs text-ink-faint mt-1">
            Mountain View, Madinet Masr, and generic formats supported
          </p>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </label>
      )}

      {/* WhatsApp input */}
      {tab === 'whatsapp' && (
        <div className="space-y-3">
          <input
            value={waDeveloper}
            onChange={(e) => setWaDeveloper(e.target.value)}
            placeholder="Developer name (optional, e.g. Madinet Masr)"
            className="w-full bg-bg-card border border-line rounded-lg px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-covo-teal/60"
          />
          <textarea
            value={waText}
            onChange={(e) => setWaText(e.target.value)}
            rows={10}
            placeholder={`Paste a message like:\n\n🌌 Talala 🌌\nInstallments: 5.2% - 15 Years | Delivery: 5 Years\n🏢 Apartments\n* 1 Bedroom: 4.3M\n* 2 Bedrooms: 9.2M`}
            className="w-full bg-bg-card border border-line rounded-lg px-3 py-2 text-sm text-ink placeholder:text-ink-faint font-mono focus:outline-none focus:border-covo-teal/60"
          />
          <button
            onClick={handleWhatsApp}
            className="bg-covo-teal text-black text-sm font-semibold px-5 py-2 rounded-lg hover:opacity-90"
          >
            Parse Message
          </button>
        </div>
      )}

      {/* Status */}
      {status && (
        <div
          className={`flex items-center gap-2 mt-4 px-4 py-3 rounded-lg text-sm ${
            status.type === 'success'
              ? 'bg-covo-teal/10 text-covo-teal border border-covo-teal/30'
              : 'bg-covo-pink/10 text-covo-pink border border-covo-pink/30'
          }`}
        >
          {status.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {status.msg}
        </div>
      )}

      {/* Preview */}
      {parsed && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-ink">
                Detected: <span className="text-covo-gold">{FORMAT_LABELS[parsed.format]}</span>
              </p>
              <p className="text-xs text-ink-muted">
                {parsed.projects.length} projects
                {parsed.isProjectsOnly ? '' : ` · ${parsed.units.length} units`}
              </p>
            </div>
            <button
              onClick={doImport}
              disabled={importing}
              className="flex items-center gap-2 bg-covo-gold text-black text-sm font-semibold px-5 py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> {progress || 'Importing…'}
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" /> Import to Database
                </>
              )}
            </button>
          </div>

          <div className="border border-line rounded-lg overflow-hidden max-h-96 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-bg-sidebar">
                {parsed.isProjectsOnly ? (
                  <tr className="text-ink-faint">
                    <th className="text-left py-2 px-3 font-medium">Project</th>
                    <th className="text-left py-2 px-3 font-medium">Developer</th>
                    <th className="text-left py-2 px-3 font-medium">City</th>
                    <th className="text-left py-2 px-3 font-medium">Category</th>
                  </tr>
                ) : (
                  <tr className="text-ink-faint">
                    <th className="text-left py-2 px-3 font-medium">Project</th>
                    <th className="text-right py-2 px-3 font-medium">Units</th>
                    <th className="text-right py-2 px-3 font-medium">Start Price</th>
                    <th className="text-left py-2 px-3 font-medium">Types</th>
                    <th className="text-right py-2 px-3 font-medium">Plans</th>
                  </tr>
                )}
              </thead>
              <tbody>
                {parsed.projects.map((p, idx) => {
                  if (parsed.isProjectsOnly) {
                    const cat = p.is_mixed
                      ? 'Residential + Commercial'
                      : p.type === 'commercial'
                      ? 'Commercial'
                      : 'Residential'
                    return (
                      <tr key={p.name + idx} className="border-t border-line/40">
                        <td className="py-2 px-3 text-ink font-medium">{p.name}</td>
                        <td className="py-2 px-3 text-ink-muted">{p.developer_name}</td>
                        <td className="py-2 px-3 text-ink-muted">{p.city}</td>
                        <td className="py-2 px-3 text-ink-faint">{cat}</td>
                      </tr>
                    )
                  }
                  const types = [...new Set(p.units.map((u) => u.unit_type))].filter(Boolean)
                  const prices = p.units.map((u) => u.unit_price).filter(Boolean)
                  return (
                    <tr key={p.name + idx} className="border-t border-line/40">
                      <td className="py-2 px-3 text-ink font-medium">{p.name}</td>
                      <td className="py-2 px-3 text-right text-ink-muted">{p.units.length}</td>
                      <td className="py-2 px-3 text-right text-covo-gold font-semibold">
                        {prices.length ? fmt(p.start_price ?? Math.min(...prices)) + ' LE' : '—'}
                      </td>
                      <td className="py-2 px-3 text-ink-faint">{types.join(', ')}</td>
                      <td className="py-2 px-3 text-right text-ink-muted">{p.plans?.length || 0}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
