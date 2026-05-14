import { useEffect, useRef, useState } from 'react'
import { BookCover } from './components/BookCover'
import { BookSpread } from './components/BookSpread'
import { generateDemoStory } from './storyGenerator'
import { fileToCartoonDataUrl } from './photoToCartoon'
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

function ToolbarMusicIcon({ on }: { on: boolean }) {
  return on ? (
    <svg className="toolbarSvg" width="22" height="22" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"
      />
    </svg>
  ) : (
    <svg className="toolbarSvg" width="22" height="22" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6zm-2 16c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"
      />
    </svg>
  )
}

function ToolbarReadIcon() {
  return (
    <svg className="toolbarSvg" width="22" height="22" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3s-3 1.34-3 3v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.46-5.73 5.92V21H9v-4.08C5.76 16.46 3.21 14 3.21 11H5c0 2.21 1.79 4 4 4s4-1.79 4-4h2.3z"
      />
    </svg>
  )
}

function ToolbarStopIcon() {
  return (
    <svg className="toolbarSvg" width="22" height="22" viewBox="0 0 24 24" aria-hidden>
      <path fill="currentColor" d="M6 6h12v12H6z" />
    </svg>
  )
}

function ToolbarMoreIcon() {
  return (
    <svg className="toolbarSvg" width="22" height="22" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"
      />
    </svg>
  )
}

function StoryExperienceShell({
  variant,
  children,
}: {
  variant: 'cover' | 'reading'
  children: React.ReactNode
}) {
  return (
    <div className={['storyExperience', variant === 'reading' && 'storyExperience--reading'].filter(Boolean).join(' ')}>
      <div className="storyExperience__main">{children}</div>
    </div>
  )
}

function LandingSideIcons() {
  return (
    <div className="landingHero__icons" aria-hidden>
      <span className="landingHero__iconChip">
        <svg width="28" height="28" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M18 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"
          />
        </svg>
      </span>
      <span className="landingHero__iconChip">
        <svg width="28" height="28" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M12 3l1.55 5.97L19 9.24l-4.5 3.47 1.73 6.29L12 15.9 7.77 18.99l1.73-6.28L5 9.24l5.45-.27L12 3z"
          />
        </svg>
      </span>
      <span className="landingHero__iconChip">
        <svg width="28" height="28" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z"
          />
        </svg>
      </span>
      <span className="landingHero__iconChip landingHero__iconChip--emoji" aria-hidden>
        🌙
      </span>
    </div>
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
            Little Bear is a gentle bedtime storybook you can shape together: pick a hero, choose a dreamy world, and
            read aloud with soft pages on the screen. Parents can even tuck in a photo at the start—we turn it into a
            cozy cartoon look so the story feels personal, not like a camera roll. When you are ready, tap below, name
            your star, and open the cover for a calm, read-together moment at the end of the day.
          </p>
          <button type="button" className="landingHero__cta" onClick={onGenerate}>
            <SparklesIcon />
            Generate a story
          </button>
        </div>
        <div className="landingHero__artCol">
          <img
            className="landingHero__art landingHero__art--compact"
            src={LANDING_HERO_SRC}
            width={1024}
            height={979}
            alt="A child reading on a giant book under moonlit clouds and stars"
            decoding="async"
          />
        </div>
        <LandingSideIcons />
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
  const [storySummary, setStorySummary] = useState('')
  const [kidPhotoCartoonUrl, setKidPhotoCartoonUrl] = useState<string | null>(null)
  const [kidPhotoConverting, setKidPhotoConverting] = useState(false)
  const [storyCreateBusy, setStoryCreateBusy] = useState(false)
  const [theme, setTheme] = useState<StoryTheme>('magic')
  const [musicOn, setMusicOn] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [speechRate, setSpeechRate] = useState(0.72)
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
  const startedMusicForSpeechRef = useRef(false)

  const pageCount = story?.pages.length ?? 0
  const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

  const openGenerator = () => dialogRef.current?.showModal()
  const closeGenerator = () => {
    dialogRef.current?.close()
  }

  const clearKidPhoto = () => {
    setKidPhotoCartoonUrl(null)
    setKidPhotoConverting(false)
  }

  const onKidPhotoChange = (fileList: FileList | null) => {
    const file = fileList?.[0] ?? null
    if (!file || !file.type.startsWith('image/')) {
      clearKidPhoto()
      return
    }
    void (async () => {
      setKidPhotoConverting(true)
      setKidPhotoCartoonUrl(null)
      try {
        const cartoon = await fileToCartoonDataUrl(file, 400)
        setKidPhotoCartoonUrl(cartoon)
      } finally {
        setKidPhotoConverting(false)
      }
    })()
  }

  const applyNewStory = async () => {
    setStoryCreateBusy(true)
    try {
      const heroPortraitCartoonUrl = kidPhotoCartoonUrl ?? undefined
      const next = generateDemoStory(name, theme, storySummary, {
        ...(heroPortraitCartoonUrl ? { heroPortraitCartoonUrl } : {}),
      })
      setStory(next)
      setReadIndex(0)
      setPhase('cover')
      setActiveStoryId(null)
      clearKidPhoto()
      closeGenerator()
    } finally {
      setStoryCreateBusy(false)
    }
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
    if (startedMusicForSpeechRef.current) {
      startedMusicForSpeechRef.current = false
      stopMusic()
    }
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
        ? story.pages.map((p) => p.text).join(' ')
        : ''

  const speakText = (content: string, onEnd?: () => void) => {
    if (!speechSupported || !content.trim()) return
    stopSpeaking()
    const selectedVoice = voiceURI ? voices.find((v) => v.voiceURI === voiceURI) : undefined
    const effectiveRate = Math.min(0.84, Math.max(0.62, speechRate))
    startedMusicForSpeechRef.current = false
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
      utterance.pitch = 0.86
      utterance.volume = 0.92
      utterance.lang = selectedVoice?.lang ?? 'en-US'
      if (selectedVoice) utterance.voice = selectedVoice
      return utterance
    })
    if (queue.length === 0) return

    queue[0].onstart = () => setIsSpeaking(true)
    queue[queue.length - 1].onend = () => {
      setIsSpeaking(false)
      if (startedMusicForSpeechRef.current) {
        startedMusicForSpeechRef.current = false
        stopMusic()
      }
      if (shouldResumeMusicRef.current) {
        shouldResumeMusicRef.current = false
        void startMusic()
      }
      onEnd?.()
    }
    for (const item of queue) {
      item.onerror = () => {
        setIsSpeaking(false)
        if (startedMusicForSpeechRef.current) {
          startedMusicForSpeechRef.current = false
          stopMusic()
        }
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
      speakText(page.text, () => {
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

  const toggleMusic = () => {
    shouldResumeMusicRef.current = false
    startedMusicForSpeechRef.current = false
    const el = audioRef.current
    if (!el) return

    if (!el.paused) {
      stopMusic()
      setMusicOn(false)
      return
    }

    el.volume = NORMAL_MUSIC_VOLUME
    void el.load()
    const playAttempt = el.play()
    if (playAttempt === undefined) {
      setMusicOn(true)
      return
    }
    playAttempt
      .then(() => setMusicOn(true))
      .catch(() => setMusicOn(false))
  }

  useEffect(() => {
    const url = createLullabyObjectUrl()
    musicUrlRef.current = url
    const el = new Audio()
    el.src = url
    el.loop = true
    el.volume = NORMAL_MUSIC_VOLUME
    el.preload = 'auto'
    audioRef.current = el
    void el.load()

    return () => {
      stopMusic()
      stopSpeaking()
      el.pause()
      el.removeAttribute('src')
      void el.load()
      audioRef.current = null
      URL.revokeObjectURL(url)
      musicUrlRef.current = null
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
        ? 'app app--coverSoft app--kidsBook'
        : 'app app--kidsBook'

  return (
    <div className={appClass}>
      {phase === 'landing' ? (
        <main className="appMain">
          <LandingHero onGenerate={openGenerator} />
        </main>
      ) : (
        <div className="appBody appBody--withRail">
          <main
            className={['appMain', phase === 'reading' && 'appMain--reading', phase === 'cover' && 'appMain--cover']
              .filter(Boolean)
              .join(' ')}
          >
            {phase === 'cover' && story ? (
              <StoryExperienceShell variant="cover">
                <BookCover key={story.cover.title} cover={story.cover} onOpen={openBook} />
              </StoryExperienceShell>
            ) : null}
            {phase === 'reading' && story ? (
              <StoryExperienceShell variant="reading">
                <div className="readingWrap readingWrap--single">
                  <BookSpread
                    pages={story.pages}
                    readIndex={readIndex}
                    pageCount={pageCount}
                    onReadIndexChange={setReadIndex}
                  />
                </div>
              </StoryExperienceShell>
            ) : null}
          </main>
          <aside
            className={['storyToolbar', 'storyToolbar--rail', showMoreControls && 'storyToolbar--drawerOpen']
              .filter(Boolean)
              .join(' ')}
            aria-label="Story tools"
          >
            <div className="storyToolbar__icons">
              <button
                type="button"
                className="toolbarIconBtn toolbarIconBtn--primary"
                onClick={openGenerator}
                aria-label="New story"
                title="New story"
              >
                <SparklesIcon />
              </button>
              <button
                type="button"
                className={['toolbarIconBtn', musicOn && 'toolbarIconBtn--active'].filter(Boolean).join(' ')}
                onClick={toggleMusic}
                aria-label={musicOn ? 'Turn music off' : 'Turn music on'}
                title={musicOn ? 'Music on' : 'Music off'}
              >
                <ToolbarMusicIcon on={musicOn} />
              </button>
              {speechSupported && textToRead ? (
                <button
                  type="button"
                  className={['toolbarIconBtn', isSpeaking ? 'toolbarIconBtn--active' : ''].filter(Boolean).join(' ')}
                  onClick={() =>
                    isSpeaking ? stopSpeaking() : phase === 'reading' ? speakCurrentPage() : speakCurrentText()
                  }
                  aria-label={isSpeaking ? 'Stop reading' : 'Read aloud'}
                  title={isSpeaking ? 'Stop' : 'Read'}
                >
                  {isSpeaking ? <ToolbarStopIcon /> : <ToolbarReadIcon />}
                </button>
              ) : null}
              <button
                type="button"
                className={['toolbarIconBtn', showMoreControls ? 'toolbarIconBtn--active' : ''].filter(Boolean).join(
                  ' ',
                )}
                onClick={() => setShowMoreControls((v) => !v)}
                aria-expanded={showMoreControls}
                aria-controls="story-toolbar-more"
                aria-label={showMoreControls ? 'Close more options' : 'More options'}
                title="More"
              >
                <ToolbarMoreIcon />
              </button>
            </div>
            {showMoreControls ? (
              <div
                id="story-toolbar-more"
                className="storyToolbar__drawer"
                role="region"
                aria-label="More story options"
              >
                <div className="storyToolbar__drawerInner">
                  {savedStories.length > 0 ? (
                    <div className="storyToolbar__drawerBlock">
                      <label className="mediaSelectWrap mediaSelectWrap--stack">
                        <span>Saved stories</span>
                        <select
                          className="mediaSelect mediaSelect--full"
                          value={selectedSavedId}
                          onChange={(e) => setSelectedSavedId(e.target.value)}
                        >
                          <option value="">Select…</option>
                          {savedStories.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.label ?? s.story.cover.title}
                            </option>
                          ))}
                        </select>
                      </label>
                      {selectedSavedId ? (
                        <button
                          type="button"
                          className="mediaBtn mediaBtn--block"
                          onClick={() => loadSavedStory(selectedSavedId)}
                        >
                          Open story
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                  {story ? (
                    <div className="storyToolbar__drawerBlock">
                      <button type="button" className="mediaBtn mediaBtn--block" onClick={saveCurrentStory}>
                        Save
                      </button>
                      <button type="button" className="mediaBtn mediaBtn--block" onClick={exportStoryToPrint}>
                        Export
                      </button>
                    </div>
                  ) : null}
                  {selectedSavedId ? (
                    <div className="storyToolbar__drawerBlock">
                      <button
                        type="button"
                        className="mediaBtn mediaBtn--block"
                        onClick={() => renameSavedStory(selectedSavedId)}
                      >
                        Rename
                      </button>
                      <button
                        type="button"
                        className="mediaBtn mediaBtn--block mediaBtn--danger"
                        onClick={() => deleteSavedStory(selectedSavedId)}
                      >
                        Delete
                      </button>
                    </div>
                  ) : null}
                  {speechSupported ? (
                    <div className="storyToolbar__drawerBlock">
                      <label className="mediaSelectWrap mediaSelectWrap--stack">
                        <span>Voice</span>
                        <select
                          className="mediaSelect mediaSelect--full"
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
                      <label className="mediaSelectWrap mediaSelectWrap--stack mediaSelectWrap--rate">
                        <span>Speed {speechRate.toFixed(2)}×</span>
                        <input
                          className="mediaRange mediaRange--full"
                          type="range"
                          min="0.62"
                          max="0.84"
                          step="0.01"
                          value={speechRate}
                          onChange={(e) => setSpeechRate(Number(e.target.value))}
                        />
                      </label>
                    </div>
                  ) : null}
                  {phase === 'reading' ? (
                    <label className="mediaCheck mediaCheck--block">
                      <input
                        type="checkbox"
                        checked={autoReadNextPage}
                        onChange={(e) => setAutoReadNextPage(e.target.checked)}
                      />
                      <span>Auto next page</span>
                    </label>
                  ) : null}
                  {speechSupported && phase === 'reading' && textToRead ? (
                    <button
                      type="button"
                      className="mediaBtn mediaBtn--block mediaBtn--read"
                      onClick={() => (isSpeaking ? stopSpeaking() : speakCurrentText())}
                    >
                      {isSpeaking ? 'Stop' : 'Read entire story'}
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}
          </aside>
        </div>
      )}

      <dialog ref={dialogRef} className="storyDialog">
        <form
          method="dialog"
          className="storyDialog__form"
          onSubmit={(e) => {
            e.preventDefault()
            void applyNewStory()
          }}
        >
          <h2 className="storyDialog__title">Create your story</h2>
          <p className="storyDialog__lede">Name your hero and pick a theme—we&apos;ll open the book cover next.</p>
          <div className="field field--photo">
            <span className="field__label">Optional: your child&apos;s photo (storybook cartoon)</span>
            <p className="field__hint">
              Choose a picture and we&apos;ll show a cartoon version right away. Only that cartoon art is used on the
              first story page—never the original photo.
            </p>
            <input
              className="field__file"
              type="file"
              accept="image/*"
              onChange={(e) => onKidPhotoChange(e.target.files)}
            />
            {kidPhotoConverting ? <p className="field__status">Turning the photo into a cartoon…</p> : null}
            {kidPhotoCartoonUrl ? (
              <div className="kidPhotoPreview">
                <img
                  src={kidPhotoCartoonUrl}
                  alt="Cartoon preview of your photo for the story"
                  className="kidPhotoPreview__img kidPhotoPreview__img--cartoon"
                />
                <button type="button" className="kidPhotoPreview__remove" onClick={clearKidPhoto}>
                  Remove photo
                </button>
              </div>
            ) : null}
          </div>
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
          <label className="field">
            <span className="field__label">What should this story be about?</span>
            <textarea
              className="field__input"
              value={storySummary}
              onChange={(e) => setStorySummary(e.target.value)}
              maxLength={220}
              rows={3}
              placeholder="e.g. helping a shy dragon make friends at a moonlight picnic"
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
            <button type="submit" className="btnPrimary" disabled={storyCreateBusy || kidPhotoConverting}>
              {storyCreateBusy ? 'Preparing…' : kidPhotoConverting ? 'Cartoon…' : 'See the cover'}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  )
}
