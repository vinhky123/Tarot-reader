import { motion } from 'framer-motion'

export function Navbar() {
  return (
    <header className="relative z-20 border-b border-[#d4af37]/20 bg-[#0a0a1a]/55 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-2 px-5 py-5 sm:flex-row sm:justify-between sm:px-8 sm:py-5 lg:px-12">
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span
            className="font-display text-xl font-semibold tracking-[0.2em] text-[#d4af37] sm:text-2xl"
            aria-hidden
          >
            ✦
          </span>
          <div className="text-left">
            <h1 className="font-display text-2xl font-semibold tracking-wide text-[#f5f0e6] sm:text-3xl">
              Mystic Tarot
            </h1>
            <p className="font-body text-base text-[#f5f0e6]/68">
              Rider-Waite · Oracle Gemini
            </p>
          </div>
        </motion.div>
        <motion.div
          className="max-w-md text-center font-body text-sm text-[#d4af37]/85 sm:text-right sm:text-base"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Bộ bài công cộng (Wikimedia Commons)
        </motion.div>
      </div>
    </header>
  )
}
