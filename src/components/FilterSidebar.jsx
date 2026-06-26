import { useState } from 'react'
import { ChevronDown, X, Search } from 'lucide-react'

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

// NEW: Check with logo (for developer list)
function CheckWithLogo({ name, logoUrl, checked, onChange }) {
  const initial = (name || '?').trim().charAt(0).toUpperCase()
  const [imgFailed, setImgFailed] = useState(false)
  const showImg = logoUrl && !imgFailed

  return (
    <label className="flex items-center gap-2 text-xs text-ink-muted hover:text-ink cursor-pointer py-0.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="accent-covo-gold w-3.5 h-3.5 shrink-0"
      />
      {/* Logo circle - fixed size for visual consistency */}
      <span className="w-5 h-5 rounded-full bg-white border border-line flex items-center justify-center overflow-hidden shrink-0">
        {showImg ? (
          <img
            src={logoUrl}
            alt=""
            onError={() => setImgFailed(true)}
            className="w-full h-full object-contain p-[1px]"
            loading="lazy"
          />
        ) : (
          <span className="text-covo-gold font-bold text-[9px]">{initial}</span>
        )}
      </span>
      <span className="truncate">{name}</span>
    </label>
  )
}

// Pill-style selector (used for Bedrooms: Studio + 1..9)
function Pills({ options, isActive, onToggle }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onToggle(o.value)}
          className={`min-w-[28px] px-2 py-1 rounded text-xs font-semibold transition-colors ${
            isActive(o.value)
              ? 'bg-covo-gold text-black'
              : 'bg-bg-base text-ink-muted border border-line hover:text-ink'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

// The fixed Types list from Master V (always shown — never empty)
const TYPE_OPTIONS = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'penthouse', label: 'Penthouse' },
  { value: 'duplex', label: 'Duplex' },
  { value: 'villa', label: 'Villas' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'twinhouse', label: 'Twinhouse' },
  { value: 'ivilla', label: 'I-Villa' },
  { value: 'chalet', label: 'Chalet' },
  { value: 'service', label: 'Service & Hotels' },
]

const FINISHING_OPTIONS = [
  { value: 'fully_finished', label: 'Fully Finished' },
  { value: 'semi_finished', label: 'Semi Finished' },
  { value: 'not_finished', label: 'Not Finished' },
  { value: 'core_shell', label: 'Core & Shell' },
]

const DELIVERY_OPTIONS = [
  { value: 0, label: 'RTM' },
  { value: 1, label: '1 Years' },
  { value: 2, label: '2 Years' },
  { value: 3, label: '3 Years' },
  { value: 4, label: '4 Years' },
  { value: 5, label: '5 Years' },
]

const BEDROOM_OPTIONS = [
  { value: 0, label: 'Studio' },
  ...Array.from({ length: 9 }, (_, i) => ({ value: i + 1, label: String(i + 1) })),
]

// Normalize a developer entry — accepts either a string or an object {name, logo_url}
function normalizeDev(d) {
  if (typeof d === 'string') return { name: d, logo_url: '' }
  return { name: d.name || '', logo_url: d.logo_url || d.logoUrl || '' }
}

export default function FilterSidebar({
  filters,
  setFilters,
  facets,
  onClear,
  onSearch,
  onOpenPaymentPlan,
}) {
  const [compoundQuery, setCompoundQuery] = useState('')
  const [developerQuery, setDeveloperQuery] = useState('')

  const toggle = (key, value) => {
    setFilters((f) => {
      const set = new Set(f[key])
      set.has(value) ? set.delete(value) : set.add(value)
      return { ...f, [key]: set }
    })
  }
  const has = (key, value) => filters[key].has(value)
  const setField = (k, v) => setFilters((f) => ({ ...f, [k]: v }))

  const compounds = (facets.compounds || []).filter((c) =>
    c.toLowerCase().includes(compoundQuery.toLowerCase())
  )

  // Developers: support both strings AND objects with logo_url
  const developers = (facets.developers || [])
    .map(normalizeDev)
    .filter((d) => d.name.toLowerCase().includes(developerQuery.toLowerCase()))

  return (
    <aside className="w-60 bg-bg-sidebar border-r border-line flex flex-col shrink-0 overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        {/* Cities */}
        <Section title="Cities" defaultOpen>
          {facets.cities.length === 0 ? (
            <p className="text-[11px] text-ink-faint">No cities in data yet</p>
          ) : (
            facets.cities.map((c) => (
              <Check key={c} label={c} checked={has('cities', c)} onChange={() => toggle('cities', c)} />
            ))
          )}
        </Section>

        {/* Types — fixed list */}
        <Section title="Types">
          {TYPE_OPTIONS.map((t) => (
            <Check
              key={t.value}
              label={t.label}
              checked={has('types', t.value)}
              onChange={() => toggle('types', t.value)}
            />
          ))}
        </Section>

        {/* Bedrooms — Studio + 1..9 as pills */}
        <Section title="Bedrooms">
          <Pills
            options={BEDROOM_OPTIONS}
            isActive={(v) => has('bedrooms', v)}
            onToggle={(v) => toggle('bedrooms', v)}
          />
        </Section>

        {/* Finishing — manual data from Admin */}
        <Section title="Finishing">
          {FINISHING_OPTIONS.map((f) => (
            <Check
              key={f.value}
              label={f.label}
              checked={has('finishing', f.value)}
              onChange={() => toggle('finishing', f.value)}
            />
          ))}
        </Section>

        {/* Delivery — From / To */}
        <Section title="Delivery">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[10px] text-ink-faint mb-1">From</p>
              {DELIVERY_OPTIONS.map((d) => (
                <Check
                  key={'df' + d.value}
                  label={d.label}
                  checked={filters.deliveryFrom === d.value}
                  onChange={() =>
                    setField('deliveryFrom', filters.deliveryFrom === d.value ? null : d.value)
                  }
                />
              ))}
            </div>
            <div>
              <p className="text-[10px] text-ink-faint mb-1">To</p>
              {DELIVERY_OPTIONS.map((d) => (
                <Check
                  key={'dt' + d.value}
                  label={d.label}
                  checked={filters.deliveryTo === d.value}
                  onChange={() =>
                    setField('deliveryTo', filters.deliveryTo === d.value ? null : d.value)
                  }
                />
              ))}
            </div>
          </div>
        </Section>

        {/* Payment Plan — opens modal */}
        <div className="border-b border-line">
          <button
            onClick={onOpenPaymentPlan}
            className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-ink hover:bg-bg-hover transition-colors"
          >
            Payment Plan
            <span className="text-[10px] text-covo-gold">Open</span>
          </button>
        </div>

        {/* Built Up Area — From / To */}
        <Section title="Built Up Area (m²)">
          <RangeInputs
            min={filters.buaMin}
            max={filters.buaMax}
            onMin={(v) => setField('buaMin', v)}
            onMax={(v) => setField('buaMax', v)}
          />
        </Section>

        {/* Price — From / To */}
        <Section title="Price (LE)">
          <RangeInputs
            min={filters.priceMin}
            max={filters.priceMax}
            onMin={(v) => setField('priceMin', v)}
            onMax={(v) => setField('priceMax', v)}
          />
        </Section>

        {/* Compound — search + list */}
        <Section title="Compound">
          <SearchBox value={compoundQuery} onChange={setCompoundQuery} placeholder="search ..." />
          <div className="max-h-48 overflow-y-auto mt-2 space-y-1">
            {compounds.length === 0 ? (
              <p className="text-[11px] text-ink-faint">No compounds match</p>
            ) : (
              compounds.map((c) => (
                <Check key={c} label={c} checked={has('compounds', c)} onChange={() => toggle('compounds', c)} />
              ))
            )}
          </div>
        </Section>

        {/* Developer — search + list WITH LOGOS */}
        <Section title="Developer">
          <SearchBox value={developerQuery} onChange={setDeveloperQuery} placeholder="search ..." />
          <div className="max-h-48 overflow-y-auto mt-2 space-y-1">
            {developers.length === 0 ? (
              <p className="text-[11px] text-ink-faint">No developers match</p>
            ) : (
              developers.map((d) => (
                <CheckWithLogo
                  key={d.name}
                  name={d.name}
                  logoUrl={d.logo_url}
                  checked={has('developers', d.name)}
                  onChange={() => toggle('developers', d.name)}
                />
              ))
            )}
          </div>
        </Section>

        {/* Status */}
        <Section title="Status">
          {['available', 'coming_soon', 'sold_out'].map((s) => (
            <Check
              key={s}
              label={cap(s.replace('_', ' '))}
              checked={has('status', s)}
              onChange={() => toggle('status', s)}
            />
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

function SearchBox({ value, onChange, placeholder }) {
  return (
    <div className="relative">
      <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-ink-faint" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-bg-base border border-line rounded pl-7 pr-2 py-1.5 text-xs text-ink placeholder:text-ink-faint focus:outline-none focus:border-covo-gold/60"
      />
    </div>
  )
}

function RangeInputs({ min, max, onMin, onMax }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        value={min || ''}
        onChange={(e) => onMin(e.target.value ? Number(e.target.value) : null)}
        placeholder="From"
        className="w-full bg-bg-base border border-line rounded px-2 py-1.5 text-xs text-ink placeholder:text-ink-faint focus:outline-none focus:border-covo-gold/60"
      />
      <span className="text-ink-faint text-xs">–</span>
      <input
        type="number"
        value={max || ''}
        onChange={(e) => onMax(e.target.value ? Number(e.target.value) : null)}
        placeholder="To"
        className="w-full bg-bg-base border border-line rounded px-2 py-1.5 text-xs text-ink placeholder:text-ink-faint focus:outline-none focus:border-covo-gold/60"
      />
    </div>
  )
}

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)
