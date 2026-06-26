import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar'
import FilterSidebar from '../components/FilterSidebar'
import ProjectCard from '../components/ProjectCard'
import ProjectDetail from '../components/ProjectDetail'
import PaymentPlanModal from '../components/PaymentPlanModal'

const emptyFilters = () => ({
  cities: new Set(),
  developers: new Set(),
  compounds: new Set(),
  types: new Set(),
  bedrooms: new Set(),
  finishing: new Set(),
  status: new Set(),
  deliveryFrom: null,
  deliveryTo: null,
  buaMin: null,
  buaMax: null,
  priceMin: null,
  priceMax: null,
  paymentPlan: null, // set by the modal
})

export default function Projects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [type, setType] = useState('residential')
  const [filters, setFilters] = useState(emptyFilters())
  const [selected, setSelected] = useState(null)
  const [saved, setSaved] = useState(() => loadSaved())
  const [planOpen, setPlanOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('updated_at', { ascending: false })
      if (cancelled) return
      if (error) console.error(error)
      setProjects(data || [])
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // Facet lists from loaded data (cities, developers WITH LOGOS, compounds)
  const facets = useMemo(() => {
    const cities = new Set()
    const developersMap = new Map() // name -> { name, logo_url }
    const compounds = new Set()
    for (const p of projects) {
      if (p.city) cities.add(p.city)
      if (p.developer_name && !developersMap.has(p.developer_name)) {
        developersMap.set(p.developer_name, {
          name: p.developer_name,
          logo_url: p.logo_url || '',
        })
      }
      if (p.area) compounds.add(p.area)
      else if (p.name) compounds.add(p.name) // fall back to project name as compound
    }
    return {
      cities: [...cities].sort(),
      developers: [...developersMap.values()].sort((a, b) =>
        a.name.localeCompare(b.name)
      ),
      compounds: [...compounds].sort(),
    }
  }, [projects])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return projects.filter((p) => {
      // Residential / Commercial toggle — mixed projects show in both
      if (type === 'residential') {
        const ok = p.is_residential || p.is_mixed || p.type === 'residential' || (!p.is_commercial && p.type !== 'commercial')
        if (!ok) return false
      } else if (type === 'commercial') {
        const ok = p.is_commercial || p.is_mixed || p.type === 'commercial'
        if (!ok) return false
      }
      if (q) {
        const hay = `${p.name} ${p.developer_name} ${p.city} ${p.location} ${p.area}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      if (filters.cities.size && !filters.cities.has(p.city)) return false
      if (filters.developers.size && !filters.developers.has(p.developer_name)) return false
      if (filters.compounds.size && !filters.compounds.has(p.area) && !filters.compounds.has(p.name)) return false
      if (filters.status.size && !filters.status.has(p.status)) return false
      if (filters.finishing.size && !filters.finishing.has(p.finishing)) return false

      // Type filter (project's dominant type, fallback: match any)
      if (filters.types.size && p.dominant_type && !filters.types.has(p.dominant_type)) return false

      // Price (project start price)
      if (filters.priceMin && p.start_price && p.start_price < filters.priceMin) return false
      if (filters.priceMax && p.start_price && p.start_price > filters.priceMax) return false

      // Delivery From/To range (in years; RTM = 0)
      const y = p.delivery_years != null ? Math.ceil(p.delivery_years) : null
      if (filters.deliveryFrom != null && y != null && y < filters.deliveryFrom) return false
      if (filters.deliveryTo != null && y != null && y > filters.deliveryTo) return false

      // Payment plan budget (applies to project start price as a coarse filter)
      const pp = filters.paymentPlan
      if (pp?.active) {
        if (pp.budgetFrom && p.start_price && p.start_price < pp.budgetFrom) return false
        if (pp.budgetTo && p.start_price && p.start_price > pp.budgetTo) return false
      }
      return true
    })
  }, [projects, search, type, filters])

  const toggleSave = (id) => {
    setSaved((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      persistSaved(next)
      return next
    })
  }

  return (
    <div className="h-screen flex flex-col">
      <Navbar search={search} onSearch={setSearch} count={filtered.length} type={type} onType={setType} />
      <div className="flex-1 flex overflow-hidden">
        <FilterSidebar
          filters={filters}
          setFilters={setFilters}
          facets={facets}
          onClear={() => setFilters(emptyFilters())}
          onSearch={() => {}}
          onOpenPaymentPlan={() => setPlanOpen(true)}
        />

        {/* Project list */}
        <div className="w-[28rem] border-r border-line overflow-y-auto p-3 shrink-0">
          {loading ? (
            <p className="text-ink-faint text-sm text-center py-10">Loading projects…</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-ink-faint text-sm">No projects found.</p>
              <p className="text-ink-faint text-xs mt-1">Import data from the Admin panel to get started.</p>
            </div>
          ) : (
            filtered.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                active={selected?.id === p.id}
                onClick={() => setSelected(p)}
                saved={saved.includes(p.id)}
                onToggleSave={() => toggleSave(p.id)}
              />
            ))
          )}
        </div>

        <ProjectDetail project={selected} onClose={() => setSelected(null)} />
      </div>

      <PaymentPlanModal
        open={planOpen}
        initial={filters.paymentPlan}
        onClose={() => setPlanOpen(false)}
        onApply={(plan) => setFilters((f) => ({ ...f, paymentPlan: plan }))}
      />
    </div>
  )
}

function loadSaved() {
  try {
    return JSON.parse(localStorage.getItem('covo_saved') || '[]')
  } catch {
    return []
  }
}
function persistSaved(arr) {
  try {
    localStorage.setItem('covo_saved', JSON.stringify(arr))
  } catch {}
}
