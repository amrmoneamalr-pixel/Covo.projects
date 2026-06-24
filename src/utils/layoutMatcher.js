// ============================================================
// COVO Projects — Layout Matcher
// Auto-links availability units to brochure floor-plan layouts
// using Category + Built-Up-Area, with a manual-override escape hatch.
// ============================================================

import { normalizeUnitType } from './parsers'

// Score how well a layout matches a unit. Higher = better. null = no match.
function scoreMatch(unit, layout) {
  // Type must be compatible
  const uType = unit.unit_type || normalizeUnitType(unit.category)
  const lType = layout.unit_type || normalizeUnitType(layout.category)
  let score = 0

  if (uType && lType) {
    if (uType === lType) score += 50
    else return null // hard mismatch (villa never matches apartment)
  }

  // Bedrooms (if both known)
  if (unit.bedrooms && layout.bedrooms) {
    if (unit.bedrooms === layout.bedrooms) score += 25
    else score -= 15
  }

  // BUA proximity — the strongest signal
  if (unit.bua && layout.bua) {
    const diff = Math.abs(unit.bua - layout.bua)
    if (diff === 0) score += 40
    else if (diff <= 3) score += 35
    else if (diff <= 8) score += 25
    else if (diff <= 15) score += 12
    else if (diff <= 30) score += 4
    else score -= 5
  } else if (layout.bua_min && layout.bua_max && unit.bua) {
    if (unit.bua >= layout.bua_min && unit.bua <= layout.bua_max) score += 20
  }

  // Category text overlap (e.g. both contain "Garden")
  if (unit.category && layout.category) {
    const uc = unit.category.toLowerCase()
    const lc = layout.category.toLowerCase()
    if (uc === lc) score += 15
    else if (uc.includes(lc) || lc.includes(uc)) score += 8
  }

  return score
}

// Given one unit and the project's layouts, return the best layout id (or null).
export function matchUnitToLayout(unit, layouts) {
  let best = null
  let bestScore = 10 // minimum threshold to accept a match
  for (const layout of layouts) {
    const s = scoreMatch(unit, layout)
    if (s != null && s > bestScore) {
      bestScore = s
      best = layout
    }
  }
  return best ? { layout_id: best.id, score: bestScore } : null
}

// Batch: returns [{ unit_id, layout_id, score }] for units that aren't
// manually overridden. Units with layout_override = true are skipped.
export function autoMatchAll(units, layouts) {
  const results = []
  for (const unit of units) {
    if (unit.layout_override) continue
    const m = matchUnitToLayout(unit, layouts)
    if (m) results.push({ unit_id: unit.id, layout_id: m.layout_id, score: m.score })
  }
  return results
}
