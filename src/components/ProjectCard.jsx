import { MapPin, Bookmark, Clock } from 'lucide-react'

const fmt = (n) =>
  n == null ? '—' : new Intl.NumberFormat('en-US').format(Math.round(n)) + ' LE'

export default function ProjectCard({ project, active, onClick, saved, onToggleSave }) {
  const statusColor =
    project.status === 'available'
      ? 'text-covo-teal'
      : project.status === 'sold_out'
      ? 'text-covo-pink'
      : 'text-covo-gold'

  return (
    <div
      onClick={onClick}
      className={`cursor-pointer rounded-lg border p-3 mb-2 transition-all ${
        active
          ? 'border-covo-gold/60 bg-bg-hover'
          : 'border-line bg-bg-card hover:border-line hover:bg-bg-hover'
      }`}
    >
      <div className="flex gap-3">
        {/* Logo box */}
        <div className="w-12 h-12 rounded-md bg-bg-base border border-line flex items-center justify-center shrink-0 overflow-hidden">
          {project.logo_url ? (
            <img src={project.logo_url} alt="" className="w-full h-full object-contain" />
          ) : (
            <span className="text-base font-black text-ink-faint">
              {project.name?.[0]?.toUpperCase()}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-ink truncate">{project.name}</h3>
                {project.acres ? (
                  <span className="text-[10px] text-ink-faint whitespace-nowrap">
                    {project.acres} Acres
                  </span>
                ) : null}
              </div>
              {project.developer_name && (
                <p className="text-[11px] text-ink-muted truncate">{project.developer_name}</p>
              )}
              {(project.location || project.city) && (
                <p className="text-[11px] text-ink-faint flex items-center gap-1 truncate mt-0.5">
                  <MapPin className="w-3 h-3 shrink-0" />
                  {[project.location, project.city].filter(Boolean).join(', ')}
                </p>
              )}
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation()
                onToggleSave?.()
              }}
              className="shrink-0"
            >
              <Bookmark
                className={`w-4 h-4 ${
                  saved ? 'fill-covo-gold text-covo-gold' : 'text-ink-faint hover:text-ink'
                }`}
              />
            </button>
          </div>

          <div className="flex items-end justify-between mt-2">
            <div>
              <p className="text-sm font-bold text-covo-gold">{fmt(project.start_price)}</p>
              <p className="text-[10px] text-ink-faint">Start Price</p>
            </div>
            <div className="text-right">
              {project.delivery_label && (
                <p className="text-[11px] text-ink-muted">{project.delivery_label}</p>
              )}
              <p className={`text-[10px] font-semibold ${statusColor}`}>
                {cap(project.status?.replace('_', ' '))}
              </p>
            </div>
          </div>

          {/* Footer badges */}
          <div className="flex items-center gap-2 mt-2">
            {project.has_offer && (
              <span className="text-[9px] font-bold bg-covo-gold text-black px-1.5 py-0.5 rounded">
                OFFER
              </span>
            )}
            {project.booking_type && (
              <span className="text-[9px] text-ink-faint">{project.booking_type}</span>
            )}
            {project.unit_count != null && (
              <span className="text-[9px] text-ink-faint ml-auto flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" />
                {project.unit_count} units
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)
