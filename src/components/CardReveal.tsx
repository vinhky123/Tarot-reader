import { motion } from 'framer-motion'
import { useState } from 'react'
import { localCardSrc, remoteCardSrc } from '../data/cardImages'
import type { DrawnCard } from '../types'

/** Hai biến thể lưng — chỉ hình, không chữ; ngược = họa tiết lật trục. */
function CardBack({ reversed }: { reversed: boolean }) {
  return (
    <div
      className={`relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-lg border-2 shadow-[inset_0_0_24px_rgba(212,175,55,0.12)] ${
        reversed
          ? 'border-[#7c3aed]/45 bg-gradient-to-t from-[#1a0a2e] via-[#0f172a] to-[#12081f]'
          : 'border-[#d4af37]/40 bg-gradient-to-b from-[#1a0a2e] via-[#0f172a] to-[#12081f]'
      }`}
    >
      <div
        className="absolute inset-2 rounded-md border border-[#d4af37]/20"
        style={{
          backgroundImage: reversed
            ? `repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 4px,
            rgba(124,58,237,0.09) 4px,
            rgba(124,58,237,0.09) 8px
          )`
            : `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 4px,
            rgba(212,175,55,0.07) 4px,
            rgba(212,175,55,0.07) 8px
          )`,
        }}
      />
      <div className="relative z-[1] flex flex-col items-center">
        <span
          className={`inline-block font-display text-2xl transition-transform duration-300 sm:text-3xl ${
            reversed ? 'rotate-180 text-[#a78bfa]/95' : 'text-[#d4af37]/90'
          }`}
        >
          ☽
        </span>
        <span
          className={`mt-1 font-display text-[0.5rem] tracking-[0.4em] ${
            reversed ? 'text-[#a78bfa]/55' : 'text-[#d4af37]/65'
          }`}
        >
          MYSTIC
        </span>
      </div>
      {/* Vệt ánh sáng — vị trí khác nhau cho xuôi / ngược */}
      <div
        className={`pointer-events-none absolute h-[42%] w-[3px] rounded-full opacity-50 blur-[1px] ${
          reversed
            ? 'bottom-3 left-1/2 -translate-x-1/2 bg-gradient-to-t from-[#a78bfa]/80 to-transparent'
            : 'left-1/2 top-3 -translate-x-1/2 bg-gradient-to-b from-[#d4af37]/75 to-transparent'
        }`}
        aria-hidden
      />
    </div>
  )
}

interface CardRevealProps {
  drawn: DrawnCard
  faceUp: boolean
  interactive: boolean
  onToggle?: () => void
  className?: string
}

export function CardReveal({
  drawn,
  faceUp,
  interactive,
  onToggle,
  className = '',
}: CardRevealProps) {
  const [src, setSrc] = useState(() => localCardSrc(drawn.card.id))
  const remote = remoteCardSrc(drawn.card.id)

  const canToggle = Boolean(interactive && onToggle)

  const inner = (
    <motion.div
      className="relative mx-auto aspect-[2/3.45] w-[112px] sm:w-[128px] md:w-[148px]"
      style={{ transformStyle: 'preserve-3d' }}
      initial={false}
      animate={{
        rotateY: faceUp ? 180 : 0,
        scale: faceUp ? 1 : 0.98,
      }}
      transition={{
        type: 'spring',
        stiffness: 76,
        damping: 15,
      }}
    >
      <div
        className="card-face absolute inset-0 overflow-hidden rounded-lg border-2 border-[#d4af37]/40 shadow-[0_0_22px_rgba(124,58,237,0.2)]"
        style={{
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
        }}
      >
        <CardBack reversed={drawn.reversed} />
      </div>
      <div
        className="card-face absolute inset-0 overflow-hidden rounded-lg border-2 border-[#d4af37]/35 shadow-[0_0_24px_rgba(212,175,55,0.15)]"
        style={{
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
        }}
      >
        <img
          src={src}
          alt=""
          className={`h-full w-full object-cover ${drawn.reversed ? 'rotate-180' : ''}`}
          onError={() => setSrc(remote)}
        />
      </div>
    </motion.div>
  )

  return (
    <div className={`perspective-1000 ${className}`}>
      {canToggle ? (
        <button
          type="button"
          onClick={onToggle}
          className="block cursor-pointer rounded-xl border-0 bg-transparent p-0 text-left outline-none ring-[#7c3aed]/40 focus-visible:ring-2"
          aria-pressed={faceUp}
          aria-label={faceUp ? 'Úp lá bài' : 'Lật lá bài'}
        >
          {inner}
        </button>
      ) : (
        inner
      )}
    </div>
  )
}
