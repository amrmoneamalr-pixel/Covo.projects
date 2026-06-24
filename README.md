# COVO Projects

A standalone real-estate project database — separate from COVO CRM, sharing its
brand. React + Vite + Supabase. Public browsing site + admin import panel.

## What it does

- **Public site** (`/`) — browse projects in a 3-panel layout (filters · list ·
  detail) modeled on Master V, styled with COVO branding. Each project shows its
  price list, payment plans, master plan, brochure, and per-unit floor-plan
  layouts.
- **Admin panel** (`/admin`, password-gated) —
  - **Import**: drop an Excel sheet or paste a WhatsApp message. Format is
    auto-detected (Mountain View / Madinet Masr / generic / WhatsApp), previewed,
    then one-click imported.
  - **Manage Projects**: edit project details, upload brochure / master plan /
    logo, add floor-plan layouts, and auto-match units to layouts by
    category + built-up-area (with manual override).

## Setup

### 1. Install
```bash
npm install
```

### 2. Database
In the Supabase dashboard → **SQL Editor** → **New query**, paste the contents of
`supabase/schema.sql` and run it. This creates all tables, indexes, triggers,
row-level-security policies, and the `project-assets` storage bucket.

### 3. Environment
`.env` is already filled in with your project URL and anon key. (It is gitignored.)
For a fresh clone, copy `.env.example` to `.env` and fill in:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_ADMIN_PASSWORD=...        # password for the /admin panel
```

### 4. Run
```bash
npm run dev      # http://localhost:5173
npm run build    # production build into dist/
```

## Weekly workflow

1. Receive availability sheets / WhatsApp messages.
2. Go to `/admin` → **Import**.
3. Excel: drop the file. WhatsApp: paste the text. Review the preview.
4. Click **Import to Database**. Units are replaced (upserted) per project —
   start prices recalculate automatically.
5. (Once per project) In **Manage Projects**, upload the brochure + master plan,
   add floor-plan layouts, and hit **Auto-match units** to link each unit to its
   layout. Manual links are preserved on re-import.

## Import formats

| Format | Detection | Shape |
| --- | --- | --- |
| Mountain View | sheet has `Unit Code` + `Unit Price` | one sheet per project |
| Madinet Masr | sheet has `Project` + `Nominal Price` | single sheet, many projects |
| Generic Excel | fallback | best-effort column guessing |
| WhatsApp | pasted text | headings = projects, `*` lines = units |

## Layout matching

`src/utils/layoutMatcher.js` scores each unit against the project's layouts using
unit type (hard filter), bedrooms, BUA proximity (strongest signal), and category
text overlap. Units flagged `layout_override = true` are never auto-rematched, so
manual corrections survive future imports.

## Deploy (Vercel)

1. Push to GitHub.
2. Import the repo in Vercel.
3. Add the three `VITE_*` environment variables in Vercel project settings.
4. Build command `npm run build`, output dir `dist`.

## Project structure

```
supabase/schema.sql          database schema (run once)
src/
  lib/supabase.js            client + asset upload helper
  utils/parsers.js           Excel + WhatsApp parsers
  utils/layoutMatcher.js     unit ↔ layout matching
  components/                Logo, Navbar, FilterSidebar, ProjectCard,
                             ProjectDetail, PriceTable, BrochureModal
  pages/Projects.jsx         public 3-panel site
  pages/admin/               AdminLayout, ImportExcel, ManageProjects
```
