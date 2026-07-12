import { motion } from 'framer-motion'
import type { ReadingMeta, DignityRelation } from '../data/correspondences'

interface ReadingMetaPanelProps {
  meta: ReadingMeta
}

const DIGNITY_COLOR: Record<DignityRelation, string> = {
  strengthened: 'border-[#d4af37]/45 bg-[#d4af37]/8 text-[#d4af37]',
  friendly: 'border-[#06b6d4]/40 bg-[#06b6d4]/8 text-[#06b6d4]',
  hostile: 'border-red-400/40 bg-red-950/30 text-red-200/90',
  neutral: 'border-[#f5f0e6]/20 bg-[#f5f0e6]/5 text-[#f5f0e6]/70',
}

const DIGNITY_LABEL: Record<DignityRelation, string> = {
  strengthened: 'Tăng cường',
  friendly: 'Hỗ trợ',
  hostile: 'Căng thẳng',
  neutral: 'Trung tính',
}

const ELEMENT_LABEL: Record<string, string> = {
  Fire: '🔥 Lửa',
  Water: '💧 Nước',
  Air: '🌬️ Khí',
  Earth: '🌍 Đất',
}

export function ReadingMetaPanel({ meta }: ReadingMetaPanelProps) {
  const s = meta.crossCardSummary
  const elementEntries = (Object.entries(s.elements) as [string, number][]).filter(
    ([, count]) => count > 0,
  )
  const suitEntries = Object.entries(s.suits).filter(([, count]) => count > 0)

  return (
    <motion.section
      className="mx-auto mt-6 w-full max-w-5xl rounded-2xl border border-[#7c3aed]/20 bg-[#0a0a1a]/55 p-5 backdrop-blur-md sm:p-7"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      aria-label="Tổng quan trải bài"
    >
      <h2 className="mystic-gradient-heading mb-4 block font-display text-lg font-semibold sm:text-xl">
        Tổng quan bộ bài
      </h2>

      <div className="grid gap-5 sm:grid-cols-2">
        {/* Left column: dominant card + composition */}
        <div className="space-y-4">
          {meta.dominantCard && (
            <div className="rounded-xl border border-[#d4af37]/30 bg-[#1a0a2e]/40 p-4">
              <p className="font-display text-xs uppercase tracking-wider text-[#d4af37]/80">
                Lá chủ âm
              </p>
              <p className="mt-1 font-display text-base font-semibold text-[#f5f0e6] sm:text-lg">
                {meta.dominantCard.name}
              </p>
              <p className="mt-1 font-body text-sm leading-relaxed text-[#f5f0e6]/70">
                {meta.dominantCard.reason}
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Stat label="Major" value={s.major} />
            <Stat label="Minor" value={s.minor} />
            {s.court > 0 && <Stat label="Court" value={s.court} />}
            <Stat label="Xuôi" value={s.upright} />
            <Stat label="Ngược" value={s.reversed} />
          </div>
        </div>

        {/* Right column: elements + suits + dignities */}
        <div className="space-y-3">
          {elementEntries.length > 0 && (
            <div>
              <p className="mb-1.5 font-display text-xs uppercase tracking-wider text-[#f5f0e6]/60">
                Nguyên tố
              </p>
              <div className="flex flex-wrap gap-2">
                {elementEntries.map(([el, count]) => (
                  <span
                    key={el}
                    className="rounded-lg border border-[#f5f0e6]/15 bg-[#0f172a]/50 px-2.5 py-1 font-body text-sm text-[#f5f0e6]/85"
                  >
                    {ELEMENT_LABEL[el] ?? el} ×{count}
                  </span>
                ))}
              </div>
            </div>
          )}

          {suitEntries.length > 1 && (
            <div>
              <p className="mb-1.5 font-display text-xs uppercase tracking-wider text-[#f5f0e6]/60">
                Bộ
              </p>
              <div className="flex flex-wrap gap-2">
                {suitEntries.map(([suit, count]) => (
                  <span
                    key={suit}
                    className="rounded-lg border border-[#7c3aed]/25 bg-[#0f172a]/50 px-2.5 py-1 font-body text-sm capitalize text-[#f5f0e6]/85"
                  >
                    {suit} ×{count}
                  </span>
                ))}
              </div>
            </div>
          )}

          {meta.dignities.length > 0 && (
            <div>
              <p className="mb-1.5 font-display text-xs uppercase tracking-wider text-[#f5f0e6]/60">
                Tương tác nguyên tố (Dignity)
              </p>
              <div className="flex flex-wrap gap-2">
                {meta.dignities.map((dg, i) => (
                  <span
                    key={`${dg.pair[0]}-${dg.pair[1]}-${i}`}
                    className={`rounded-lg border px-2.5 py-1 font-body text-sm ${DIGNITY_COLOR[dg.relation]}`}
                    title={dg.gloss}
                  >
                    {dg.pair[0]} + {dg.pair[1]} · {DIGNITY_LABEL[dg.relation]}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.section>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#f5f0e6]/12 bg-[#0f172a]/50 px-3 py-1.5 font-body text-sm text-[#f5f0e6]/85">
      <span className="font-semibold text-[#d4af37]">{value}</span>
      <span className="text-[#f5f0e6]/60">{label}</span>
    </span>
  )
}
