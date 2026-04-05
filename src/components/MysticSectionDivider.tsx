import { motion } from 'framer-motion'

export function MysticSectionDivider() {
  return (
    <motion.div
      className="mx-auto my-8 h-px w-full max-w-lg bg-gradient-to-r from-transparent via-[#d4af37]/45 to-transparent sm:my-10"
      initial={{ opacity: 0, scaleX: 0.85 }}
      animate={{ opacity: 1, scaleX: 1 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      aria-hidden
    />
  )
}
