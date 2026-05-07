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
  const sampleRate = 44100
  const durationSec = 8
  const totalSamples = sampleRate * durationSec
  const notes = [261.63, 293.66, 329.63, 349.23, 392.0, 349.23, 329.63, 293.66]
  const samplesPerNote = Math.floor(totalSamples / notes.length)
  const pcm = new Int16Array(totalSamples)

  let idx = 0
  let phaseFundamental = 0
  let phaseOctave = 0
  for (let n = 0; n < notes.length; n++) {
    const f = notes[n]
    const fundamentalStep = (2 * Math.PI * f) / sampleRate
    const octaveStep = (2 * Math.PI * (f * 2)) / sampleRate
    for (let i = 0; i < samplesPerNote && idx < totalSamples; i++, idx++) {
      // Gentle envelope avoids clicks at note boundaries.
      const envIn = Math.min(1, i / (sampleRate * 0.09))
      const envOut = Math.min(1, (samplesPerNote - i) / (sampleRate * 0.16))
      const env = Math.max(0, Math.min(envIn, envOut))

      const fundamental = Math.sin(phaseFundamental)
      const octave = Math.sin(phaseOctave)
      const sample = (0.72 * fundamental + 0.03 * octave) * env * 0.13
      pcm[idx] = Math.max(-1, Math.min(1, sample)) * 0x7fff

      phaseFundamental += fundamentalStep
      phaseOctave += octaveStep
      if (phaseFundamental > Math.PI * 2) phaseFundamental -= Math.PI * 2
      if (phaseOctave > Math.PI * 2) phaseOctave -= Math.PI * 2
    }
  }

  // Smooth the waveform lightly to soften metallic artifacts.
  for (let i = 1; i < pcm.length; i++) {
    pcm[i] = ((pcm[i - 1] * 2 + pcm[i]) / 3) | 0
  }

  // Fade edges to make loop transitions less clicky.
  const fadeSamples = Math.floor(sampleRate * 0.2)
  for (let i = 0; i < fadeSamples; i++) {
    const fadeIn = i / fadeSamples
    const fadeOut = (fadeSamples - i) / fadeSamples
    pcm[i] = (pcm[i] * fadeIn) | 0
    const j = pcm.length - 1 - i
    pcm[j] = (pcm[j] * fadeOut) | 0
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
  label?: string
  story: Story
}

const STORY_LIBRARY_KEY = 'kids-story.library.v1'
const STORY_SESSION_KEY = 'kids-story.session.v1'
const NORMAL_MUSIC_VOLUME = 0.22

export default function App() {
  const [story, setStory] = useState<Story | null>(null)
  const [readIndex, setReadIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>('landing')
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [name, setName] = useState('Finn')
  const [theme, setTheme] = useState<StoryTheme>('magic')
  const [musicOn, setMusicOn] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [speechRate, setSpeechRate] = useState(0.82)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [voiceURI, setVoiceURI] = useState('')
  const [savedStories, setSavedStories] = useState<SavedStory[]>([])
  const [selectedSavedId, setSelectedSavedId] = useState('')
  const [autoReadNextPage, setAutoReadNextPage] = useState(false)
  const [showMoreControls, setShowMoreControls] = useState(false)
  const [activeStoryId, setActiveStoryId] = useState<string | null>(null)
  const [storyRestored, setStoryRestored] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const musicUrlRef = useRef<string | null>(null)
  const shouldResumeMusicRef = useRef(false)

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
    setActiveStoryId(null)
    closeGenerator()
  }

  const openBook = () => {
    setPhase('reading')
  }

  const saveCurrentStory = () => {
    if (!story) return
    const title = story.cover.title.trim()
    const item: SavedStory = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      savedAt: Date.now(),
      label: title,
      story,
    }
    setSavedStories((prev) => {
      const next = [item, ...prev].slice(0, 50)
      return next
    })
    setSelectedSavedId(item.id)
    setActiveStoryId(item.id)
  }

  const loadSavedStory = (id: string) => {
    const found = savedStories.find((s) => s.id === id)
    if (!found) return
    setStory(found.story)
    setReadIndex(0)
    setPhase('cover')
    setSelectedSavedId(id)
    setActiveStoryId(id)
    stopSpeaking()
  }

  const deleteSavedStory = (id: string) => {
    setSavedStories((prev) => prev.filter((s) => s.id !== id))
    if (selectedSavedId === id) setSelectedSavedId('')
    if (activeStoryId === id) {
      setActiveStoryId(null)
      setStory(null)
      setReadIndex(0)
      setPhase('landing')
      stopSpeaking()
    }
  }

  const renameSavedStory = (id: string) => {
    const entry = savedStories.find((s) => s.id === id)
    if (!entry) return
    const nextLabel = window.prompt('Rename saved story', entry.label ?? entry.story.cover.title)
    if (!nextLabel) return
    const trimmed = nextLabel.trim()
    if (!trimmed) return
    setSavedStories((prev) => prev.map((s) => (s.id === id ? { ...s, label: trimmed } : s)))
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
    if (shouldResumeMusicRef.current) {
      shouldResumeMusicRef.current = false
      void startMusic()
    }
    setIsSpeaking(false)
  }

  const textToRead =
    phase === 'cover' && story
      ? `${story.cover.title}. ${story.cover.subtitle}.`
      : phase === 'reading' && story
        ? story.pages.map((p, i) => `Page ${i + 1}. ${p.text}`).join(' ')
        : ''

  const speakText = (content: string, onEnd?: () => void) => {
    if (!speechSupported || !content.trim()) return
    stopSpeaking()
    const selectedVoice = voiceURI ? voices.find((v) => v.voiceURI === voiceURI) : undefined
    const effectiveRate = Math.min(0.88, Math.max(0.72, speechRate))
    if (audioRef.current && !audioRef.current.paused) {
      shouldResumeMusicRef.current = true
      audioRef.current.pause()
    } else {
      shouldResumeMusicRef.current = false
    }

    const chunkBySentence = (value: string, maxLen = 170): string[] => {
      const rough = value
        .replace(/\s+/g, ' ')
        .trim()
        .split(/(?<=[.!?;:])\s+/)
        .filter(Boolean)
      const out: string[] = []
      let buffer = ''
      for (const sentence of rough) {
        const next = buffer ? `${buffer} ${sentence}` : sentence
        if (next.length <= maxLen) {
          buffer = next
          continue
        }
        if (buffer) out.push(buffer)
        if (sentence.length <= maxLen) {
          buffer = sentence
          continue
        }
        for (let i = 0; i < sentence.length; i += maxLen) {
          out.push(sentence.slice(i, i + maxLen))
        }
        buffer = ''
      }
      if (buffer) out.push(buffer)
      return out.length > 0 ? out : [value]
    }

    const chunks = chunkBySentence(content)
    const queue = chunks.map((chunk) => {
      const utterance = new SpeechSynthesisUtterance(chunk)
      utterance.rate = effectiveRate
      utterance.pitch = 1
      utterance.volume = 1
      utterance.lang = selectedVoice?.lang ?? 'en-US'
      if (selectedVoice) utterance.voice = selectedVoice
      return utterance
    })
    if (queue.length === 0) return

    queue[0].onstart = () => setIsSpeaking(true)
    queue[queue.length - 1].onend = () => {
      setIsSpeaking(false)
      if (shouldResumeMusicRef.current) {
        shouldResumeMusicRef.current = false
        void startMusic()
      }
      onEnd?.()
    }
    for (const item of queue) {
      item.onerror = () => {
        setIsSpeaking(false)
        if (shouldResumeMusicRef.current) {
          shouldResumeMusicRef.current = false
          void startMusic()
        }
      }
      window.speechSynthesis.speak(item)
    }
  }

  const speakCurrentText = () => {
    speakText(textToRead)
  }

  const speakCurrentPage = () => {
    if (!story || phase !== 'reading') return
    const readFrom = (pageIndex: number) => {
      const page = story.pages[pageIndex]
      if (!page) return
      speakText(`Page ${pageIndex + 1}. ${page.text}`, () => {
        if (!autoReadNextPage) return
        const next = pageIndex + 1
        if (next >= story.pages.length) return
        setReadIndex(next)
        window.setTimeout(() => readFrom(next), 220)
      })
    }
    readFrom(readIndex)
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
      el.volume = NORMAL_MUSIC_VOLUME
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
    try {
      const raw = window.localStorage.getItem(STORY_SESSION_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as {
        story: Story | null
        readIndex: number
        phase: Phase
        activeStoryId: string | null
      }
      if (!parsed || !parsed.story) return
      setStory(parsed.story)
      setReadIndex(Math.max(0, parsed.readIndex ?? 0))
      setPhase(parsed.phase ?? 'cover')
      setActiveStoryId(parsed.activeStoryId ?? null)
    } catch {
      // Ignore malformed session payloads.
    } finally {
      setStoryRestored(true)
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(STORY_LIBRARY_KEY, JSON.stringify(savedStories))
  }, [savedStories])

  useEffect(() => {
    if (!storyRestored) return
    const payload = {
      story,
      readIndex,
      phase,
      activeStoryId,
    }
    window.localStorage.setItem(STORY_SESSION_KEY, JSON.stringify(payload))
  }, [story, readIndex, phase, activeStoryId, storyRestored])

  useEffect(() => {
    if (!speechSupported) return
    const syncVoices = () => {
      const vs = window.speechSynthesis.getVoices()
      setVoices(vs)
      if (!voiceURI && vs.length > 0) {
        const preferred =
          vs.find((v) => /en-US/i.test(v.lang) && /google|samantha|daniel|microsoft|natural/i.test(v.name)) ??
          vs.find((v) => /en-US/i.test(v.lang)) ??
          vs.find((v) => /^en(-|$)/i.test(v.lang)) ??
          vs[0]
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
          <div className="toolbarRow toolbarRow--primary">
            <button type="button" className="generateBtn" onClick={openGenerator}>
              <SparklesIcon />
              New story
            </button>
            <button type="button" className="mediaBtn" onClick={toggleMusic}>
              {musicOn ? 'Music Off' : 'Music On'}
            </button>
            {speechSupported && textToRead ? (
              <button
                type="button"
                className="mediaBtn mediaBtn--read"
                onClick={() =>
                  isSpeaking ? stopSpeaking() : phase === 'reading' ? speakCurrentPage() : speakCurrentText()
                }
              >
                {isSpeaking ? 'Stop' : phase === 'reading' ? 'Read' : 'Read'}
              </button>
            ) : null}
            {savedStories.length > 0 ? (
              <label className="mediaSelectWrap">
                <span>Stories</span>
                <select
                  className="mediaSelect"
                  value={selectedSavedId}
                  onChange={(e) => setSelectedSavedId(e.target.value)}
                >
                  <option value="">Select...</option>
                  {savedStories.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label ?? s.story.cover.title}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            {selectedSavedId ? (
              <button type="button" className="mediaBtn" onClick={() => loadSavedStory(selectedSavedId)}>
                Open
              </button>
            ) : null}
            <button type="button" className="mediaBtn" onClick={() => setShowMoreControls((v) => !v)}>
              {showMoreControls ? 'Less' : 'More'}
            </button>
          </div>
          {showMoreControls ? (
            <div className="toolbarRow toolbarRow--secondary">
              {story ? (
                <>
                  <button type="button" className="mediaBtn" onClick={saveCurrentStory}>
                    Save
                  </button>
                  <button type="button" className="mediaBtn" onClick={exportStoryToPrint}>
                    Export
                  </button>
                </>
              ) : null}
              {selectedSavedId ? (
                <>
                  <button type="button" className="mediaBtn" onClick={() => renameSavedStory(selectedSavedId)}>
                    Rename
                  </button>
                  <button
                    type="button"
                    className="mediaBtn mediaBtn--danger"
                    onClick={() => deleteSavedStory(selectedSavedId)}
                  >
                    Delete
                  </button>
                </>
              ) : null}
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
                        {v.name} ({v.lang})
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
                    min="0.72"
                    max="1.0"
                    step="0.01"
                    value={speechRate}
                    onChange={(e) => setSpeechRate(Number(e.target.value))}
                  />
                </label>
              ) : null}
              {phase === 'reading' ? (
                <label className="mediaCheck">
                  <input
                    type="checkbox"
                    checked={autoReadNextPage}
                    onChange={(e) => setAutoReadNextPage(e.target.checked)}
                  />
                  <span>Auto next</span>
                </label>
              ) : null}
              {speechSupported && phase === 'reading' && textToRead ? (
                <button
                  type="button"
                  className="mediaBtn mediaBtn--read"
                  onClick={() => (isSpeaking ? stopSpeaking() : speakCurrentText())}
                >
                  {isSpeaking ? 'Stop' : 'Read Full'}
                </button>
              ) : null}
            </div>
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
