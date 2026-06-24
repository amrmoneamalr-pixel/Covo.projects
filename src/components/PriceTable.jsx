import { useState } from 'react'
import { Layout as LayoutIcon, ChevronRight } from 'lucide-react'

const fmt = (n) => (n == null ? '—' : new Intl.NumberFormat('en-US').format(Math.round(n)))

export default function PriceTable({ units, layouts, onShowLayout }) {
  const [expanded, setExpanded] = useState({})

  // Group units by category
  const groups = {}
  for (const u of units) {
    const key = u.category || 'Units'
    if (!groups[key]) groups[key] = []
    groups[key].push(u)
  }

  const layoutById = {}
  for (const l of layouts || []) layoutById[l.id] = l

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-ink-faint border-b border-line">
            <th className="text-left font-medium py-2 px-2">Type</th>
            <th className="text-right font-medium py-2 px-2">BUA</th>
            <th className="text-right font-medium py-2 px-2">Beds</th>
            <th className="text-right font-medium py-2 px-2">Garden</th>
            <th className="text-right font-medium py-2 px-2">Price</th>
            <th className="text-right font-medium py-2 px-2">Layout</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(groups).map(([cat, list]) => {
            const isOpen = expanded[cat] ?? true
            const prices = list.map((u) => u.unit_price).filter(Boolean)
            const minP = prices.length ? Math.min(...prices) : null
            return (
              <CategoryBlock
                key={cat}
                cat={cat}
                list={list}
                isOpen={isOpen}
                minPrice={minP}
                onToggle={() => setExpanded((e) => ({ ...e, [cat]: !isOpen }))}
                layoutById={layoutById}
                onShowLayout={onShowLayout}
              />
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function CategoryBlock({ cat, list, isOpen, minPrice, onToggle, layoutById, onShowLayout }) {
  return (
    <>
      <tr
        className="bg-bg-hover/50 cursor-pointer hover:bg-bg-hover"
        onClick={onToggle}
      >
        <td className="py-2 px-2 font-semibold text-ink" colSpan={4}>
          <span className="inline-flex items-center gap-1">
            <ChevronRight
              className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-90' : ''}`}
            />
            {cat}
            <span className="text-ink-faint font-normal ml-1">({list.length})</span>
          </span>
        </td>
        <td className="py-2 px-2 text-right font-bold text-covo-gold">
          {fmt(minPrice)} LE
        </td>
        <td></td>
      </tr>
      {isOpen &&
        list.map((u) => {
          const layout = u.layout_id ? layoutById[u.layout_id] : null
          return (
            <tr key={u.id} className="border-b border-line/40 hover:bg-bg-hover/30">
              <td className="py-1.5 px-2 text-ink-muted">
                {u.unit_code || u.model || '—'}
              </td>
              <td className="py-1.5 px-2 text-right text-ink">{u.bua ? `${u.bua} m` : '—'}</td>
              <td className="py-1.5 px-2 text-right text-ink-muted">{u.bedrooms || '—'}</td>
              <td className="py-1.5 px-2 text-right text-ink-muted">
                {u.garden_area ? `${u.garden_area} m` : '—'}
              </td>
              <td className="py-1.5 px-2 text-right font-semibold text-ink">{fmt(u.unit_price)}</td>
              <td className="py-1.5 px-2 text-right">
                {layout ? (
                  <button
                    onClick={() => onShowLayout(layout)}
                    className="inline-flex items-center gap-1 text-covo-blue hover:underline"
                  >
                    <LayoutIcon className="w-3 h-3" /> View
                  </button>
                ) : (
                  <span className="text-ink-faint">—</span>
                )}
              </td>
            </tr>
          )
        })}
    </>
  )
}
