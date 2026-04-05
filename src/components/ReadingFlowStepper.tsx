import { motion } from 'framer-motion'
import type { ReadingStep } from '../types'

interface ReadingFlowStepperProps {
  step: ReadingStep
  allCardsFaceUp: boolean
}

const steps = [
  { key: 'draw', label: 'Rút bài' },
  { key: 'flip', label: 'Lật bài' },
  { key: 'read', label: 'Lời giải' },
  { key: 'chat', label: 'Hỏi thêm' },
] as const

export function ReadingFlowStepper({
  step,
  allCardsFaceUp,
}: ReadingFlowStepperProps) {
  const flipDone =
    allCardsFaceUp || step === 'reading' || step === 'done'
  const readDone = step === 'done'

  const doneAt = (i: number) => {
    if (i === 0) return true
    if (i === 1) return flipDone
    if (i === 2) return readDone
    return false
  }

  let activeIndex = 0
  if (step === 'placed' && !allCardsFaceUp) activeIndex = 1
  else if (step === 'placed' && allCardsFaceUp) activeIndex = 2
  else if (step === 'reading') activeIndex = 2
  else if (step === 'done') activeIndex = 3

  return (
    <nav
      className="mb-8 flex flex-wrap items-center justify-center gap-2 sm:gap-4"
      aria-label="Tiến trình trải bài"
    >
      {steps.map((s, i) => {
        const done = doneAt(i)
        const active = i === activeIndex
        return (
          <div key={s.key} className="flex items-center gap-2 sm:gap-4">
            {i > 0 && (
              <span
                className={`hidden h-px w-6 sm:block sm:w-10 ${
                  doneAt(i - 1) ? 'bg-[#d4af37]/45' : 'bg-[#f5f0e6]/12'
                }`}
                aria-hidden
              />
            )}
            <motion.div
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 sm:px-4 sm:py-2 ${
                active
                  ? 'border-[#d4af37]/70 bg-[#d4af37]/10 shadow-[0_0_20px_rgba(212,175,55,0.12)]'
                  : done
                    ? 'border-[#f5f0e6]/15 bg-[#0a0a1a]/40 text-[#f5f0e6]/55'
                    : 'border-[#f5f0e6]/10 bg-transparent text-[#f5f0e6]/38'
              }`}
              animate={active ? { scale: [1, 1.02, 1] } : { scale: 1 }}
              transition={
                active
                  ? { duration: 2.2, repeat: Infinity, ease: 'easeInOut' }
                  : {}
              }
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  done && !active
                    ? 'bg-[#d4af37]/25 text-[#d4af37]'
                    : active
                      ? 'bg-[#7c3aed]/35 text-[#f5f0e6]'
                      : 'bg-[#f5f0e6]/8 text-[#f5f0e6]/45'
                }`}
              >
                {done && !active ? '✓' : i + 1}
              </span>
              <span
                className={`font-display text-xs tracking-wide sm:text-sm ${
                  active ? 'text-[#f5f0e6]' : 'text-[#f5f0e6]/65'
                }`}
              >
                {s.label}
              </span>
            </motion.div>
          </div>
        )
      })}
    </nav>
  )
}
