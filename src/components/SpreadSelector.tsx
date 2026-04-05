import { motion } from 'framer-motion'
import { SPREADS } from '../data/spreads'

interface SpreadSelectorProps {
  selectedId: string | null
  onSelect: (id: string) => void
  disabled?: boolean
}

function SpreadGlyph({ id }: { id: string }) {
  const stroke = 'currentColor'
  const className = 'h-10 w-10 shrink-0 text-[#d4af37]/75 sm:h-11 sm:w-11'
  switch (id) {
    case 'one':
      return (
        <svg className={className} viewBox="0 0 40 40" fill="none" aria-hidden>
          <rect
            x="12"
            y="6"
            width="16"
            height="28"
            rx="2"
            stroke={stroke}
            strokeWidth="1.5"
          />
        </svg>
      )
    case 'three':
      return (
        <svg className={className} viewBox="0 0 40 40" fill="none" aria-hidden>
          <rect x="4" y="8" width="10" height="24" rx="1.5" stroke={stroke} strokeWidth="1.2" />
          <rect x="15" y="8" width="10" height="24" rx="1.5" stroke={stroke} strokeWidth="1.2" />
          <rect x="26" y="8" width="10" height="24" rx="1.5" stroke={stroke} strokeWidth="1.2" />
        </svg>
      )
    case 'five':
      return (
        <svg className={className} viewBox="0 0 40 40" fill="none" aria-hidden>
          <rect x="17" y="4" width="8" height="12" rx="1" stroke={stroke} strokeWidth="1.2" />
          <rect x="6" y="18" width="8" height="12" rx="1" stroke={stroke} strokeWidth="1.2" />
          <rect x="17" y="18" width="8" height="12" rx="1" stroke={stroke} strokeWidth="1.2" />
          <rect x="28" y="18" width="8" height="12" rx="1" stroke={stroke} strokeWidth="1.2" />
          <rect x="17" y="26" width="8" height="12" rx="1" stroke={stroke} strokeWidth="1.2" />
        </svg>
      )
    case 'celtic':
      return (
        <svg className={className} viewBox="0 0 40 40" fill="none" aria-hidden>
          <rect x="14" y="10" width="12" height="20" rx="1.5" stroke={stroke} strokeWidth="1.2" />
          <rect
            x="14"
            y="10"
            width="12"
            height="20"
            rx="1.5"
            stroke={stroke}
            strokeWidth="1.2"
            transform="rotate(90 20 20)"
          />
        </svg>
      )
    default:
      return null
  }
}

export function SpreadSelector({
  selectedId,
  onSelect,
  disabled,
}: SpreadSelectorProps) {
  return (
    <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:gap-6">
      {SPREADS.map((s, i) => {
        const active = selectedId === s.id
        return (
          <motion.button
            key={s.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(s.id)}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            whileHover={disabled ? undefined : { scale: 1.015 }}
            whileTap={disabled ? undefined : { scale: 0.995 }}
            className={`flex min-h-[11rem] flex-col rounded-2xl border px-5 py-5 text-left transition-colors sm:min-h-[12rem] sm:px-6 sm:py-6 ${
              active
                ? 'border-[#d4af37] bg-[#d4af37]/12 shadow-[0_0_32px_rgba(212,175,55,0.14)]'
                : 'border-[#f5f0e6]/18 bg-[#0a0a1a]/55 hover:border-[#7c3aed]/40'
            } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
          >
            <div className="flex items-start gap-3">
              <SpreadGlyph id={s.id} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-display text-xl font-semibold text-[#d4af37] sm:text-2xl">
                    {s.shortTitle}
                  </span>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {s.id === 'three' && (
                      <span className="rounded-md border border-[#d4af37]/40 bg-[#d4af37]/10 px-2 py-0.5 font-display text-[10px] font-semibold uppercase tracking-wider text-[#d4af37] sm:text-xs">
                        Phổ biến
                      </span>
                    )}
                    <span className="rounded-md border border-[#f5f0e6]/15 bg-[#0a0a1a]/40 px-2 py-0.5 font-body text-sm text-[#f5f0e6]/55">
                      {s.cardCount} lá
                    </span>
                  </div>
                </div>
                <h3 className="mt-2 font-display text-lg font-semibold leading-snug text-[#f5f0e6] sm:text-xl">
                  {s.title}
                </h3>
                <p className="mt-3 font-body text-base leading-relaxed text-[#f5f0e6]/72">
                  {s.description}
                </p>
              </div>
            </div>
          </motion.button>
        )
      })}
    </div>
  )
}
