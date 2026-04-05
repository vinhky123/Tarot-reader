import { motion } from 'framer-motion'
import { SPREADS } from '../data/spreads'

interface SpreadSelectorProps {
  selectedId: string | null
  onSelect: (id: string) => void
  disabled?: boolean
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
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-display text-xl font-semibold text-[#d4af37] sm:text-2xl">
                {s.shortTitle}
              </span>
              <span className="shrink-0 rounded-md border border-[#f5f0e6]/15 bg-[#0a0a1a]/40 px-2 py-0.5 font-body text-sm text-[#f5f0e6]/55">
                {s.cardCount} lá
              </span>
            </div>
            <h3 className="mt-2 font-display text-lg font-semibold leading-snug text-[#f5f0e6] sm:text-xl">
              {s.title}
            </h3>
            <p className="mt-3 flex-1 font-body text-base leading-relaxed text-[#f5f0e6]/72">
              {s.description}
            </p>
          </motion.button>
        )
      })}
    </div>
  )
}
