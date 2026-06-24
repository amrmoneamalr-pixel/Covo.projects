import { Search, Bell, MessageCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import Logo from './Logo'

export default function Navbar({
  search,
  onSearch,
  count = 0,
  type,
  onType,
}) {
  return (
    <header className="flex items-center gap-4 px-4 h-14 bg-bg-sidebar border-b border-line shrink-0">
      <Link to="/">
        <Logo size="sm" />
      </Link>

      {/* Residential / Commercial toggle */}
      <div className="flex rounded-lg overflow-hidden border border-line ml-2">
        <button
          onClick={() => onType('residential')}
          className={`px-4 py-1.5 text-xs font-semibold transition-colors ${
            type === 'residential'
              ? 'bg-covo-teal text-black'
              : 'text-ink-muted hover:text-ink'
          }`}
        >
          Residential
        </button>
        <button
          onClick={() => onType('commercial')}
          className={`px-4 py-1.5 text-xs font-semibold transition-colors ${
            type === 'commercial'
              ? 'bg-covo-gold text-black'
              : 'text-ink-muted hover:text-ink'
          }`}
        >
          Commercial
        </button>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-xl mx-auto relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search projects, developers, areas…"
          className="w-full bg-bg-base border border-line rounded-lg pl-9 pr-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-covo-gold/60"
        />
      </div>

      {/* Count */}
      <div className="text-xs text-ink-muted whitespace-nowrap">
        Projects{' '}
        <span className="inline-block bg-bg-hover text-ink px-2 py-0.5 rounded-full font-semibold ml-1">
          {count}
        </span>
      </div>

      <button className="text-ink-muted hover:text-ink transition-colors">
        <Bell className="w-5 h-5" />
      </button>
      <button className="text-covo-teal hover:opacity-80 transition-opacity">
        <MessageCircle className="w-5 h-5" />
      </button>

      <Link
        to="/admin"
        className="text-[11px] text-ink-faint hover:text-covo-gold transition-colors border border-line rounded-md px-2.5 py-1"
      >
        Admin
      </Link>
    </header>
  )
}
