import { MysticMarkdown } from './MysticMarkdown'

interface ReadingResultProps {
  text: string | null
}

export function ReadingResult({ text }: ReadingResultProps) {
  if (!text?.trim()) return null
  return (
    <article className="mx-auto mt-8 w-full max-w-5xl rounded-2xl border border-[#d4af37]/20 bg-[#0a0a1a]/65 p-6 shadow-[0_0_40px_rgba(124,58,237,0.08)] backdrop-blur-md sm:p-10">
      <h2 className="mb-4 font-display text-2xl font-semibold text-[#d4af37] sm:text-3xl">
        Lời giải
      </h2>
      <div className="reading-markdown border-t border-[#f5f0e6]/10 pt-6">
        <MysticMarkdown content={text} variant="article" />
      </div>
    </article>
  )
}
