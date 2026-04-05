import { motion } from 'framer-motion'

/** Hình trang trí tĩnh + chuyển động nhẹ — gợi nhân vật oracle. */
export function OracleGlyph() {
  return (
    <motion.div
      className="pointer-events-none select-none opacity-40"
      aria-hidden
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.35 }}
      transition={{ duration: 1.2 }}
    >
      <svg
        width="120"
        height="160"
        viewBox="0 0 120 160"
        className="mx-auto text-[#7c3aed]"
      >
        <defs>
          <linearGradient id="og" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d4af37" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.7" />
          </linearGradient>
        </defs>
        <motion.path
          fill="none"
          stroke="url(#og)"
          strokeWidth="1.2"
          d="M60 8 L60 44 M42 28 L78 28 M60 44 Q36 52 32 78 Q28 104 48 124 Q60 138 72 124 Q92 104 88 78 Q84 52 60 44"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2.5, ease: 'easeInOut' }}
        />
        <motion.circle
          cx="60"
          cy="22"
          r="10"
          fill="none"
          stroke="#06b6d4"
          strokeWidth="0.8"
          opacity="0.7"
          animate={{ scale: [1, 1.06, 1], opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <motion.path
          fill="none"
          stroke="#d4af37"
          strokeWidth="0.6"
          opacity="0.5"
          d="M20 140 L100 140 M38 148 L82 148"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2.2, repeat: Infinity }}
        />
      </svg>
    </motion.div>
  )
}
