import { motion, AnimatePresence } from 'framer-motion'
import { Footer } from './components/Layout/Footer'
import { MysticBackground } from './components/Layout/MysticBackground'
import { Navbar } from './components/Layout/Navbar'
import { LoadingOracle } from './components/LoadingOracle'
import { OracleGlyph } from './components/OracleGlyph'
import { ReaderChat } from './components/ReaderChat'
import { ReadingResult } from './components/ReadingResult'
import { SpreadLayout } from './components/SpreadLayout'
import { SpreadSelector } from './components/SpreadSelector'
import { TarotDeck } from './components/TarotDeck'
import { useReading } from './hooks/useReading'

const btnPrimary =
  'rounded-xl border-2 border-[#d4af37]/70 bg-[#1a0a2e] px-8 py-4 font-display text-base font-semibold tracking-wide text-[#f5f0e6] shadow-[0_0_28px_rgba(212,175,55,0.12)] transition hover:border-[#d4af37] hover:bg-[#d4af37]/15 hover:text-[#fff8e8] disabled:cursor-not-allowed disabled:opacity-40'

const btnGhost =
  'rounded-xl border border-[#f5f0e6]/25 px-6 py-3 font-body text-base text-[#f5f0e6]/85 transition hover:border-[#7c3aed]/45 hover:bg-[#f5f0e6]/5 hover:text-[#f5f0e6]'

export default function App() {
  const r = useReading()
  const busy =
    r.step === 'shuffle' || r.step === 'reading' || r.step === 'placed'
  const showBoard =
    r.drawn &&
    r.spread &&
    (r.step === 'placed' || r.step === 'reading' || r.step === 'done')
  const allCardsFaceUp =
    Boolean(r.drawn?.length) &&
    r.cardFaceUp.length === r.drawn!.length &&
    r.cardFaceUp.every(Boolean)
  const cardsInteractive = r.step === 'placed'

  return (
    <>
      <MysticBackground />
      {/* Trang trí góc — không chiếm chỗ trong cột nội dung */}
      {!busy && r.step === 'spread' && (
        <div
          className="pointer-events-none fixed bottom-8 right-4 z-[5] hidden opacity-[0.22] xl:block 2xl:right-10"
          aria-hidden
        >
          <OracleGlyph />
        </div>
      )}
      <div className="relative z-10 flex min-h-svh flex-col">
        <Navbar />
        <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-10">
          <div className="w-full">
            <AnimatePresence mode="wait">
              {r.step === 'spread' && (
                <motion.section
                  key="pick"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                >
                  <div className="mx-auto w-full max-w-5xl">
                    <div className="text-center">
                      <h2 className="font-display text-3xl font-semibold tracking-tight text-[#f5f0e6] sm:text-4xl">
                        Chọn kiểu trải bài
                      </h2>
                      <p className="mx-auto mt-2 max-w-3xl font-body text-base leading-relaxed text-[#f5f0e6]/70 sm:text-lg">
                        Rider-Waite 1909 (ảnh Wikimedia Commons). Mỗi lần rút là
                        ngẫu nhiên; lá có thể xuôi hoặc ngược.
                      </p>
                    </div>

                    <label className="mt-5 block w-full sm:mt-6">
                      <span className="mb-1.5 block text-center font-display text-base font-medium text-[#d4af37]">
                        Câu hỏi hoặc bối cảnh (tùy chọn)
                      </span>
                      <textarea
                        value={r.userQuestion}
                        onChange={(e) => r.setUserQuestion(e.target.value)}
                        rows={3}
                        placeholder="Ví dụ: Mình nên thay đổi gì trong công việc thời gian tới?"
                        className="min-h-[5.5rem] w-full resize-y rounded-xl border border-[#f5f0e6]/20 bg-[#0a0a1a]/60 px-4 py-3.5 font-body text-base leading-relaxed text-[#f5f0e6] placeholder:text-[#f5f0e6]/38 focus:border-[#7c3aed]/55 focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/25 sm:px-5 sm:py-4 sm:text-[1.05rem]"
                      />
                    </label>

                    <div className="mt-5 sm:mt-6">
                      <SpreadSelector
                        selectedId={r.spreadId}
                        onSelect={r.selectSpread}
                        disabled={false}
                      />
                    </div>

                    <div className="mt-5 flex flex-wrap justify-center gap-4 pt-1 sm:mt-6">
                      <button
                        type="button"
                        className={btnPrimary}
                        disabled={!r.spreadId}
                        onClick={r.startShuffleAndDraw}
                      >
                        Xáo và rút bài
                      </button>
                    </div>
                  </div>
                </motion.section>
              )}
            </AnimatePresence>

            {r.step === 'shuffle' && (
              <section className="w-full py-4">
                <TarotDeck active onComplete={r.finishShuffle} />
              </section>
            )}

            {showBoard && r.drawn && r.spread && (
              <section className="mx-auto w-full max-w-6xl space-y-6 sm:space-y-8 lg:max-w-7xl">
                <SpreadLayout
                  spread={r.spread}
                  drawn={r.drawn}
                  faceUp={r.cardFaceUp}
                  interactive={cardsInteractive}
                  onToggleCard={r.toggleCardFace}
                />

                <div className="flex flex-wrap justify-center gap-4 sm:gap-5">
                  {r.step === 'placed' && !allCardsFaceUp && (
                    <button
                      type="button"
                      className={btnPrimary}
                      onClick={r.flipAllCards}
                    >
                      Lật hết
                    </button>
                  )}
                  {r.step === 'placed' && allCardsFaceUp && (
                    <button
                      type="button"
                      className={btnPrimary}
                      onClick={() => void r.runReading()}
                    >
                      Nhận lời giải từ Oracle
                    </button>
                  )}
                  <button
                    type="button"
                    className={btnGhost}
                    onClick={r.resetAll}
                  >
                    Trải bài mới
                  </button>
                </div>

                {r.step === 'reading' && (
                  <div className="flex justify-center py-6">
                    <LoadingOracle />
                  </div>
                )}

                {r.error && (
                  <div
                    className="whitespace-pre-line rounded-xl border border-red-400/35 bg-red-950/40 px-4 py-4 text-left font-body text-base leading-relaxed text-red-200/90 sm:px-6"
                    role="alert"
                  >
                    {r.error}
                  </div>
                )}

                <ReadingResult text={r.readingText} />
                <ReaderChat
                  readingText={r.readingText}
                  readerThread={r.readerThread}
                  chatSending={r.chatSending}
                  chatError={r.chatError}
                  onSend={(msg) => void r.sendReaderMessage(msg)}
                />
              </section>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </>
  )
}
