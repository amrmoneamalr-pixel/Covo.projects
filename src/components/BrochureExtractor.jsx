// ============================================================
// BrochureExtractor
// Upload a PDF brochure → extract each page as an image →
// tag each page as Master Plan / Layout / Skip →
// save Master Plan to project, save Layouts to unit_layouts.
// Loads pdf.js from CDN at runtime (no npm install needed).
// ============================================================

import { useState, useRef } from 'react'
import {
  Upload, X, FileText, Loader2, Map, LayoutGrid, SkipForward,
  Check, AlertCircle, Wand2
} from 'lucide-react'
import { supabase, uploadAsset } from '../lib/supabase'
import { autoMatchAll } from '../utils/layoutMatcher'
import { normalizeUnitType } from '../utils/parsers'

const PDFJS_VERSION = '3.11.174'
const PDFJS_CDN = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}`

// Lazy-load pdf.js from CDN (only the first time)
async function loadPdfJs() {
  if (window.pdfjsLib) return window.pdfjsLib
  await new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = `${PDFJS_CDN}/pdf.min.js`
    s.onload = resolve
    s.onerror = () => reject(new Error('Failed to load PDF reader'))
    document.head.appendChild(s)
  })
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = `${PDFJS_CDN}/pdf.worker.min.js`
  return window.pdfjsLib
}

// Render a single PDF page to a JPEG blob + a small data URL preview
async function renderPage(pdf, pageNum, scale = 1.5) {
  const page = await pdf.getPage(pageNum)
  const viewport = page.getViewport({ scale })
  const canvas = document.createElement('canvas')
  canvas.width = viewport.width
  canvas.height = viewport.height
  await page.render({
    canvasContext: canvas.getContext('2d'),
    viewport,
  }).promise

  // Get full-quality blob for upload
  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', 0.85)
  )

  // Make a small thumbnail for the grid (lighter on memory)
  const thumbCanvas = document.createElement('canvas')
  const thumbScale = 200 / viewport.width
  thumbCanvas.width = viewport.width * thumbScale
  thumbCanvas.height = viewport.height * thumbScale
  const ctx = thumbCanvas.getContext('2d')
  ctx.drawImage(canvas, 0, 0, thumbCanvas.width, thumbCanvas.height)
  const dataUrl = thumbCanvas.toDataURL('image/jpeg', 0.6)

  return { blob, dataUrl }
}

export default function BrochureExtractor({ project, onClose, onComplete }) {
  const [file, setFile] = useState(null)
  const [extracting, setExtracting] = useState(false)
  const [extractProgress, setExtractProgress] = useState('')
  const [pages, setPages] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(null)
  const fileInputRef = useRef(null)

  // ── Step 1: extract pages from PDF ──
  const handleFile = async (f) => {
    if (!f) return
    if (f.type !== 'application/pdf' && !f.name.toLowerCase().endsWith('.pdf')) {
      setError('Please choose a PDF file')
      return
    }
    setFile(f)
    setError('')
    setExtracting(true)
    setPages([])
    setExtractProgress('Loading PDF reader…')

    try {
      const pdfjs = await loadPdfJs()
      setExtractProgress('Reading PDF…')
      const buf = await f.arrayBuffer()
      const pdf = await pdfjs.getDocument({ data: buf }).promise

      const total = pdf.numPages
      const out = []
      for (let i = 1; i <= total; i++) {
        setExtractProgress(`Rendering page ${i} of ${total}…`)
        const { blob, dataUrl } = await renderPage(pdf, i)
        out.push({
          pageNum: i,
          blob,
          dataUrl,
          role: 'skip',
          meta: {
            name: '',
            category: '',
            bedrooms: '',
            bua: '',
            floor_type: '',
          },
        })
      }
      setPages(out)
    } catch (e) {
      console.error(e)
      setError('Could not read this PDF: ' + e.message)
      setFile(null)
    } finally {
      setExtracting(false)
      setExtractProgress('')
    }
  }

  // ── Step 2: tagging helpers ──
  const setRole = (idx, role) => {
    setPages((prev) => {
      const next = [...prev]
      next[idx] = { ...next[idx], role }
      return next
    })
  }

  const setMeta = (idx, field, value) => {
    setPages((prev) => {
      const next = [...prev]
      next[idx] = { ...next[idx], meta: { ...next[idx].meta, [field]: value } }
      return next
    })
  }

  // ── Step 3: upload everything ──
  const save = async () => {
    if (!file || !project) return
    const masterPages = pages.filter((p) => p.role === 'masterplan')
    const layoutPages = pages.filter((p) => p.role === 'layout')

    if (masterPages.length === 0 && layoutPages.length === 0) {
      setError('Tag at least one page as Master Plan or Layout')
      return
    }

    setUploading(true)
    setError('')
    let newLayoutCount = 0

    try {
      // 1. Upload the full brochure PDF itself
      setUploadProgress('Uploading brochure PDF…')
      const pdfPath = `${project.id}/brochure-${Date.now()}-${file.name}`
      const pdfUrl = await uploadAsset(file, pdfPath)
      await supabase.from('projects').update({ brochure_url: pdfUrl }).eq('id', project.id)

      // 2. Master Plan (use the first if multiple were tagged)
      if (masterPages.length > 0) {
        setUploadProgress('Uploading master plan…')
        const mp = masterPages[0]
        const mpFile = new File([mp.blob], `masterplan-p${mp.pageNum}.jpg`, { type: 'image/jpeg' })
        const mpPath = `${project.id}/masterplan-${Date.now()}-p${mp.pageNum}.jpg`
        const mpUrl = await uploadAsset(mpFile, mpPath)
        await supabase
          .from('projects')
          .update({ masterplan_url: mpUrl })
          .eq('id', project.id)
      }

      // 3. Layouts
      const insertedLayouts = []
      for (let i = 0; i < layoutPages.length; i++) {
        const lp = layoutPages[i]
        setUploadProgress(`Uploading layout ${i + 1} of ${layoutPages.length}…`)
        const lpFile = new File([lp.blob], `layout-p${lp.pageNum}.jpg`, { type: 'image/jpeg' })
        const lpPath = `${project.id}/layout-${Date.now()}-p${lp.pageNum}.jpg`
        const lpUrl = await uploadAsset(lpFile, lpPath)

        const bua = lp.meta.bua ? Number(lp.meta.bua) : null
        const layoutName = lp.meta.name || `Layout p${lp.pageNum}`
        const row = {
          project_id: project.id,
          name: layoutName,
          category: lp.meta.category || null,
          unit_type: normalizeUnitType(lp.meta.category || ''),
          bedrooms: lp.meta.bedrooms ? Number(lp.meta.bedrooms) : null,
          bua,
          bua_min: bua ? bua - 10 : null,
          bua_max: bua ? bua + 10 : null,
          floor_type: lp.meta.floor_type || null,
          image_url: lpUrl,
        }
        const { data, error } = await supabase
          .from('unit_layouts')
          .insert(row)
          .select()
          .single()
        if (error) throw error
        insertedLayouts.push(data)
        newLayoutCount++
      }

      // 4. Run auto-match if we added layouts
      let matchedCount = 0
      if (insertedLayouts.length > 0) {
        setUploadProgress('Matching units to layouts…')
        // Fetch all layouts for this project + units, then run matcher
        const [{ data: allLayouts }, { data: units }] = await Promise.all([
          supabase.from('unit_layouts').select('*').eq('project_id', project.id),
          supabase.from('units').select('*').eq('project_id', project.id),
        ])
        const matches = autoMatchAll(units || [], allLayouts || [])
        for (const m of matches) {
          await supabase.from('units').update({ layout_id: m.layout_id }).eq('id', m.unit_id)
          matchedCount++
        }
      }

      setDone({
        masterplan: masterPages.length > 0,
        layouts: newLayoutCount,
        matched: matchedCount,
      })
    } catch (e) {
      console.error(e)
      setError('Save failed: ' + e.message)
    } finally {
      setUploading(false)
      setUploadProgress('')
    }
  }

  const tagged = pages.filter((p) => p.role !== 'skip').length
  const masterCount = pages.filter((p) => p.role === 'masterplan').length
  const layoutCount = pages.filter((p) => p.role === 'layout').length
  const skipCount = pages.length - tagged

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-bg-card border border-line rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-line shrink-0">
          <div>
            <h2 className="text-sm font-bold text-ink flex items-center gap-2">
              <FileText className="w-4 h-4 text-covo-gold" />
              Smart Brochure Import
            </h2>
            <p className="text-[11px] text-ink-faint mt-0.5">{project?.name}</p>
          </div>
          <button onClick={onClose} className="text-ink-faint hover:text-ink shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {/* Done state */}
          {done ? (
            <div className="px-5 py-10 text-center">
              <div className="w-14 h-14 rounded-full bg-covo-teal/10 border border-covo-teal/30 flex items-center justify-center mx-auto mb-3">
                <Check className="w-6 h-6 text-covo-teal" />
              </div>
              <h3 className="text-sm font-bold text-ink mb-1">Done ✓</h3>
              <p className="text-xs text-ink-muted">
                {done.masterplan && <>Master plan saved · </>}
                {done.layouts} layout{done.layouts === 1 ? '' : 's'} added
                {done.matched > 0 && <> · {done.matched} units matched</>}
              </p>
              <button
                onClick={() => { setDone(null); onComplete?.(); onClose() }}
                className="mt-5 bg-covo-gold text-black text-xs font-semibold px-5 py-2 rounded-md hover:opacity-90"
              >
                Close
              </button>
            </div>
          ) : !file ? (
            // Upload area
            <div className="px-5 py-10">
              <label className="block border-2 border-dashed border-line rounded-xl p-10 text-center cursor-pointer hover:border-covo-gold/50 transition-colors">
                <Upload className="w-8 h-8 mx-auto mb-3 text-ink-faint" />
                <p className="text-sm text-ink">Drop a PDF brochure here or click to browse</p>
                <p className="text-xs text-ink-faint mt-1">
                  Pages will be extracted automatically — then you tag each one
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0])}
                />
              </label>
              {error && (
                <div className="flex items-center gap-2 mt-4 px-3 py-2 bg-covo-pink/10 text-covo-pink border border-covo-pink/30 rounded-md text-xs">
                  <AlertCircle className="w-3 h-3" />
                  {error}
                </div>
              )}
            </div>
          ) : extracting ? (
            <div className="px-5 py-16 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-covo-gold mx-auto mb-3" />
              <p className="text-sm text-ink">{extractProgress}</p>
              <p className="text-[11px] text-ink-faint mt-1">
                Large PDFs can take a moment
              </p>
            </div>
          ) : (
            // Pages grid
            <div className="px-5 py-4">
              {error && (
                <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-covo-pink/10 text-covo-pink border border-covo-pink/30 rounded-md text-xs">
                  <AlertCircle className="w-3 h-3" />
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {pages.map((p, idx) => (
                  <PageCard
                    key={p.pageNum}
                    page={p}
                    idx={idx}
                    onSetRole={setRole}
                    onSetMeta={setMeta}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {file && !done && (
          <div className="px-5 py-3 border-t border-line bg-bg-base/30 flex items-center justify-between shrink-0">
            <div className="text-[11px] text-ink-faint flex items-center gap-3 flex-wrap">
              <span><span className="text-covo-gold">{masterCount}</span> master plan</span>
              <span>·</span>
              <span><span className="text-covo-teal">{layoutCount}</span> layouts</span>
              <span>·</span>
              <span className="text-ink-muted">{skipCount} skip</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setFile(null); setPages([]); setError('') }}
                disabled={uploading}
                className="bg-bg-base border border-line text-ink-muted text-xs font-semibold px-4 py-2 rounded-md hover:text-ink disabled:opacity-50"
              >
                Change PDF
              </button>
              <button
                onClick={save}
                disabled={uploading || tagged === 0 || extracting}
                className="flex items-center gap-1.5 bg-covo-gold hover:opacity-90 disabled:opacity-40 text-black text-xs font-semibold px-4 py-2 rounded-md"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    {uploadProgress || 'Saving…'}
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3 h-3" />
                    Save & Auto-Match
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── PageCard ──────────────────────────────────────────────
function PageCard({ page, idx, onSetRole, onSetMeta }) {
  const isLayout = page.role === 'layout'
  const isMaster = page.role === 'masterplan'

  const borderClass =
    isMaster ? 'border-covo-gold/60 ring-1 ring-covo-gold/40' :
    isLayout ? 'border-covo-teal/60 ring-1 ring-covo-teal/40' :
    'border-line'

  return (
    <div className={`bg-bg-base border ${borderClass} rounded-lg overflow-hidden transition-all`}>
      <div className="aspect-[3/4] bg-white border-b border-line overflow-hidden">
        <img src={page.dataUrl} alt={`Page ${page.pageNum}`} className="w-full h-full object-contain" />
      </div>

      <div className="p-2">
        <p className="text-[10px] text-ink-faint mb-1.5 text-center font-mono">PAGE {page.pageNum}</p>

        {/* Role buttons */}
        <div className="grid grid-cols-3 gap-1 mb-2">
          <button
            onClick={() => onSetRole(idx, 'masterplan')}
            className={`flex flex-col items-center gap-0.5 py-1.5 rounded text-[9px] font-semibold transition-colors ${
              isMaster
                ? 'bg-covo-gold text-black'
                : 'bg-bg-card text-ink-muted hover:bg-bg-hover'
            }`}
          >
            <Map className="w-3 h-3" />
            Master
          </button>
          <button
            onClick={() => onSetRole(idx, 'layout')}
            className={`flex flex-col items-center gap-0.5 py-1.5 rounded text-[9px] font-semibold transition-colors ${
              isLayout
                ? 'bg-covo-teal text-black'
                : 'bg-bg-card text-ink-muted hover:bg-bg-hover'
            }`}
          >
            <LayoutGrid className="w-3 h-3" />
            Layout
          </button>
          <button
            onClick={() => onSetRole(idx, 'skip')}
            className={`flex flex-col items-center gap-0.5 py-1.5 rounded text-[9px] font-semibold transition-colors ${
              page.role === 'skip'
                ? 'bg-bg-card text-ink border border-line'
                : 'bg-bg-card text-ink-faint hover:bg-bg-hover'
            }`}
          >
            <SkipForward className="w-3 h-3" />
            Skip
          </button>
        </div>

        {/* Layout metadata fields */}
        {isLayout && (
          <div className="space-y-1.5 mt-2">
            <input
              type="text"
              value={page.meta.name}
              onChange={(e) => onSetMeta(idx, 'name', e.target.value)}
              placeholder="Layout name (e.g. Type A)"
              className="w-full bg-bg-card border border-line rounded px-2 py-1 text-[10px] text-ink placeholder:text-ink-faint focus:outline-none focus:border-covo-teal/60"
            />
            <input
              type="text"
              value={page.meta.category}
              onChange={(e) => onSetMeta(idx, 'category', e.target.value)}
              placeholder="Category (Apartment, Villa…)"
              className="w-full bg-bg-card border border-line rounded px-2 py-1 text-[10px] text-ink placeholder:text-ink-faint focus:outline-none focus:border-covo-teal/60"
            />
            <div className="grid grid-cols-2 gap-1.5">
              <input
                type="number"
                value={page.meta.bedrooms}
                onChange={(e) => onSetMeta(idx, 'bedrooms', e.target.value)}
                placeholder="BR"
                className="bg-bg-card border border-line rounded px-2 py-1 text-[10px] text-ink placeholder:text-ink-faint focus:outline-none focus:border-covo-teal/60"
              />
              <input
                type="number"
                value={page.meta.bua}
                onChange={(e) => onSetMeta(idx, 'bua', e.target.value)}
                placeholder="BUA m²"
                className="bg-bg-card border border-line rounded px-2 py-1 text-[10px] text-ink placeholder:text-ink-faint focus:outline-none focus:border-covo-teal/60"
              />
            </div>
            <input
              type="text"
              value={page.meta.floor_type}
              onChange={(e) => onSetMeta(idx, 'floor_type', e.target.value)}
              placeholder="Floor (Ground, Typical, Roof…)"
              className="w-full bg-bg-card border border-line rounded px-2 py-1 text-[10px] text-ink placeholder:text-ink-faint focus:outline-none focus:border-covo-teal/60"
            />
          </div>
        )}
      </div>
    </div>
  )
}
