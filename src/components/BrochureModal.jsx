import { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight, Download, Maximize2 } from 'lucide-react'

// Generic modal for viewing a brochure (PDF) OR a set of images (master plan,
// layouts, gallery). Pass either { pdfUrl } or { images: [{url,label}] }.
export default function BrochureModal({ open, onClose, title, pdfUrl, images }) {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    setIdx(0)
  }, [open, pdfUrl, images])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (images?.length) {
        if (e.key === 'ArrowRight') setIdx((i) => Math.min(i + 1, images.length - 1))
        if (e.key === 'ArrowLeft') setIdx((i) => Math.max(i - 1, 0))
      }
    }
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, images, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-bg-sidebar border border-line rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-line">
          <h3 className="text-sm font-semibold text-ink">{title || 'Document'}</h3>
          <div className="flex items-center gap-2">
            {pdfUrl && (
              <a
                href={pdfUrl}
                download
                className="text-ink-muted hover:text-ink"
                onClick={(e) => e.stopPropagation()}
              >
                <Download className="w-4 h-4" />
              </a>
            )}
            <button onClick={onClose} className="text-ink-muted hover:text-ink">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto bg-bg-base flex items-center justify-center p-2">
          {pdfUrl ? (
            <iframe
              src={pdfUrl}
              title="brochure"
              className="w-full h-[70vh] rounded-md bg-white"
            />
          ) : images?.length ? (
            <img
              src={images[idx]?.url}
              alt={images[idx]?.label || ''}
              className="max-w-full max-h-[70vh] object-contain rounded-md"
            />
          ) : (
            <p className="text-ink-faint text-sm py-20">No document available.</p>
          )}
        </div>

        {/* Image navigation footer */}
        {images?.length > 1 && (
          <div className="flex items-center justify-between px-4 py-2 border-t border-line">
            <button
              onClick={() => setIdx((i) => Math.max(i - 1, 0))}
              disabled={idx === 0}
              className="text-ink-muted hover:text-ink disabled:opacity-30"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-xs text-ink-muted">
              {images[idx]?.label || `${idx + 1} / ${images.length}`}
            </span>
            <button
              onClick={() => setIdx((i) => Math.min(i + 1, images.length - 1))}
              disabled={idx === images.length - 1}
              className="text-ink-muted hover:text-ink disabled:opacity-30"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
