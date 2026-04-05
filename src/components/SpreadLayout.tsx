import { CardReveal } from './CardReveal'
import type { SpreadDefinition } from '../data/spreads'
import type { DrawnCard } from '../types'

interface SpreadLayoutProps {
  spread: SpreadDefinition
  drawn: DrawnCard[]
  faceUp: boolean[]
  interactive: boolean
  onToggleCard: (index: number) => void
}

function Slot({
  label,
  index,
  drawn,
  faceUp,
  interactive,
  onToggleCard,
}: {
  label: string
  index: number
  drawn: DrawnCard
  faceUp: boolean
  interactive: boolean
  onToggleCard: (index: number) => void
}) {
  return (
    <div className="flex flex-col items-center">
      <span className="mb-2 max-w-[160px] text-center font-display text-[11px] uppercase tracking-wider text-[#d4af37]/90 sm:text-xs md:text-sm">
        {label}
      </span>
      <CardReveal
        drawn={drawn}
        faceUp={faceUp}
        interactive={interactive}
        onToggle={() => onToggleCard(index)}
      />
    </div>
  )
}

export function SpreadLayout({
  spread,
  drawn,
  faceUp,
  interactive,
  onToggleCard,
}: SpreadLayoutProps) {
  const d = (i: number) => drawn[i]
  const up = (i: number) => Boolean(faceUp[i])

  if (spread.id === 'one') {
    return (
      <div className="flex justify-center py-8">
        <Slot
          label={spread.positions[0].label}
          index={0}
          drawn={d(0)}
          faceUp={up(0)}
          interactive={interactive}
          onToggleCard={onToggleCard}
        />
      </div>
    )
  }

  if (spread.id === 'three') {
    return (
      <div className="flex flex-wrap justify-center gap-8 py-8 sm:gap-12">
        {[0, 1, 2].map((i) => (
          <Slot
            key={i}
            label={spread.positions[i].label}
            index={i}
            drawn={d(i)}
            faceUp={up(i)}
            interactive={interactive}
            onToggleCard={onToggleCard}
          />
        ))}
      </div>
    )
  }

  if (spread.id === 'five') {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-7 py-8 sm:gap-8">
        <Slot
          label={spread.positions[1].label}
          index={1}
          drawn={d(1)}
          faceUp={up(1)}
          interactive={interactive}
          onToggleCard={onToggleCard}
        />
        <div className="flex flex-wrap items-start justify-center gap-6 sm:gap-10">
          <Slot
            label={spread.positions[2].label}
            index={2}
            drawn={d(2)}
            faceUp={up(2)}
            interactive={interactive}
            onToggleCard={onToggleCard}
          />
          <Slot
            label={spread.positions[0].label}
            index={0}
            drawn={d(0)}
            faceUp={up(0)}
            interactive={interactive}
            onToggleCard={onToggleCard}
          />
          <Slot
            label={spread.positions[3].label}
            index={3}
            drawn={d(3)}
            faceUp={up(3)}
            interactive={interactive}
            onToggleCard={onToggleCard}
          />
        </div>
        <Slot
          label={spread.positions[4].label}
          index={4}
          drawn={d(4)}
          faceUp={up(4)}
          interactive={interactive}
          onToggleCard={onToggleCard}
        />
      </div>
    )
  }

  /* Celtic Cross */
  const cross = (
    <div className="relative mx-auto min-h-[460px] w-[min(94vw,380px)] sm:min-h-[520px] sm:w-[440px]">
      <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
        <Slot
          label={spread.positions[0].label}
          index={0}
          drawn={d(0)}
          faceUp={up(0)}
          interactive={interactive}
          onToggleCard={onToggleCard}
        />
      </div>
      <div className="absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2 sm:scale-95">
        <div className="rotate-90">
          <Slot
            label={spread.positions[1].label}
            index={1}
            drawn={d(1)}
            faceUp={up(1)}
            interactive={interactive}
            onToggleCard={onToggleCard}
          />
        </div>
      </div>
      <div className="absolute left-1/2 top-[78%] z-10 -translate-x-1/2 sm:top-[76%]">
        <Slot
          label={spread.positions[2].label}
          index={2}
          drawn={d(2)}
          faceUp={up(2)}
          interactive={interactive}
          onToggleCard={onToggleCard}
        />
      </div>
      <div className="absolute left-[8%] top-1/2 z-10 -translate-y-1/2 sm:left-[10%]">
        <Slot
          label={spread.positions[3].label}
          index={3}
          drawn={d(3)}
          faceUp={up(3)}
          interactive={interactive}
          onToggleCard={onToggleCard}
        />
      </div>
      <div className="absolute left-1/2 top-[8%] z-10 -translate-x-1/2 sm:top-[10%]">
        <Slot
          label={spread.positions[4].label}
          index={4}
          drawn={d(4)}
          faceUp={up(4)}
          interactive={interactive}
          onToggleCard={onToggleCard}
        />
      </div>
      <div className="absolute right-[2%] top-1/2 z-10 -translate-y-1/2 sm:right-[6%]">
        <Slot
          label={spread.positions[5].label}
          index={5}
          drawn={d(5)}
          faceUp={up(5)}
          interactive={interactive}
          onToggleCard={onToggleCard}
        />
      </div>
    </div>
  )

  const staff = (
    <div className="mx-auto mt-4 grid max-w-xs grid-cols-2 gap-4 sm:grid-cols-1 lg:mt-0 lg:max-w-none">
      {[6, 7, 8, 9].map((i) => (
        <Slot
          key={i}
          label={spread.positions[i].label}
          index={i}
          drawn={d(i)}
          faceUp={up(i)}
          interactive={interactive}
          onToggleCard={onToggleCard}
        />
      ))}
    </div>
  )

  return (
    <div className="py-6">
      <div className="flex flex-col items-stretch gap-10 lg:flex-row lg:justify-center lg:gap-12">
        {cross}
        <div className="flex flex-col justify-start lg:pt-8">{staff}</div>
      </div>
    </div>
  )
}
