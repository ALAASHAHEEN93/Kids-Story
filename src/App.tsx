import { useRef, useState } from 'react'
import { BookCover } from './components/BookCover'
import { BookSpread } from './components/BookSpread'
import { generateDemoStory } from './storyGenerator'
import type { Story, StoryTheme } from './types'
import { APP_BRAND } from './brand'
import './App.css'

const THEME_OPTIONS: { id: StoryTheme; label: string }[] = [
  { id: 'adventure', label: 'Adventure' },
  { id: 'space', label: 'Space' },
  { id: 'ocean', label: 'Ocean' },
  { id: 'magic', label: 'Magic' },
]

/** Hero art from `public/` (works with Vite `base`). */
const LANDING_HERO_SRC = `${import.meta.env.BASE_URL}hero-magic-book.png`

const BRAND_MARK_SRC = `${import.meta.env.BASE_URL}favicon.svg`

function SparklesIcon() {
  return (
    <svg className="btnSparkle" width="22" height="22" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M12 2l1.09 4.26L17 7l-3.91 1.74L12 13l-1.09-4.26L7 7l3.91-1.74L12 2zm7 9l.77 2.98L22 14l-2.23.02L19 17l-.77-2.98L16 14l2.23-.02L19 11zm-2 7l.64 2.47L20 21l-1.86.02L18 23l-.64-2.47L14 21l1.86-.02L17 18zM5 11l.82 3.18L9 15l-3.18.82L5 19l-.82-3.18L1 15l3.18-.82L5 11z"
      />
    </svg>
  )
}

function LandingHero({ onGenerate }: { onGenerate: () => void }) {
  return (
    <div className="landingHero">
      <div className="landingHero__bokeh" aria-hidden />
      <div className="landingHero__inner">
        <div className="landingHero__content">
          <div className="landingHero__logoCard">
            <div className="landingHero__brandRow">
              <img
                className="landingHero__mark"
                src={BRAND_MARK_SRC}
                width={52}
                height={52}
                alt=""
                decoding="async"
              />
              <p className="landingHero__wordmark">{APP_BRAND}</p>
            </div>
          </div>
          <h1 className="landingHero__headline">
            <span className="landingHero__headlineLead">Crafting magical stories</span>{' '}
            <span className="landingHero__headlineTail">for children</span>
          </h1>
          <p className="landingHero__subtitle">
            A cozy storybook for kids—create a tale, choose a world, and read it together.
          </p>
          <button type="button" className="landingHero__cta" onClick={onGenerate}>
            <SparklesIcon />
            Generate a story
          </button>
        </div>
        <div className="landingHero__artCol">
          <img
            className="landingHero__art"
            src={LANDING_HERO_SRC}
            width={800}
            height={487}
            alt="Children and animals gathered around a glowing open storybook in an enchanted forest arch"
            decoding="async"
          />
        </div>
      </div>
    </div>
  )
}

type Phase = 'landing' | 'cover' | 'reading'

export default function App() {
  const [story, setStory] = useState<Story | null>(null)
  const [readIndex, setReadIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>('landing')
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [name, setName] = useState('Finn')
  const [theme, setTheme] = useState<StoryTheme>('magic')

  const pageCount = story?.pages.length ?? 0
  const spreadCount = Math.ceil(pageCount / 2)

  const openGenerator = () => dialogRef.current?.showModal()
  const closeGenerator = () => dialogRef.current?.close()

  const applyNewStory = () => {
    const next = generateDemoStory(name, theme)
    setStory(next)
    setReadIndex(0)
    setPhase('cover')
    closeGenerator()
  }

  const openBook = () => {
    setPhase('reading')
  }

  const appClass =
    phase === 'landing'
      ? 'app app--landing'
      : phase === 'cover'
        ? 'app app--coverSoft'
        : 'app'

  return (
    <div className={appClass}>
      {phase !== 'landing' ? (
        <div className="storyToolbar">
          <button type="button" className="generateBtn" onClick={openGenerator}>
            <SparklesIcon />
            New story
          </button>
        </div>
      ) : null}

      <main className="appMain">
        {phase === 'landing' ? (
          <LandingHero onGenerate={openGenerator} />
        ) : null}
        {phase === 'cover' && story ? (
          <BookCover key={story.cover.title} cover={story.cover} onOpen={openBook} />
        ) : null}
        {phase === 'reading' && story ? (
          <div className="readingWrap">
            <BookSpread
              pages={story.pages}
              readIndex={readIndex}
              pageCount={pageCount}
              spreadCount={spreadCount}
              onReadIndexChange={setReadIndex}
            />
          </div>
        ) : null}
      </main>

      <dialog ref={dialogRef} className="storyDialog">
        <form
          method="dialog"
          className="storyDialog__form"
          onSubmit={(e) => {
            e.preventDefault()
            applyNewStory()
          }}
        >
          <h2 className="storyDialog__title">Create your story</h2>
          <p className="storyDialog__lede">Name your hero and pick a theme—we&apos;ll open the book cover next.</p>
          <label className="field">
            <span className="field__label">Hero name</span>
            <input
              className="field__input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={32}
              placeholder="e.g. Finn"
              autoComplete="off"
            />
          </label>
          <fieldset className="field field--themes">
            <legend className="field__label">Theme</legend>
            <div className="themeGrid">
              {THEME_OPTIONS.map((opt) => (
                <label key={opt.id} className="themeChip">
                  <input
                    type="radio"
                    name="theme"
                    value={opt.id}
                    checked={theme === opt.id}
                    onChange={() => setTheme(opt.id)}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <p className="storyDialog__hint">
            Demo stories for now—plug in your AI when you&apos;re ready.
          </p>
          <div className="storyDialog__actions">
            <button type="button" className="btnGhost" onClick={closeGenerator}>
              Cancel
            </button>
            <button type="submit" className="btnPrimary">
              See the cover
            </button>
          </div>
        </form>
      </dialog>
    </div>
  )
}
