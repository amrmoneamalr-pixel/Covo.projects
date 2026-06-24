import { useState } from 'react'
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom'
import { Upload, FolderCog, ArrowLeft, Lock } from 'lucide-react'
import Logo from '../../components/Logo'

const PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'covo2026'

export default function AdminLayout() {
  const [authed, setAuthed] = useState(() => {
    try {
      return sessionStorage.getItem('covo_admin') === 'ok'
    } catch {
      return false
    }
  })
  const [pw, setPw] = useState('')
  const [err, setErr] = useState(false)
  const loc = useLocation()

  const login = () => {
    if (pw === PASSWORD) {
      setAuthed(true)
      try {
        sessionStorage.setItem('covo_admin', 'ok')
      } catch {}
    } else {
      setErr(true)
    }
  }

  if (!authed) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="bg-bg-card border border-line rounded-xl p-8 w-80">
          <div className="flex justify-center mb-6">
            <Logo size="md" />
          </div>
          <div className="flex items-center gap-2 text-ink-muted text-sm mb-3">
            <Lock className="w-4 h-4" /> Admin Access
          </div>
          <input
            type="password"
            value={pw}
            onChange={(e) => {
              setPw(e.target.value)
              setErr(false)
            }}
            onKeyDown={(e) => e.key === 'Enter' && login()}
            placeholder="Password"
            className="w-full bg-bg-base border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-covo-gold/60"
          />
          {err && <p className="text-covo-pink text-xs mt-2">Wrong password</p>}
          <button
            onClick={login}
            className="w-full bg-covo-gold text-black text-sm font-semibold py-2 rounded-lg mt-3 hover:opacity-90"
          >
            Enter
          </button>
        </div>
      </div>
    )
  }

  const navItem = (to, icon, label) => {
    const active = loc.pathname === to
    return (
      <Link
        to={to}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm transition-colors ${
          active ? 'bg-covo-gold text-black font-semibold' : 'text-ink-muted hover:bg-bg-hover hover:text-ink'
        }`}
      >
        {icon} {label}
      </Link>
    )
  }

  return (
    <div className="h-screen flex">
      <aside className="w-56 bg-bg-sidebar border-r border-line flex flex-col p-3">
        <div className="px-2 py-3 mb-2">
          <Logo size="sm" />
        </div>
        <nav className="space-y-1 flex-1">
          {navItem('/admin', <Upload className="w-4 h-4" />, 'Import')}
          {navItem('/admin/projects', <FolderCog className="w-4 h-4" />, 'Manage Projects')}
        </nav>
        <Link
          to="/"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm text-ink-faint hover:text-ink"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Site
        </Link>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
