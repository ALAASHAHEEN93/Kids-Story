import { useEffect, useRef, useState } from 'react'
import { BookCover } from './components/BookCover'
import { BookSpread } from './components/BookSpread'
import { generateDemoStory } from './storyGenerator'
import type { Story, StoryTheme } from './types'
import './App.css'

const THEME_OPTIONS: { id: StoryTheme; label: string }[] = [
  { id: 'adventure', label: 'Adventure' },
  { id: 'space', label: 'Space' },
  { id: 'ocean', label: 'Ocean' },
  { id: 'magic', label: 'Magic' },
]

/** Hero art from `public/` (works with Vite `base`). */
const LANDING_HERO_SRC = `${import.meta.env.BASE_URL}hero-bedtime-clouds.png`

function createLullabyObjectUrl(): string {
  const sampleRate = 22050
  const durationSec = 3
  const totalSamples = sampleRate * durationSec
  const notes = [261.63, 293.66, 329.63, 392.0, 329.63, 293.66, 246.94, 293.66]
  const samplesPerNote = Math.floor(totalSamples / notes.length)
  const pcm = new Int16Array(totalSamples)

  let idx = 0
  for (let n = 0; n < notes.length; n++) {
    const f = notes[n]
    for (let i = 0; i < samplesPerNote && idx < totalSamples; i++, idx++) {
      const t = i / sampleRate
      const phase = 2 * Math.PI * f * t
      const envIn = Math.min(1, i / (sampleRate * 0.05))
      const envOut = Math.min(1, (samplesPerNote - i) / (sampleRate * 0.08))
      const env = Math.max(0, Math.min(envIn, envOut))
      const sample = (0.42 * Math.sin(phase) + 0.18 * Math.sin(phase * 2)) * env * 0.22
      pcm[idx] = Math.max(-1, Math.min(1, sample)) * 0x7fff
    }
  }

  const byteRate = sampleRate * 2
  const blockAlign = 2
  const dataSize = pcm.length * 2
  const buffer = new ArrayBuffer(44 + dataSize)
  const view = new DataView(buffer)

  const writeStr = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i))
  }

  writeStr(0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeStr(8, 'WAVE')
  writeStr(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, byteRate, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, 16, true)
  writeStr(36, 'data')
  view.setUint32(40, dataSize, true)

  let offset = 44
  for (let i = 0; i < pcm.length; i++, offset += 2) {
    view.setInt16(offset, pcm[i], true)
  }

  return URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }))
}

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
            width={1024}
            height={979}
            alt="A child reading on a giant book under moonlit clouds and stars"
            decoding="async"
          />
        </div>
      </div>
    </div>
  )
}

type Phase = 'landing' | 'cover' | 'reading'
type SavedStory = {
  id: string
  savedAt: number
  story: Story
}

const STORY_LIBRARY_KEY = 'kids-story.library.v1'

export default function App() {
  const [story, setStory] = useState<Story | null>(null)
  const [readIndex, setReadIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>('landing')
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [name, setName] = useState('Finn')
  const [theme, setTheme] = useState<StoryTheme>('magic')
  const [musicOn, setMusicOn] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [speechRate, setSpeechRate] = useState(0.92)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [voiceURI, setVoiceURI] = useState('')
  const [savedStories, setSavedStories] = useState<SavedStory[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const musicUrlRef = useRef<string | null>(null)

  const pageCount = story?.pages.length ?? 0
  const spreadCount = Math.ceil(pageCount / 2)
  const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

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

  const saveCurrentStory = () => {
    if (!story) return
    const item: SavedStory = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      savedAt: Date.now(),
      story,
    }
    setSavedStories((prev) => [item, ...prev].slice(0, 50))
  }

  const loadSavedStory = (id: string) => {
    const found = savedStories.find((s) => s.id === id)
    if (!found) return
    setStory(found.story)
    setReadIndex(0)
    setPhase('cover')
    stopSpeaking()
  }

  const exportStoryToPrint = () => {
    if (!story) return
    const win = window.open('', '_blank', 'noopener,noreferrer')
    if (!win) return
    const body = `
      <html>
        <head>
          <title>${story.cover.title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 24px; color: #1a3047; }
            h1 { margin: 0 0 8px; font-size: 28px; }
            h2 { margin: 0 0 24px; font-size: 18px; color: #4b5b6b; }
            .page { break-inside: avoid; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 1px solid #ddd; }
            .page img { width: 280px; max-width: 100%; border-radius: 10px; display: block; margin-bottom: 8px; }
            .page-title { font-weight: 700; margin: 0 0 6px; }
            p { line-height: 1.5; margin: 0; }
            @media print { body { margin: 12mm; } }
          </style>
        </head>
        <body>
          <h1>${story.cover.title}</h1>
          <h2>${story.cover.subtitle}</h2>
          ${story.pages
            .map(
              (p, i) => `
                <section class="page">
                  <div class="page-title">Page ${i + 1}</div>
                  <img src="${p.image}" alt="${p.imageAlt}" />
                  <p>${p.text}</p>
                </section>
              `,
            )
            .join('')}
        </body>
      </html>
    `
    win.document.write(body)
    win.document.close()
    win.focus()
    setTimeout(() => win.print(), 250)
  }

  const stopSpeaking = () => {
    if (!speechSupported) return
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
  }

  const textToRead =
    phase === 'cover' && story
      ? `${story.cover.title}. ${story.cover.subtitle}.`
      : phase === 'reading' && story
        ? story.pages.map((p, i) => `Page ${i + 1}. ${p.text}`).join(' ')
        : ''

  const speakCurrentText = () => {
    if (!speechSupported || !textToRead.trim()) return
    stopSpeaking()
    const utterance = new SpeechSynthesisUtterance(textToRead)
    utterance.rate = speechRate
    utterance.pitch = 1.02
    utterance.lang = 'en-US'
    if (voiceURI) {
      const chosen = voices.find((v) => v.voiceURI === voiceURI)
      if (chosen) utterance.voice = chosen
    }
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }

  const stopMusic = () => {
    if (!audioRef.current) return
    audioRef.current.pause()
    audioRef.current.currentTime = 0
  }

  const startMusic = async (): Promise<boolean> => {
    if (!audioRef.current) return false
    try {
      await audioRef.current.play()
      return true
    } catch {
      return false
    }
  }

  const toggleMusic = async () => {
    if (musicOn) {
      stopMusic()
      setMusicOn(false)
      return
    }
    const ok = await startMusic()
    setMusicOn(ok)
  }

  useEffect(() => {
    if (!audioRef.current) {
      musicUrlRef.current = createLullabyObjectUrl()
      const el = new Audio(musicUrlRef.current)
      el.loop = true
      el.volume = 0.45
      el.preload = 'auto'
      audioRef.current = el
    }

    return () => {
      stopMusic()
      stopSpeaking()
      if (musicUrlRef.current) {
        URL.revokeObjectURL(musicUrlRef.current)
        musicUrlRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORY_LIBRARY_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as SavedStory[]
      if (Array.isArray(parsed)) setSavedStories(parsed)
    } catch {
      // Ignore malformed local storage payloads.
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(STORY_LIBRARY_KEY, JSON.stringify(savedStories))
  }, [savedStories])

  useEffect(() => {
    if (!speechSupported) return
    const syncVoices = () => {
      const vs = window.speechSynthesis.getVoices()
      setVoices(vs)
      if (!voiceURI && vs.length > 0) {
        const preferred = vs.find((v) => /en-US/i.test(v.lang)) ?? vs[0]
        setVoiceURI(preferred.voiceURI)
      }
    }
    syncVoices()
    window.speechSynthesis.addEventListener('voiceschanged', syncVoices)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', syncVoices)
  }, [speechSupported, voiceURI])

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
          {story ? (
            <>
              <button type="button" className="mediaBtn" onClick={saveCurrentStory}>
                Save Story
              </button>
              <button type="button" className="mediaBtn" onClick={exportStoryToPrint}>
                Export / Print
              </button>
            </>
          ) : null}
          {savedStories.length > 0 ? (
            <label className="mediaSelectWrap">
              <span>My Stories</span>
              <select
                className="mediaSelect"
                defaultValue=""
                onChange={(e) => {
                  if (!e.target.value) return
                  loadSavedStory(e.target.value)
                  e.target.value = ''
                }}
              >
                <option value="">Open saved...</option>
                {savedStories.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.story.cover.title} - {new Date(s.savedAt).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <button type="button" className="mediaBtn" onClick={toggleMusic}>
            {musicOn ? 'Music Off' : 'Music On'}
          </button>
          {speechSupported ? (
            <label className="mediaSelectWrap">
              <span>Voice</span>
              <select
                className="mediaSelect"
                value={voiceURI}
                onChange={(e) => setVoiceURI(e.target.value)}
              >
                {voices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {speechSupported ? (
            <label className="mediaSelectWrap mediaSelectWrap--rate">
              <span>Speed {speechRate.toFixed(2)}x</span>
              <input
                className="mediaRange"
                type="range"
                min="0.7"
                max="1.2"
                step="0.01"
                value={speechRate}
                onChange={(e) => setSpeechRate(Number(e.target.value))}
              />
            </label>
          ) : null}
          {speechSupported && textToRead ? (
            <button
              type="button"
              className="mediaBtn mediaBtn--read"
              onClick={() => (isSpeaking ? stopSpeaking() : speakCurrentText())}
            >
              {isSpeaking ? 'Stop Reading' : phase === 'reading' ? 'Read Full Story' : 'Read Aloud'}
            </button>
          ) : null}
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
