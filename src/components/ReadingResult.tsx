import { motion } from 'framer-motion'
import { MysticMarkdown } from './MysticMarkdown'

interface ReadingResultProps {
  text: string | null
  /** When true, the article is being streamed — render with reduced motion + aria-busy. */
  streaming?: boolean
}

export function ReadingResult({ text, streaming = false }: ReadingResultProps) {
  if (!text?.trim()) return null
  return (
    <motion.article
      id="mystic-reading-result"
      className="mx-auto mt-8 w-full max-w-5xl rounded-2xl border border-[#d4af37]/20 bg-[#0a0a1a]/65 p-6 shadow-[0_0_40px_rgba(124,58,237,0.08)] backdrop-blur-md sm:p-10"
      initial={streaming ? false : { opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={streaming ? { duration: 0 } : { type: 'spring', stiffness: 120, damping: 18 }}
      aria-busy={streaming || undefined}
      aria-live="polite"
    >
      <h2 className="mystic-gradient-heading mb-4 block font-display text-2xl font-semibold sm:text-3xl">
        Lời giải
        {streaming && (
          <span className="ml-3 align-middle font-body text-sm font-normal tracking-normal text-[#d4af37]/70">
            đang viết…
          </span>
        )}
      </h2>
      <div className="reading-markdown border-t border-[#f5f0e6]/10 pt-6">
        <MysticMarkdown content={text} variant="article" />
        {streaming && (
          <span
            className="ml-0.5 inline-block h-[1.1em] w-[2px] translate-y-[0.15em] animate-pulse bg-[#d4af37]/80"
            aria-hidden
          />
        )}
      </div>
    </motion.article>
  )
}
