import { motion } from 'framer-motion'

export function LoadingOracle() {
  return (
    <div
      className="mx-auto flex max-w-md flex-col items-center gap-6 rounded-2xl border border-[#7c3aed]/30 bg-[#0a0a1a]/70 px-8 py-10 backdrop-blur-md"
      role="status"
      aria-live="polite"
    >
      <div className="relative h-24 w-24">
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-[#d4af37]/40"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute inset-2 rounded-full border border-[#06b6d4]/50"
          animate={{ rotate: -360 }}
          transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute inset-0 flex items-center justify-center font-display text-3xl text-[#d4af37]"
          animate={{ scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          ☾
        </motion.div>
      </div>
      <p className="text-center font-display text-base tracking-[0.2em] text-[#d4af37] sm:text-lg">
        Đang hỏi Oracle…
      </p>
      <p className="text-center font-body text-base text-[#f5f0e6]/65 sm:text-lg">
        Gemini đang dệt lời giải từ các lá bạn đã rút.
      </p>
    </div>
  )
}
