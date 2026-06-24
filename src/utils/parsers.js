// ============================================================
// COVO Projects — Import Parsers
// Handles 3 input formats and normalizes them to a common shape.
//   1) Mountain View Excel  (one sheet per project)
//   2) Madinet Masr Excel   (one sheet, "Project" column)
//   3) WhatsApp pasted text  (Madinet-Masr-style availability messages)
// ============================================================

import * as XLSX from 'xlsx'

// ---- Common normalized unit shape -------------------------------------------
// {
//   project_name, unit_code, unit_price, status, category, unit_type,
//   bedrooms, bua, garden_area, roof_area, land_area, floor_no,
//   building, park, phase, model, delivery_status, raw
// }

// ---- helpers ----------------------------------------------------------------
const num = (v) => {
  if (v == null || v === '') return null
  if (typeof v === 'number') return v
  const cleaned = String(v).replace(/[^0-9.\-]/g, '')
  const n = parseFloat(cleaned)
  return isNaN(n) ? null : n
}

const str = (v) => (v == null ? '' : String(v).trim())

// Map a free-text category to a normalized unit_type used for filtering.
export function normalizeUnitType(category = '') {
  const c = category.toLowerCase()
  if (c.includes('town')) return 'townhouse'
  if (c.includes('twin')) return 'twinhouse'
  if (c.includes('standalone') || c.includes('s-villa') || c.includes('villa')) {
    if (c.includes('i-villa') || c.includes('ivilla')) return 'ivilla'
    return 'villa'
  }
  if (c.includes('duplex')) return 'duplex'
  if (c.includes('penthouse')) return 'penthouse'
  if (c.includes('loft')) return 'loft'
  if (c.includes('chalet')) return 'chalet'
  if (c.includes('studio')) return 'studio'
  if (c.includes('apartment') || c.includes('apart') || c.includes('residence')) return 'apartment'
  if (c.includes('millennial') || c.includes('garden')) return 'apartment'
  if (c.includes('beach')) return 'beachhouse'
  return 'other'
}

// Guess bedroom count from a model/category string like "...-3BR-145" or "2 Bedrooms".
function guessBedrooms(...texts) {
  for (const t of texts) {
    if (!t) continue
    const s = String(t)
    let m = s.match(/(\d+)\s*BR/i) || s.match(/(\d+)\s*bed/i) || s.match(/(\d+)\s*bedroom/i)
    if (m) return parseInt(m[1], 10)
  }
  return null
}

// ============================================================
// FORMAT DETECTION
// ============================================================
export function detectExcelFormat(workbook) {
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: null })
  const header = (rows[0] || []).map((h) => str(h).toLowerCase().replace(/"/g, '').trim())

  // Developers master sheet: Developer + Project Name + Locations + Types
  if (
    header.some((h) => h === 'developer') &&
    header.some((h) => h.includes('project name')) &&
    header.some((h) => h.includes('type'))
  ) {
    return 'developers_master'
  }
  // Madinet Masr: single sheet with a "Project" column + "Nominal Price"
  if (header.includes('project') && header.some((h) => h.includes('nominal'))) {
    return 'madinet_masr'
  }
  // Mountain View: "Unit Code" + "Unit Price" + per-sheet projects
  if (header.some((h) => h.includes('unit code')) && header.some((h) => h.includes('unit price'))) {
    return 'mountain_view'
  }
  // Fallback: try to be generic
  return 'generic'
}

// ============================================================
// Classify a project's category text into residential | commercial
// and extract sub-flags (medical, administrative, coastal, retail).
// Anything commercial / administrative / medical / retail -> commercial.
// ============================================================
export function classifyProjectType(typesText = '') {
  const t = typesText.toLowerCase()
  const flags = {
    residential: /residential|coastal|coastal/.test(t),
    commercial: /commercial|administ|medical|retail|office|clinic|pharmac/.test(t),
    medical: /medical|clinic|pharmac/.test(t),
    administrative: /administ|office|admin/.test(t),
    coastal: /coastal|coast/.test(t),
  }
  // Decide the primary bucket the project lives in.
  // If it has any commercial/medical/admin element -> commercial bucket.
  // Pure residential / coastal -> residential.
  let primary = 'residential'
  if (flags.commercial && !flags.residential) primary = 'commercial'
  else if (flags.commercial && flags.residential) primary = 'mixed'
  else primary = 'residential'
  return { primary, flags }
}

// ============================================================
// MOUNTAIN VIEW  (one sheet = one project)
// ============================================================
function parseMountainView(workbook) {
  const out = []
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: null })
    for (const r of rows) {
      const price = num(r['Unit Price'])
      const code = str(r['Unit Code'])
      if (!price && !code) continue // skip empty
      const category = str(r['Category'])
      out.push({
        project_name: sheetName.trim(),
        unit_code: code,
        unit_price: price,
        status: str(r['Unit Status']) || 'Available',
        category,
        unit_type: normalizeUnitType(category),
        bedrooms: guessBedrooms(r['Model'], category),
        bua: num(r['Built Up Area']),
        garden_area: num(r['Garden Area']) || 0,
        roof_area: num(r['Roof Area']) || 0,
        land_area: num(r['Land Area']) || 0,
        floor_no: str(r['Floor #']),
        building: str(r['Buil#'] ?? r['Building Type']),
        park: str(r['Park'] ?? r['park']),
        phase: str(r['Phase']),
        model: str(r['Model']),
        entrance: str(r['Entrance']),
        delivery_status: str(r['Delivery Status']),
        raw: r,
      })
    }
  }
  return out
}

// ============================================================
// MADINET MASR  (single sheet, "Project" column)
// ============================================================
function parseMadinetMasr(workbook) {
  const out = []
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: null })
  for (const r of rows) {
    const price = num(r['Nominal Price'])
    const project = str(r['Project'])
    if (!project && !price) continue
    const category = str(r['Usage Type'] ?? r['Unit Type*'])
    out.push({
      project_name: project,
      unit_code: str(r['Unit: Unit No.'] ?? r['Unit Name']),
      unit_price: price,
      status: 'Available',
      category,
      unit_type: normalizeUnitType(category),
      bedrooms: num(r['No. of Bedrooms']),
      bua: num(r['BUA']),
      garden_area: num(r['Garden Area']) || 0,
      roof_area: num(r['Roof Area']) || 0,
      land_area: 0,
      floor_no: str(r['Floor']),
      building: str(r['Building']),
      park: '',
      phase: '',
      model: str(r['Unit Name']),
      entrance: '',
      delivery_status: '',
      raw: r,
    })
  }
  return out
}

// ============================================================
// GENERIC fallback — best-effort column guessing
// ============================================================
function parseGeneric(workbook) {
  const out = []
  for (const sheetName of workbook.SheetNames) {
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: null })
    for (const r of rows) {
      const keys = Object.keys(r)
      const find = (...needles) =>
        keys.find((k) => needles.some((n) => k.toLowerCase().includes(n)))
      const priceKey = find('price', 'nominal')
      const codeKey = find('code', 'unit no', 'unit name')
      const catKey = find('category', 'usage', 'type')
      const buaKey = find('bua', 'built up', 'built-up')
      const price = num(r[priceKey])
      if (!price) continue
      const category = str(r[catKey])
      out.push({
        project_name: sheetName.trim(),
        unit_code: str(r[codeKey]),
        unit_price: price,
        status: 'Available',
        category,
        unit_type: normalizeUnitType(category),
        bedrooms: guessBedrooms(category),
        bua: num(r[buaKey]),
        garden_area: 0, roof_area: 0, land_area: 0,
        floor_no: '', building: '', park: '', phase: '',
        model: '', entrance: '', delivery_status: '',
        raw: r,
      })
    }
  }
  return out
}

// ============================================================
// MAIN: parse an uploaded Excel/CSV File -> { format, units, projects }
// ============================================================
export async function parseExcelFile(file) {
  const buf = await file.arrayBuffer()
  const workbook = XLSX.read(buf, { type: 'array', cellDates: true })
  const format = detectExcelFormat(workbook)

  // Developers master sheet: projects-only (no units/prices yet)
  if (format === 'developers_master') {
    const projects = parseDevelopersMaster(workbook)
    return { format, units: [], projects, isProjectsOnly: true }
  }

  let units = []
  if (format === 'mountain_view') units = parseMountainView(workbook)
  else if (format === 'madinet_masr') units = parseMadinetMasr(workbook)
  else units = parseGeneric(workbook)

  units = units.filter((u) => u.project_name && (u.unit_price || u.unit_code))
  return { format, units, projects: groupByProject(units, file.name) }
}

// ============================================================
// DEVELOPERS MASTER SHEET
// Columns: Developer | Project Name | Locations | Types
// Creates project records (no units). Used to seed the database
// with every developer + project + city + residential/commercial.
// ============================================================
function parseDevelopersMaster(workbook) {
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: null })

  // Normalize location names to clean city labels
  const cityMap = {
    'october': '6th October',
    '6th of october': '6th October',
    'mostakbal': 'Mostakbal City',
    'mostakbal city': 'Mostakbal City',
    'ain elsokhna': 'Ain Sokhna',
    'new alamin': 'New Alamein',
    'alexanderia': 'Alexandria',
  }
  const cleanCity = (loc) => {
    const s = str(loc)
    const key = s.toLowerCase()
    return cityMap[key] || (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)
  }

  const projects = []
  for (const r of rows) {
    // tolerate quoted/spaced header keys
    const get = (needle) => {
      const k = Object.keys(r).find((key) =>
        key.toLowerCase().replace(/"/g, '').trim().includes(needle)
      )
      return k ? str(r[k]).replace(/"/g, '').trim() : ''
    }
    const developer = get('developer')
    const name = get('project name') || get('project')
    const location = get('location')
    const typesText = get('type')
    if (!developer && !name) continue
    if (!name) continue

    const { primary, flags } = classifyProjectType(typesText)

    projects.push({
      name,
      developer_name: developer,
      city: cleanCity(location),
      type: primary === 'commercial' ? 'commercial' : 'residential', // mixed -> shows in both via is_mixed
      is_mixed: primary === 'mixed',
      is_commercial: flags.commercial,
      is_residential: flags.residential || primary === 'residential',
      is_medical: flags.medical,
      is_administrative: flags.administrative,
      is_coastal: flags.coastal,
      types_raw: typesText,
      status: 'available',
      source: 'developers_master',
      units: [],
      plans: [],
    })
  }
  return projects
}

// ============================================================
// WHATSAPP TEXT PARSER
// Handles messages like:
//   🌌Talala🌌
//   Installments: 5.2% - 15 Years | Delivery: 5 Years
//   🏢 Apartments
//   * 1 Bedroom: 4.3M
//   * 2 Bedrooms: 9.2M
//   * Standalone 179m: 24.2M
// Lines starting with * (or -) are units. Section headings set the project.
// "Installments:" / "Delivery:" lines attach a payment plan to the section.
// ============================================================
export function parseWhatsApp(text, defaultDeveloper = '') {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  const projects = {}     // name -> { project + units[] + plans[] }
  let current = null

  const stripEmoji = (s) =>
    s
      .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u2190-\u21FF\u2B00-\u2BFF]/gu, '')
      .replace(/[\u{FE00}-\u{FE0F}\u{200D}]/gu, '') // variation selectors + ZWJ residue
      .trim()

  const parsePrice = (s) => {
    // "4.3M" -> 4300000 ; "11.3M" -> 11300000 ; "950K" -> 950000 ; raw numbers too
    const m = s.match(/([\d.,]+)\s*([MmKk])?/)
    if (!m) return null
    let val = parseFloat(m[1].replace(/,/g, ''))
    if (isNaN(val)) return null
    const unit = (m[2] || '').toLowerCase()
    if (unit === 'm') val *= 1_000_000
    else if (unit === 'k') val *= 1_000
    return Math.round(val)
  }

  const isUnitLine = (l) => /^[*\-•]/.test(l)
  const isHeading = (l) => {
    const clean = stripEmoji(l)
    // Headings: wrapped in emoji, or Title Case with no ":" and no leading bullet
    if (isUnitLine(l)) return false
    if (/installment|delivery/i.test(l)) return false
    if (clean.length === 0) return false
    // category sub-headers like "🏢 Apartments" / "🏘️ Townhouses"
    return true
  }

  for (const raw of lines) {
    const line = raw.replace(/^\s*[*\-•]\s*/, (m) => m) // keep marker for detection

    if (isUnitLine(line)) {
      if (!current) continue
      const body = line.replace(/^[*\-•]\s*/, '')
      // "2 Bedrooms: 9.2M"  OR  "Standalone 179m: 24.2M"  OR  "Echo House 166m: 17M"
      const [namePart, pricePart] = body.split(':')
      if (!pricePart) continue
      const price = parsePrice(pricePart)
      if (!price) continue
      const name = namePart.trim()
      const bua = (name.match(/(\d+)\s*m\b/i) || [])[1]
      const beds = guessBedrooms(name)
      current.units.push({
        project_name: current.project.name,
        unit_code: '',
        unit_price: price,
        status: 'Available',
        category: name.replace(/\d+\s*m\b/i, '').trim(),
        unit_type: normalizeUnitType(name),
        bedrooms: beds,
        bua: bua ? parseInt(bua, 10) : null,
        garden_area: 0, roof_area: 0, land_area: 0,
        floor_no: '', building: '', park: '', phase: '',
        model: name, entrance: '', delivery_status: '',
        raw: { line: body },
      })
      continue
    }

    // Installments / Delivery line — attach to current project
    if (/installment/i.test(line) && current) {
      const dpMatch = line.match(/([\d.]+)\s*%/)
      const yrMatch = line.match(/([\d.]+)\s*years?/i)
      const delMatch = line.match(/delivery[:\s]*([\d.]+)\s*years?/i)
      current.project.delivery_label = delMatch ? `${delMatch[1]} Years` : current.project.delivery_label
      current.project.delivery_years = delMatch ? parseFloat(delMatch[1]) : current.project.delivery_years
      current.plans.push({
        down_payment_pct: dpMatch ? parseFloat(dpMatch[1]) : null,
        years: yrMatch ? parseFloat(yrMatch[1]) : null,
        discount_pct: 0,
        payment_type: /backload/i.test(line) ? 'backloaded' : 'equal',
        monthly_after: line,
        label: line,
      })
      continue
    }
    if (/delivery/i.test(line) && current && !/installment/i.test(line)) {
      const delMatch = line.match(/([\d.]+)\s*years?/i)
      if (delMatch) {
        current.project.delivery_label = `${delMatch[1]} Years`
        current.project.delivery_years = parseFloat(delMatch[1])
      }
      continue
    }

    // Otherwise: heading. Decide if it's a NEW project or a category sub-header.
    if (isHeading(line)) {
      const clean = stripEmoji(line)
      const lc = clean.toLowerCase()
      // Category sub-headers (Apartments, Townhouses, Standalone Villas, S-Villas...)
      // — these describe unit groups inside a project, not new projects.
      const subHeaderWords = [
        'apartment', 'apartments', 'townhouse', 'townhouses', 'town house',
        's-villa', 's-villas', 'standalone', 'standalone villa', 'standalone villas',
        'villa', 'villas', 'duplex', 'duplexes', 'twin', 'twinhouse',
        'chalet', 'chalets', 'penthouse', 'penthouses',
      ]
      const isSub = subHeaderWords.some(
        (w) => lc === w || lc.startsWith(w + ' ') || lc.endsWith(' ' + w)
      )
      if (isSub && current) continue // skip; units carry their own category
      // New project
      const name = clean
      if (!name) continue
      if (!projects[name]) {
        projects[name] = {
          project: {
            name,
            developer_name: defaultDeveloper,
            source: 'whatsapp',
            status: 'available',
          },
          units: [],
          plans: [],
        }
      }
      current = projects[name]
    }
  }

  // flatten
  const allUnits = []
  Object.values(projects).forEach((p) => {
    p.units.forEach((u) => allUnits.push(u))
  })

  return {
    format: 'whatsapp',
    units: allUnits,
    projects: Object.values(projects).map((p) => ({
      ...p.project,
      units: p.units,
      plans: dedupePlans(p.plans),
    })),
  }
}

function dedupePlans(plans) {
  const seen = new Set()
  return plans.filter((p) => {
    const key = `${p.down_payment_pct}-${p.years}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// ============================================================
// Group flat units into projects (for Excel imports)
// ============================================================
function groupByProject(units, sourceFile = '') {
  const map = {}
  for (const u of units) {
    const name = u.project_name
    if (!map[name]) {
      map[name] = {
        name,
        source: sourceFile,
        status: 'available',
        units: [],
        plans: [],
      }
    }
    map[name].units.push(u)
  }
  // compute start_price + dominant unit type per project
  return Object.values(map).map((p) => {
    const prices = p.units.map((u) => u.unit_price).filter((x) => x > 0)
    return {
      ...p,
      start_price: prices.length ? Math.min(...prices) : null,
      unit_count: p.units.length,
    }
  })
}
