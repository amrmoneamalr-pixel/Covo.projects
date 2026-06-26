import { useState } from 'react'
import { Upload, FileSpreadsheet, MessageSquare, Check, AlertCircle, Loader2, X, Sparkles } from 'lucide-react'
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

// ─── Fuzzy matching helpers ───────────────────────────
function normalizeName(name) {
  return (name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim()
}

function similarity(a, b) {
  if (a === b) return 1
  if (!a || !b) return 0
  if (a.includes(b) || b.includes(a)) {
    // partial match — give a high but not perfect score
    return 0.85
  }
  // Levenshtein distance
  const m = a.length, n = b.length
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost)
    }
  }
  return 1 - dp[m][n] / Math.max(m, n)
}

function findMatches(parsedName, parsedDev, existing) {
  const norm = normalizeName(parsedName)
  const devNorm = normalizeName(parsedDev || '')
  const candidates = []
  for (const ex of existing) {
    // If we know the developer on both sides and they differ, skip
    if (devNorm && ex.developer_name) {
      if (normalizeName(ex.developer_name) !== devNorm) continue
    }
    const exNorm = normalizeName(ex.name)
    const score = similarity(norm, exNorm)
    if (score >= 0.75) candidates.push({ id: ex.id, name: ex.name, developer_name: ex.developer_name, score })
  }
  return candidates.sort((a, b) => b.score - a.score).slice(0, 3)
}

export default function ImportExcel() {
  const [tab, setTab] = useState('excel')
  const [parsed, setParsed] = useState(null)
  const [waText, setWaText] = useState('')
  const [waDeveloper, setWaDeveloper] = useState('')
  const [status, setStatus] = useState(null)
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState('')

  // NEW: review state
  const [analyzing, setAnalyzing] = useState(false)
  const [reviewItems, setReviewItems] = useState(null) // [{parsedName, candidates, decision: 'insert'|matchId}]
  const [exactMatches, setExactMatches] = useState({}) // { parsedName: existingId } for auto-updates

  // ---- Excel upload ----
  const handleFile = async (file) => {
    if (!file) return
    setStatus(null)
    setParsed(null)
    setReviewItems(null)
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
    setReviewItems(null)
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

  // ---- Analyze: classify every parsed project into exact / fuzzy / no-match ----
  const analyze = async () => {
    if (!parsed) return
    setAnalyzing(true)
    setStatus(null)
    try {
      const { data: existing, error } = await supabase
        .from('projects')
        .select('id, name, developer_name')
      if (error) throw error
      const pool = existing || []

      const exact = {}      // parsedName -> existingId
      const review = []     // { parsedName, parsedDev, candidates }

      for (const proj of parsed.projects) {
        const matches = findMatches(proj.name, proj.developer_name, pool)
        if (!matches.length) {
          // no match, will be inserted as new
          continue
        }
        // Check for an "exact match" after normalization (score 1)
        const perfect = matches.find((m) => m.score === 1)
        if (perfect) {
          exact[proj.name] = perfect.id
        } else {
          // Fuzzy — needs review. Default decision = "insert" (safer)
          review.push({
            parsedName: proj.name,
            parsedDev: proj.developer_name || '',
            candidates: matches,
            decision: 'insert',
          })
        }
      }

      setExactMatches(exact)
      if (review.length > 0) {
        setReviewItems(review)
      } else {
        // No fuzzy matches → import directly
        await doImport(exact, {})
      }
    } catch (e) {
      setStatus({ type: 'error', msg: 'Analysis failed: ' + e.message })
    } finally {
      setAnalyzing(false)
    }
  }

  // Called when user clicks "Continue Import" in the review modal
  const confirmReview = async () => {
    const decisions = {}
    for (const item of reviewItems || []) {
      if (item.decision !== 'insert') {
        decisions[item.parsedName] = item.decision // existing project id
      }
    }
    setReviewItems(null)
    await doImport(exactMatches, decisions)
  }

  // ---- Import to Supabase ----
  // exactMap: { parsedName: id } – auto-detected exact matches
  // userMap : { parsedName: id } – user-confirmed fuzzy matches
  // For any parsed project NOT in either map → INSERT new
  const doImport = async (exactMap = {}, userMap = {}) => {
    if (!parsed) return
    setImporting(true)
    setStatus(null)
    let projCount = 0
    let unitCount = 0
    let updatedCount = 0
    let createdCount = 0

    try {
      for (const proj of parsed.projects) {
        setProgress(`Importing ${proj.name}…`)

        // Decide the project id
        const overrideId = userMap[proj.name] || exactMap[proj.name] || null

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
        if (parsed.format === 'developers_master') {
          projectRow.is_mixed = !!proj.is_mixed
          projectRow.is_commercial = !!proj.is_commercial
          projectRow.is_residential = !!proj.is_residential
          projectRow.is_medical = !!proj.is_medical
          projectRow.is_administrative = !!proj.is_administrative
          projectRow.is_coastal = !!proj.is_coastal
          projectRow.types_raw = proj.types_raw || null
          delete projectRow.start_price
        }

        let projectId
        if (overrideId) {
          // Update existing (matched by user or by exact normalize)
          projectId = overrideId
          // Keep the existing project's name? NO — user wants update so use parsed name
          // Actually, since the user MATCHED it, we keep the existing name to avoid renaming
          // Use the parsed name only if not in userMap (auto-exact)
          const keepExistingName = !!userMap[proj.name]
          if (keepExistingName) delete projectRow.name
          await supabase.from('projects').update(projectRow).eq('id', projectId)
          updatedCount++
        } else {
          // No match → check by name one more time (safety net)
          const { data: existing } = await supabase
            .from('projects')
            .select('id')
            .eq('name', proj.name)
            .maybeSingle()
          if (existing) {
            projectId = existing.id
            await supabase.from('projects').update(projectRow).eq('id', projectId)
            updatedCount++
          } else {
            const { data: ins, error } = await supabase
              .from('projects')
              .insert(projectRow)
              .select('id')
              .single()
            if (error) throw error
            projectId = ins.id
            createdCount++
          }
        }
        projCount++

        // 2) Replace units for this project
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
            status: (u.status || 'available').toLowerCase().includes('avail') ? 'available' : 'reserved',
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
          for (let i = 0; i < unitRows.length; i += 500) {
            const chunk = unitRows.slice(i, i + 500)
            const { error } = await supabase.from('units').insert(chunk)
            if (error) throw error
            unitCount += chunk.length
          }
        }

        // 3) Payment plans
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

      const summary = parsed.isProjectsOnly
        ? `${updatedCount} updated · ${createdCount} created (${projCount} projects total)`
        : `${unitCount} units · ${updatedCount} updated · ${createdCount} created`
      setStatus({ type: 'success', msg: `Done ✓ — ${summary}` })
      setParsed(null)
      setExactMatches({})
      setWaText('')
    } catch (e) {
      console.error(e)
      setStatus({ type: 'error', msg: 'Import failed: ' + e.message })
    } finally {
      setImporting(false)
      setProgress('')
    }
  }

  const exactCount = Object.keys(exactMatches).length

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-xl font-bold text-ink mb-1">Import Availability</h1>
      <p className="text-sm text-ink-muted mb-6">
        Upload an Excel sheet or paste a WhatsApp message. Smart name matching will catch
        similar project names and let you review them before importing.
      </p>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => { setTab('excel'); setParsed(null); setStatus(null); setReviewItems(null) }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'excel' ? 'bg-covo-gold text-black' : 'bg-bg-card text-ink-muted hover:text-ink'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" /> Excel
        </button>
        <button
          onClick={() => { setTab('whatsapp'); setParsed(null); setStatus(null); setReviewItems(null) }}
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
            Developers sheet, Mountain View, Madinet Masr, CSV &amp; xlsx supported
          </p>
          <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
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
              onClick={analyze}
              disabled={importing || analyzing}
              className="flex items-center gap-2 bg-covo-gold text-black text-sm font-semibold px-5 py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {analyzing || importing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> {progress || (analyzing ? 'Checking for matches…' : 'Importing…')}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Smart Import
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
                    const cat = p.is_mixed ? 'Residential + Commercial' : p.type === 'commercial' ? 'Commercial' : 'Residential'
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

      {/* ── Review Modal ── */}
      {reviewItems && (
        <ReviewModal
          items={reviewItems}
          exactCount={exactCount}
          totalParsed={parsed?.projects.length || 0}
          onCancel={() => setReviewItems(null)}
          onChange={(idx, decision) => {
            setReviewItems((prev) => {
              const next = [...prev]
              next[idx] = { ...next[idx], decision }
              return next
            })
          }}
          onConfirm={confirmReview}
          importing={importing}
        />
      )}
    </div>
  )
}

// ─── Review Modal ─────────────────────────────────────
function ReviewModal({ items, exactCount, totalParsed, onCancel, onChange, onConfirm, importing }) {
  const newCount = totalParsed - exactCount - items.length
  const matchedCount = items.filter((it) => it.decision !== 'insert').length
  const insertCount = items.filter((it) => it.decision === 'insert').length

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-bg-card border border-line rounded-lg shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-start justify-between px-5 py-4 border-b border-line shrink-0">
          <div>
            <h2 className="text-sm font-bold text-ink flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-covo-gold" />
              Review Similar Names
            </h2>
            <p className="text-[11px] text-ink-faint mt-0.5">
              Found {items.length} project{items.length === 1 ? '' : 's'} with similar names already in the database.
              Choose what to do with each.
            </p>
          </div>
          <button onClick={onCancel} className="text-ink-faint hover:text-ink shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Summary banner */}
        <div className="px-5 py-2.5 bg-bg-base border-b border-line shrink-0 flex items-center gap-4 text-[11px]">
          <span className="text-covo-teal">
            <Check className="w-3 h-3 inline mr-1" />
            {exactCount} exact match{exactCount === 1 ? '' : 'es'} (auto-update)
          </span>
          <span className="text-ink-faint">·</span>
          <span className="text-covo-gold">
            ⚠ {items.length} need review
          </span>
          <span className="text-ink-faint">·</span>
          <span className="text-ink-muted">
            {newCount} new (will insert)
          </span>
        </div>

        {/* Review list */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {items.map((item, idx) => (
            <div key={item.parsedName + idx} className="bg-bg-base border border-line rounded-md p-3">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <p className="text-[10px] text-ink-faint uppercase tracking-wide mb-0.5">From Excel</p>
                  <p className="text-sm font-semibold text-ink truncate">{item.parsedName}</p>
                  {item.parsedDev && <p className="text-[11px] text-ink-faint">{item.parsedDev}</p>}
                </div>
              </div>

              <div className="space-y-1.5 mt-3">
                {item.candidates.map((c) => (
                  <label
                    key={c.id}
                    className={`flex items-center justify-between gap-2 px-3 py-2 rounded border cursor-pointer transition-colors ${
                      item.decision === c.id
                        ? 'border-covo-gold/60 bg-covo-gold/10'
                        : 'border-line hover:border-line/80'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <input
                        type="radio"
                        name={`decision-${idx}`}
                        checked={item.decision === c.id}
                        onChange={() => onChange(idx, c.id)}
                        className="accent-covo-gold shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs text-ink font-medium truncate">
                          Match to <span className="text-covo-gold">{c.name}</span>
                        </p>
                        {c.developer_name && (
                          <p className="text-[10px] text-ink-faint truncate">{c.developer_name}</p>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] text-ink-faint shrink-0 font-mono">
                      {Math.round(c.score * 100)}%
                    </span>
                  </label>
                ))}

                <label
                  className={`flex items-center gap-2 px-3 py-2 rounded border cursor-pointer transition-colors ${
                    item.decision === 'insert'
                      ? 'border-covo-teal/60 bg-covo-teal/10'
                      : 'border-line hover:border-line/80'
                  }`}
                >
                  <input
                    type="radio"
                    name={`decision-${idx}`}
                    checked={item.decision === 'insert'}
                    onChange={() => onChange(idx, 'insert')}
                    className="accent-covo-teal shrink-0"
                  />
                  <p className="text-xs text-ink">
                    Create as new project <span className="text-ink-faint">(keep separate)</span>
                  </p>
                </label>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-line bg-bg-base/30 flex items-center justify-between shrink-0">
          <p className="text-[11px] text-ink-faint">
            <span className="text-covo-gold">{matchedCount}</span> will update ·{' '}
            <span className="text-covo-teal">{insertCount + newCount}</span> will be created
          </p>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              disabled={importing}
              className="bg-bg-base border border-line text-ink-muted text-xs font-semibold px-4 py-2 rounded-md hover:text-ink disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={importing}
              className="flex items-center gap-1.5 bg-covo-gold hover:opacity-90 disabled:opacity-50 text-black text-xs font-semibold px-4 py-2 rounded-md"
            >
              {importing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
              Continue Import
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
