import { motion } from 'framer-motion'
import { MysticMarkdown } from './MysticMarkdown'

interface ReadingResultProps {
  text: string | null
}

export function ReadingResult({ text }: ReadingResultProps) {
  if (!text?.trim()) return null
  return (
    <motion.article
      id="mystic-reading-result"
      className="mx-auto mt-8 w-full max-w-5xl rounded-2xl border border-[#d4af37]/20 bg-[#0a0a1a]/65 p-6 shadow-[0_0_40px_rgba(124,58,237,0.08)] backdrop-blur-md sm:p-10"
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 120, damping: 18 }}
    >
      <h2 className="mystic-gradient-heading mb-4 block font-display text-2xl font-semibold sm:text-3xl">
        Lời giải
      </h2>
      <div className="reading-markdown border-t border-[#f5f0e6]/10 pt-6">
        <MysticMarkdown content={text} variant="article" />
      </div>
    </motion.article>
  )
}
