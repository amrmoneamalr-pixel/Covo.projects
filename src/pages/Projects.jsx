import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar'
import FilterSidebar from '../components/FilterSidebar'
import ProjectCard from '../components/ProjectCard'
import ProjectDetail from '../components/ProjectDetail'

const emptyFilters = () => ({
  cities: new Set(),
  developers: new Set(),
  types: new Set(),
  bedrooms: new Set(),
  delivery: new Set(),
  status: new Set(),
  buaMin: null,
  buaMax: null,
  priceMin: null,
  priceMax: null,
})

export default function Projects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [type, setType] = useState('residential')
  const [filters, setFilters] = useState(emptyFilters())
  const [selected, setSelected] = useState(null)
  const [saved, setSaved] = useState(() => loadSaved())

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

  // Build facet lists from loaded data
  const facets = useMemo(() => {
    const cities = new Set()
    const developers = new Set()
    const types = new Set()
    for (const p of projects) {
      if (p.city) cities.add(p.city)
      if (p.developer_name) developers.add(p.developer_name)
      if (p.dominant_type) types.add(p.dominant_type)
    }
    // common unit types fallback
    ;['apartment', 'villa', 'townhouse', 'twinhouse', 'ivilla', 'duplex', 'penthouse', 'chalet'].forEach((t) =>
      types.add(t)
    )
    return {
      cities: [...cities].sort(),
      developers: [...developers].sort(),
      types: [...types].sort(),
    }
  }, [projects])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return projects.filter((p) => {
      if (type && p.type && p.type !== type) return false
      if (q) {
        const hay = `${p.name} ${p.developer_name} ${p.city} ${p.location} ${p.area}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      if (filters.cities.size && !filters.cities.has(p.city)) return false
      if (filters.developers.size && !filters.developers.has(p.developer_name)) return false
      if (filters.status.size && !filters.status.has(p.status)) return false
      if (filters.priceMin && p.start_price && p.start_price < filters.priceMin) return false
      if (filters.priceMax && p.start_price && p.start_price > filters.priceMax) return false
      if (filters.delivery.size) {
        const y = Math.ceil(p.delivery_years || 0)
        const match = [...filters.delivery].some((f) => (f === 5 ? y >= 5 : y === f))
        if (!match) return false
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
      <Navbar
        search={search}
        onSearch={setSearch}
        count={filtered.length}
        type={type}
        onType={setType}
      />
      <div className="flex-1 flex overflow-hidden">
        <FilterSidebar
          filters={filters}
          setFilters={setFilters}
          facets={facets}
          onClear={() => setFilters(emptyFilters())}
          onSearch={() => {}}
        />

        {/* Project list */}
        <div className="w-[28rem] border-r border-line overflow-y-auto p-3 shrink-0">
          {loading ? (
            <p className="text-ink-faint text-sm text-center py-10">Loading projects…</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-ink-faint text-sm">No projects found.</p>
              <p className="text-ink-faint text-xs mt-1">
                Import data from the Admin panel to get started.
              </p>
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

        {/* Detail */}
        <ProjectDetail project={selected} onClose={() => setSelected(null)} />
      </div>
    </div>
  )
}

// localStorage isn't available in some embedded contexts; guard it.
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
  } catch {
    /* ignore */
  }
}
