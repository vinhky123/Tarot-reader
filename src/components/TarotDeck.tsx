import { motion } from 'framer-motion'
import { useEffect } from 'react'

interface TarotDeckProps {
  active: boolean
  onComplete: () => void
}

const stackOffsets = [0, 3, -2, 4, -3, 2, -4]

export function TarotDeck({ active, onComplete }: TarotDeckProps) {
  useEffect(() => {
    if (!active) return
    const t = window.setTimeout(onComplete, 3000)
    return () => window.clearTimeout(t)
  }, [active, onComplete])

  if (!active) return null

  return (
    <div
      className="relative mx-auto flex h-48 items-center justify-center sm:h-56"
      aria-hidden
    >
      {stackOffsets.map((off, i) => (
        <motion.div
          key={i}
          className="absolute h-36 w-[100px] rounded-lg border-2 border-[#d4af37]/45 bg-gradient-to-br from-[#1a0a2e] to-[#0f172a] shadow-lg sm:h-44 sm:w-[118px]"
          initial={{ x: 0, y: 0, rotate: off, scale: 1 - i * 0.02 }}
          animate={{
            x: [0, (i % 2 ? 1 : -1) * 22, 0, (i % 2 ? -1 : 1) * 18, 0],
            y: [0, -10, 4, -6, 0],
            rotate: [off, off + 12, off - 8, off + 6, off],
            scale: [1 - i * 0.02, 1 - i * 0.02 + 0.02, 1 - i * 0.02],
          }}
          transition={{
            duration: 2.8,
            repeat: Infinity,
            repeatType: 'loop',
            ease: 'easeInOut',
            delay: i * 0.08,
          }}
        >
          <div className="flex h-full items-center justify-center font-display text-xl text-[#d4af37]/50">
            ✦
          </div>
        </motion.div>
      ))}
      <motion.p
        className="absolute bottom-0 font-display text-sm tracking-widest text-[#d4af37]/90"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.8, repeat: Infinity }}
      >
        Đang xáo bài…
      </motion.p>
    </div>
  )
}
