import { useState } from 'react'
import { ChevronDown, X } from 'lucide-react'

function Section({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-line">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-ink hover:bg-bg-hover transition-colors"
      >
        {title}
        <ChevronDown
          className={`w-4 h-4 text-ink-faint transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && <div className="px-4 pb-3 space-y-1.5">{children}</div>}
    </div>
  )
}

function Check({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 text-xs text-ink-muted hover:text-ink cursor-pointer py-0.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="accent-covo-gold w-3.5 h-3.5"
      />
      {label}
    </label>
  )
}

export default function FilterSidebar({ filters, setFilters, facets, onClear, onSearch }) {
  const toggle = (key, value) => {
    setFilters((f) => {
      const set = new Set(f[key])
      set.has(value) ? set.delete(value) : set.add(value)
      return { ...f, [key]: set }
    })
  }

  const has = (key, value) => filters[key].has(value)

  return (
    <aside className="w-60 bg-bg-sidebar border-r border-line flex flex-col shrink-0 overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <Section title="Cities" defaultOpen>
          {facets.cities.length === 0 && (
            <p className="text-[11px] text-ink-faint">No data yet</p>
          )}
          {facets.cities.map((c) => (
            <Check key={c} label={c} checked={has('cities', c)} onChange={() => toggle('cities', c)} />
          ))}
        </Section>

        <Section title="Developer">
          {facets.developers.map((d) => (
            <Check key={d} label={d} checked={has('developers', d)} onChange={() => toggle('developers', d)} />
          ))}
        </Section>

        <Section title="Unit Types">
          {facets.types.map((t) => (
            <Check key={t} label={cap(t)} checked={has('types', t)} onChange={() => toggle('types', t)} />
          ))}
        </Section>

        <Section title="Bedrooms">
          {[1, 2, 3, 4, 5].map((b) => (
            <Check
              key={b}
              label={b === 5 ? '5+' : `${b} Bedroom${b > 1 ? 's' : ''}`}
              checked={has('bedrooms', b)}
              onChange={() => toggle('bedrooms', b)}
            />
          ))}
        </Section>

        <Section title="Built Up Area (m²)">
          <RangeInputs
            min={filters.buaMin}
            max={filters.buaMax}
            onMin={(v) => setFilters((f) => ({ ...f, buaMin: v }))}
            onMax={(v) => setFilters((f) => ({ ...f, buaMax: v }))}
          />
        </Section>

        <Section title="Price (LE)">
          <RangeInputs
            min={filters.priceMin}
            max={filters.priceMax}
            onMin={(v) => setFilters((f) => ({ ...f, priceMin: v }))}
            onMax={(v) => setFilters((f) => ({ ...f, priceMax: v }))}
          />
        </Section>

        <Section title="Delivery">
          {[1, 2, 3, 4, 5].map((y) => (
            <Check
              key={y}
              label={y === 5 ? '5+ Years' : `${y} Year${y > 1 ? 's' : ''}`}
              checked={has('delivery', y)}
              onChange={() => toggle('delivery', y)}
            />
          ))}
        </Section>

        <Section title="Status">
          {['available', 'coming_soon', 'sold_out'].map((s) => (
            <Check key={s} label={cap(s.replace('_', ' '))} checked={has('status', s)} onChange={() => toggle('status', s)} />
          ))}
        </Section>
      </div>

      {/* Clear + Search */}
      <div className="flex gap-2 p-3 border-t border-line">
        <button
          onClick={onClear}
          className="flex-1 flex items-center justify-center gap-1 text-xs text-ink-muted border border-line rounded-md py-2 hover:bg-bg-hover transition-colors"
        >
          <X className="w-3.5 h-3.5" /> Clear
        </button>
        <button
          onClick={onSearch}
          className="flex-1 text-xs font-semibold text-black bg-covo-teal rounded-md py-2 hover:opacity-90 transition-opacity"
        >
          Search
        </button>
      </div>
    </aside>
  )
}

function RangeInputs({ min, max, onMin, onMax }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        value={min || ''}
        onChange={(e) => onMin(e.target.value ? Number(e.target.value) : null)}
        placeholder="Min"
        className="w-full bg-bg-base border border-line rounded px-2 py-1.5 text-xs text-ink placeholder:text-ink-faint focus:outline-none focus:border-covo-gold/60"
      />
      <span className="text-ink-faint text-xs">–</span>
      <input
        type="number"
        value={max || ''}
        onChange={(e) => onMax(e.target.value ? Number(e.target.value) : null)}
        placeholder="Max"
        className="w-full bg-bg-base border border-line rounded px-2 py-1.5 text-xs text-ink placeholder:text-ink-faint focus:outline-none focus:border-covo-gold/60"
      />
    </div>
  )
}

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)
