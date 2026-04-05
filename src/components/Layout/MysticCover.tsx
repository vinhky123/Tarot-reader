import { motion, useReducedMotion } from 'framer-motion'

const easeOut = [0.22, 1, 0.36, 1] as const

interface MysticCoverProps {
  onEnter: () => void
}

export function MysticCover({ onEnter }: MysticCoverProps) {
  const reduceMotion = useReducedMotion()
  const duration = reduceMotion ? 0.35 : 0.95
  const spinDuration = reduceMotion ? 0 : 28

  return (
    <motion.div
      className="fixed inset-0 z-[50] flex cursor-default flex-col items-center justify-center overflow-hidden px-6"
      role="dialog"
      aria-modal="true"
      aria-label="Trang bìa Mystic Tarot"
      initial={{ opacity: 1 }}
      exit={{
        opacity: 0,
        transition: { duration: duration * 0.92, ease: easeOut },
      }}
      style={{
        background:
          'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(26,10,46,0.92) 0%, rgba(10,10,26,0.97) 50%, #05050d 100%)',
      }}
    >
      {/* Vệt sáng mềm */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background: `radial-gradient(circle at 30% 20%, rgba(124,58,237,0.35) 0%, transparent 42%),
            radial-gradient(circle at 70% 75%, rgba(6,182,212,0.2) 0%, transparent 38%),
            radial-gradient(circle at 50% 100%, rgba(212,175,55,0.12) 0%, transparent 45%)`,
        }}
        aria-hidden
      />

      {/* Vòng xoay chậm */}
      <motion.div
        className="pointer-events-none absolute flex h-[min(88vw,420px)] w-[min(88vw,420px)] items-center justify-center"
        aria-hidden
        animate={reduceMotion ? {} : { rotate: 360 }}
        transition={{ duration: spinDuration, repeat: Infinity, ease: 'linear' }}
      >
        <div className="absolute inset-0 rounded-full border border-[#d4af37]/15" />
        <div className="absolute inset-[8%] rounded-full border border-[#7c3aed]/20" />
        <div className="absolute inset-[18%] rounded-full border border-[#06b6d4]/10" />
      </motion.div>

      <motion.div
        className="relative z-[1] flex max-w-lg flex-col items-center text-center"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0.2 : 0.7, delay: reduceMotion ? 0 : 0.15, ease: easeOut }}
        exit={{
          opacity: 0,
          y: -28,
          scale: 1.06,
          transition: { duration: duration * 0.85, ease: easeOut },
        }}
      >
        {/* Chỉ trang trí — không nhận click */}
        <div className="pointer-events-none flex flex-col items-center text-center">
          <motion.p
            className="font-display text-xs font-medium uppercase tracking-[0.55em] text-[#d4af37]/75 sm:text-sm"
            animate={
              reduceMotion
                ? {}
                : {
                    opacity: [0.65, 1, 0.65],
                    textShadow: [
                      '0 0 20px rgba(212,175,55,0.15)',
                      '0 0 32px rgba(212,175,55,0.35)',
                      '0 0 20px rgba(212,175,55,0.15)',
                    ],
                  }
            }
            transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
          >
            Oracle
          </motion.p>

          <h1 className="mt-4 font-display text-4xl font-semibold tracking-wide sm:text-5xl md:text-6xl">
            <span className="mystic-gradient-heading block bg-[length:120%_auto]">
              Mystic Tarot
            </span>
          </h1>
          <p className="mt-3 font-body text-base text-[#f5f0e6]/55 sm:text-lg">
            Rider-Waite · Gemini
          </p>

          <motion.div
            className="relative mt-10 sm:mt-12"
            animate={reduceMotion ? {} : { y: [0, -6, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
            aria-hidden
          >
            <div className="absolute inset-0 blur-2xl">
              <div className="h-full w-full rounded-full bg-[#d4af37]/20" />
            </div>
            <svg
              width="120"
              height="120"
              viewBox="0 0 120 120"
              className="relative drop-shadow-[0_0_28px_rgba(212,175,55,0.35)]"
            >
              <defs>
                <linearGradient id="cover-moon" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f5f0e6" stopOpacity="0.95" />
                  <stop offset="45%" stopColor="#d4af37" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.7" />
                </linearGradient>
              </defs>
              <path
                fill="url(#cover-moon)"
                d="M 78 18 A 46 46 0 1 0 78 102 A 38 38 0 1 1 78 18 Z"
                opacity="0.95"
              />
            </svg>
          </motion.div>

          <motion.span
            id="mystic-cover-hint"
            className="mt-8 font-display text-sm tracking-[0.2em] text-[#f5f0e6]/45 sm:text-base"
            animate={reduceMotion ? {} : { opacity: [0.4, 0.85, 0.4] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
          >
            Chỉ có thể vào qua nút bên dưới
          </motion.span>
        </div>

        <div className="pointer-events-auto mt-6">
          <button
            type="button"
            onClick={onEnter}
            aria-describedby="mystic-cover-hint"
            className="cursor-pointer rounded-2xl border-2 border-[#d4af37]/50 bg-[#1a0a2e]/80 px-10 py-3.5 font-display text-base font-semibold tracking-wide text-[#f5f0e6] shadow-[0_0_32px_rgba(212,175,55,0.18)] backdrop-blur-sm transition hover:border-[#d4af37] hover:bg-[#d4af37]/12 hover:shadow-[0_0_40px_rgba(212,175,55,0.28)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed]/50 sm:px-12 sm:py-4 sm:text-lg"
          >
            Vào phòng Oracle
          </button>
        </div>
      </motion.div>

      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {[12, 28, 45, 62, 78, 88, 15, 92, 38, 55].map((left, i) => (
          <span
            key={i}
            className="absolute h-1 w-1 rounded-full bg-[#f5f0e6]"
            style={{
              left: `${left}%`,
              top: `${(i * 17 + 7) % 100}%`,
              opacity: 0.15 + (i % 4) * 0.12,
              animation: reduceMotion ? 'none' : `mystic-cover-twinkle ${3 + (i % 3)}s ease-in-out infinite`,
              animationDelay: `${i * 0.4}s`,
            }}
          />
        ))}
      </div>
    </motion.div>
  )
}
