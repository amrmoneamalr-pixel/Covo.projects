import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

// Two-option segmented toggle (Installment | Cash, etc.)
function Toggle({ left, right, value, onChange }) {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => onChange(left.value)}
        className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
          value === left.value
            ? 'bg-covo-teal text-black'
            : 'bg-bg-hover text-ink-muted hover:text-ink'
        }`}
      >
        {left.label} {value === left.value && '✓'}
      </button>
      <button
        onClick={() => onChange(right.value)}
        className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
          value === right.value
            ? 'bg-covo-teal text-black'
            : 'bg-bg-hover text-ink-muted hover:text-ink'
        }`}
      >
        {right.label} {value === right.value && '✓'}
      </button>
    </div>
  )
}

function FromTo({ label, from, to, onFrom, onTo, suffix }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-ink w-32 shrink-0">{label}</span>
      <input
        type="number"
        value={from ?? ''}
        onChange={(e) => onFrom(e.target.value ? Number(e.target.value) : null)}
        placeholder={suffix || ''}
        className="flex-1 bg-bg-base border border-line rounded-full px-4 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-covo-gold/60"
      />
      <span className="text-ink-muted text-sm">To</span>
      <input
        type="number"
        value={to ?? ''}
        onChange={(e) => onTo(e.target.value ? Number(e.target.value) : null)}
        placeholder={suffix || ''}
        className="flex-1 bg-bg-base border border-line rounded-full px-4 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-covo-gold/60"
      />
    </div>
  )
}

const YEAR_OPTIONS = Array.from({ length: 15 }, (_, i) => i + 1)

export default function PaymentPlanModal({ open, initial, onClose, onApply }) {
  const [pay, setPay] = useState('installment') // installment | cash
  const [priceMode, setPriceMode] = useState('total') // total | per_meter
  const [budgetFrom, setBudgetFrom] = useState(null)
  const [budgetTo, setBudgetTo] = useState(null)
  const [dpMode, setDpMode] = useState('value') // value | percent
  const [dpFrom, setDpFrom] = useState(null)
  const [dpTo, setDpTo] = useState(null)
  const [yearsFrom, setYearsFrom] = useState('')
  const [yearsTo, setYearsTo] = useState('')
  const [monthlyFrom, setMonthlyFrom] = useState(null)
  const [monthlyTo, setMonthlyTo] = useState(null)

  // hydrate from existing filter state when reopened
  useEffect(() => {
    if (!open || !initial) return
    setPay(initial.pay || 'installment')
    setPriceMode(initial.priceMode || 'total')
    setBudgetFrom(initial.budgetFrom ?? null)
    setBudgetTo(initial.budgetTo ?? null)
    setDpMode(initial.dpMode || 'value')
    setDpFrom(initial.dpFrom ?? null)
    setDpTo(initial.dpTo ?? null)
    setYearsFrom(initial.yearsFrom ?? '')
    setYearsTo(initial.yearsTo ?? '')
    setMonthlyFrom(initial.monthlyFrom ?? null)
    setMonthlyTo(initial.monthlyTo ?? null)
  }, [open, initial])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const apply = () => {
    onApply({
      pay,
      priceMode,
      budgetFrom,
      budgetTo,
      dpMode,
      dpFrom,
      dpTo,
      yearsFrom: yearsFrom === '' ? null : Number(yearsFrom),
      yearsTo: yearsTo === '' ? null : Number(yearsTo),
      monthlyFrom,
      monthlyTo,
      active: true,
    })
    onClose()
  }

  const reset = () => {
    setPay('installment'); setPriceMode('total')
    setBudgetFrom(null); setBudgetTo(null)
    setDpMode('value'); setDpFrom(null); setDpTo(null)
    setYearsFrom(''); setYearsTo('')
    setMonthlyFrom(null); setMonthlyTo(null)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-bg-sidebar border border-line rounded-2xl w-full max-w-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <span className="text-lg font-bold text-ink">Payment Plan — LE</span>
          <button onClick={onClose} className="text-ink-muted hover:text-ink">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Installment / Cash */}
          <Toggle
            left={{ value: 'installment', label: 'Installment' }}
            right={{ value: 'cash', label: 'Cash' }}
            value={pay}
            onChange={setPay}
          />

          {/* Total Value / Per Meter + Budget */}
          <div className="bg-bg-card border border-line rounded-xl p-4 space-y-3">
            <Toggle
              left={{ value: 'total', label: 'Total Value' }}
              right={{ value: 'per_meter', label: 'Per Meter' }}
              value={priceMode}
              onChange={setPriceMode}
            />
            <FromTo
              label="Budget"
              from={budgetFrom}
              to={budgetTo}
              onFrom={setBudgetFrom}
              onTo={setBudgetTo}
            />
          </div>

          {/* Down Payment: Value / Percent */}
          {pay === 'installment' && (
            <div className="bg-bg-card border border-line rounded-xl p-4 space-y-3">
              <Toggle
                left={{ value: 'value', label: 'Value' }}
                right={{ value: 'percent', label: 'Percent %' }}
                value={dpMode}
                onChange={setDpMode}
              />
              <FromTo
                label="Down Payment"
                from={dpFrom}
                to={dpTo}
                onFrom={setDpFrom}
                onTo={setDpTo}
                suffix={dpMode === 'percent' ? '%' : ''}
              />
            </div>
          )}

          {/* Installment Years */}
          {pay === 'installment' && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-ink w-32 shrink-0">Installment Years</span>
              <select
                value={yearsFrom}
                onChange={(e) => setYearsFrom(e.target.value)}
                className="flex-1 bg-bg-base border border-line rounded-full px-4 py-2 text-sm text-ink focus:outline-none focus:border-covo-gold/60"
              >
                <option value="">Choose</option>
                {YEAR_OPTIONS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <span className="text-ink-muted text-sm">To</span>
              <select
                value={yearsTo}
                onChange={(e) => setYearsTo(e.target.value)}
                className="flex-1 bg-bg-base border border-line rounded-full px-4 py-2 text-sm text-ink focus:outline-none focus:border-covo-gold/60"
              >
                <option value="">Choose</option>
                {YEAR_OPTIONS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          )}

          {/* Monthly */}
          {pay === 'installment' && (
            <FromTo
              label="Monthly"
              from={monthlyFrom}
              to={monthlyTo}
              onFrom={setMonthlyFrom}
              onTo={setMonthlyTo}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={apply}
            className="flex-1 bg-covo-teal text-black text-sm font-bold py-3 rounded-lg hover:opacity-90"
          >
            Ok
          </button>
          <button
            onClick={() => { reset(); onClose() }}
            className="flex-1 bg-covo-pink text-white text-sm font-bold py-3 rounded-lg hover:opacity-90"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
