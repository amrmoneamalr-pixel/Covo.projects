import { useState, useEffect } from 'react'
import {
  MapPin, FileText, Map, Image as ImageIcon, Info, Calendar, Layers, X,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import PriceTable from './PriceTable'
import BrochureModal from './BrochureModal'

const fmt = (n) => (n == null ? '—' : new Intl.NumberFormat('en-US').format(Math.round(n)))

export default function ProjectDetail({ project, onClose }) {
  const [units, setUnits] = useState([])
  const [layouts, setLayouts] = useState([])
  const [plans, setPlans] = useState([])
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // { type, ... }

  useEffect(() => {
    if (!project) return
    let cancelled = false
    setLoading(true)
    ;(async () => {
      const [u, l, p, m] = await Promise.all([
        supabase.from('units').select('*').eq('project_id', project.id).order('unit_price'),
        supabase.from('unit_layouts').select('*').eq('project_id', project.id),
        supabase.from('payment_plans').select('*').eq('project_id', project.id).order('sort_order'),
        supabase.from('project_materials').select('*').eq('project_id', project.id).order('sort_order'),
      ])
      if (cancelled) return
      setUnits(u.data || [])
      setLayouts(l.data || [])
      setPlans(p.data || [])
      setMaterials(m.data || [])
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [project])

  if (!project) {
    return (
      <div className="flex-1 flex items-center justify-center text-ink-faint">
        <div className="text-center">
          <Layers className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Select a project to view details</p>
        </div>
      </div>
    )
  }

  const masterplans = materials.filter((m) => m.type === 'masterplan')
  const gallery = materials.filter((m) => m.type === 'gallery')

  const stats = [
    { label: 'Delivery', value: project.delivery_label || (project.delivery_years ? `${project.delivery_years} Years` : '—') },
    { label: 'Club Fees', value: project.club_fees || '—' },
    { label: 'Cash Discount', value: project.cash_discount ? `${project.cash_discount}%` : '—' },
    { label: 'Maintenance', value: project.maintenance_pct ? `${project.maintenance_pct}%` : '—' },
    { label: 'Parking', value: project.parking_fees ? fmt(project.parking_fees) : '—' },
  ]

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-bg-base">
      {/* Header */}
      <div className="px-5 py-4 border-b border-line">
        <div className="flex items-start justify-between">
          <div className="flex gap-3">
            <div className="w-14 h-14 rounded-lg bg-bg-card border border-line flex items-center justify-center overflow-hidden shrink-0">
              {project.logo_url ? (
                <img src={project.logo_url} alt="" className="w-full h-full object-contain" />
              ) : (
                <span className="text-xl font-black text-ink-faint">{project.name?.[0]}</span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-ink">{project.name}</h2>
                {project.phase && (
                  <span className="text-xs text-ink-muted">{project.phase}</span>
                )}
                <span
                  className={`text-xs font-semibold ${
                    project.status === 'available' ? 'text-covo-teal' : 'text-covo-gold'
                  }`}
                >
                  ● {cap(project.status?.replace('_', ' '))}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-ink-muted">
                {project.launch_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(project.launch_date).toLocaleDateString('en-US', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                )}
                {project.acres && (
                  <span className="flex items-center gap-1">
                    <Layers className="w-3 h-3" />
                    {project.acres} Acres
                  </span>
                )}
                {(project.location || project.city) && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {[project.location, project.city].filter(Boolean).join(', ')}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-ink-faint hover:text-ink lg:hidden">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action tabs */}
        <div className="flex gap-2 mt-4">
          <TabButton
            icon={<FileText className="w-4 h-4" />}
            label="Brochure"
            disabled={!project.brochure_url}
            onClick={() => setModal({ type: 'pdf', url: project.brochure_url, title: `${project.name} — Brochure` })}
          />
          <TabButton
            icon={<Map className="w-4 h-4" />}
            label="Master Plan"
            disabled={!project.masterplan_url && masterplans.length === 0}
            onClick={() =>
              setModal({
                type: 'images',
                title: `${project.name} — Master Plan`,
                images: project.masterplan_url
                  ? [{ url: project.masterplan_url, label: 'Master Plan' }, ...masterplans.map((m) => ({ url: m.url, label: m.label }))]
                  : masterplans.map((m) => ({ url: m.url, label: m.label })),
              })
            }
          />
          <TabButton
            icon={<ImageIcon className="w-4 h-4" />}
            label="Gallery"
            disabled={gallery.length === 0}
            onClick={() =>
              setModal({
                type: 'images',
                title: `${project.name} — Gallery`,
                images: gallery.map((m) => ({ url: m.url, label: m.label })),
              })
            }
          />
          {project.location_url && (
            <a
              href={project.location_url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-xs text-ink-muted border border-line rounded-md px-3 py-2 hover:bg-bg-hover transition-colors"
            >
              <MapPin className="w-4 h-4" /> Location
            </a>
          )}
        </div>
      </div>

      {/* Stats strip */}
      <div className="flex gap-6 px-5 py-3 border-b border-line text-xs">
        {stats.map((s) => (
          <div key={s.label}>
            <p className="text-ink-faint">{s.label}</p>
            <p className="text-ink font-semibold mt-0.5">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Payment plans */}
      {plans.length > 0 && (
        <div className="px-5 py-3 border-b border-line">
          <p className="text-xs text-ink-faint mb-2">Payment Plans</p>
          <div className="flex gap-2 flex-wrap">
            {plans.map((p) => (
              <div
                key={p.id}
                className="bg-bg-card border border-line rounded-lg px-3 py-2 text-xs"
              >
                <span className="font-bold text-covo-gold">{p.down_payment_pct}% DP</span>
                <span className="text-ink-muted mx-1">/</span>
                <span className="text-ink">{p.years} Years</span>
                {p.discount_pct > 0 && (
                  <span className="text-covo-teal ml-2">{p.discount_pct}% off</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Price list */}
      <div className="flex-1 overflow-y-auto px-5 py-3">
        <p className="text-sm font-semibold text-ink mb-2">
          Price List{' '}
          <span className="text-ink-faint font-normal text-xs">
            Last update {project.updated_at ? new Date(project.updated_at).toLocaleDateString() : 'today'}
          </span>
        </p>
        {loading ? (
          <p className="text-ink-faint text-sm py-10 text-center">Loading units…</p>
        ) : units.length === 0 ? (
          <p className="text-ink-faint text-sm py-10 text-center">
            No units imported for this project yet.
          </p>
        ) : (
          <PriceTable
            units={units}
            layouts={layouts}
            onShowLayout={(layout) =>
              setModal({
                type: 'images',
                title: `${layout.name || 'Layout'} ${layout.bua ? `(${layout.bua} m²)` : ''}`,
                images: [{ url: layout.image_url, label: layout.floor_type || layout.name }],
              })
            }
          />
        )}
      </div>

      <BrochureModal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.title}
        pdfUrl={modal?.type === 'pdf' ? modal.url : null}
        images={modal?.type === 'images' ? modal.images : null}
      />
    </div>
  )
}

function TabButton({ icon, label, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1.5 text-xs border rounded-md px-3 py-2 transition-colors ${
        disabled
          ? 'border-line/50 text-ink-faint/40 cursor-not-allowed'
          : 'border-line text-ink-muted hover:bg-bg-hover hover:text-ink'
      }`}
    >
      {icon} {label}
    </button>
  )
}

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)
