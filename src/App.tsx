import { useRef, useState } from 'react'
import { BookCover } from './components/BookCover'
import { BookSpread } from './components/BookSpread'
import { defaultStory, generateDemoStory } from './storyGenerator'
import type { Story, StoryTheme } from './types'
import './App.css'

const THEME_OPTIONS: { id: StoryTheme; label: string }[] = [
  { id: 'adventure', label: 'Adventure' },
  { id: 'space', label: 'Space' },
  { id: 'ocean', label: 'Ocean' },
  { id: 'magic', label: 'Magic' },
]

function SparklesIcon() {
  return (
    <svg className="btnSparkle" width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M12 2l1.09 4.26L17 7l-3.91 1.74L12 13l-1.09-4.26L7 7l3.91-1.74L12 2zm7 9l.77 2.98L22 14l-2.23.02L19 17l-.77-2.98L16 14l2.23-.02L19 11zm-2 7l.64 2.47L20 21l-1.86.02L18 23l-.64-2.47L14 21l1.86-.02L17 18zM5 11l.82 3.18L9 15l-3.18.82L5 19l-.82-3.18L1 15l3.18-.82L5 11z"
      />
    </svg>
  )
}

type BookView = 'cover' | 'reading'

export default function App() {
  const [story, setStory] = useState<Story>(() => defaultStory())
  const [readIndex, setReadIndex] = useState(0)
  const [bookView, setBookView] = useState<BookView>('cover')
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [name, setName] = useState('Finn')
  const [theme, setTheme] = useState<StoryTheme>('magic')

  const pageCount = story.pages.length
  const spreadCount = Math.ceil(pageCount / 2)

  const openGenerator = () => dialogRef.current?.showModal()
  const closeGenerator = () => dialogRef.current?.close()

  const applyNewStory = () => {
    const next = generateDemoStory(name, theme)
    setStory(next)
    setReadIndex(0)
    setBookView('cover')
    closeGenerator()
  }

  const openBook = () => {
    setBookView('reading')
  }

  return (
    <div className="app">
      <div className="storyToolbar">
        <button type="button" className="generateBtn" onClick={openGenerator}>
          <SparklesIcon />
          Generate New Story
        </button>
      </div>

      <main className="appMain">
        {bookView === 'cover' ? (
          <BookCover key={story.cover.title} cover={story.cover} onOpen={openBook} />
        ) : (
          <div className="readingWrap">
            <BookSpread
              pages={story.pages}
              readIndex={readIndex}
              pageCount={pageCount}
              spreadCount={spreadCount}
              onReadIndexChange={setReadIndex}
            />
          </div>
        )}
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
          <h2 className="storyDialog__title">Create a story</h2>
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
            Stories are demo templates for now—swap in your AI API when you are ready.
          </p>
          <div className="storyDialog__actions">
            <button type="button" className="btnGhost" onClick={closeGenerator}>
              Cancel
            </button>
            <button type="submit" className="btnPrimary">
              Create story
            </button>
          </div>
        </form>
      </dialog>
    </div>
  )
}
