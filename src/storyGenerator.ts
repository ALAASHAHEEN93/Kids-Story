import { APP_BRAND } from './brand'
import type { Story, StoryPage, StoryCover, StoryTheme } from './types'

/** Kid-friendly length. Illustrations cycle through `beat-1` … `beat-8` per theme. */
export const STORY_PAGE_COUNT = 16

/** Public-folder URLs (work with `base: './'` and GitHub project pages). */
function publicAsset(path: string): string {
  const rel = path.startsWith('/') ? path.slice(1) : path
  const base = import.meta.env.BASE_URL
  return base.endsWith('/') ? `${base}${rel}` : `${base}/${rel}`
}

const themes: Record<
  StoryTheme,
  { place: string; mood: string; symbol: string; revisit: string }
> = {
  adventure: {
    place: 'a winding forest trail',
    mood: 'brave and curious',
    symbol: 'ancient map',
    revisit:
      'the winding forest trail, where the trees still whispered and the birds greeted every visitor',
  },
  space: {
    place: 'a shimmering nebula',
    mood: 'full of wonder',
    symbol: 'friendly starship',
    revisit:
      'the quiet nebula overlook, where distant stars still twinkled like old friends',
  },
  ocean: {
    place: 'a coral cove beneath the waves',
    mood: 'playful and bright',
    symbol: 'singing seashell',
    revisit:
      'the coral cove, where the waves still hummed and the fish darted in bright ribbons',
  },
  magic: {
    place: 'a garden where flowers hum soft songs',
    mood: 'gentle and sparkling',
    symbol: 'glowing key',
    revisit:
      'the magical garden, where the flowers still sang and the butterflies danced',
  },
}

const themeLabels: Record<StoryTheme, string> = {
  adventure: 'Adventure',
  space: 'Space',
  ocean: 'Ocean',
  magic: 'Magic',
}

const coverSubtitles: Record<StoryTheme, string> = {
  adventure: 'An outdoor quest full of courage',
  space: 'A journey beyond the stars',
  ocean: 'A splashy tale under the waves',
  magic: 'Where wonder grows on every page',
}

/** One alt per illustration beat (reused when the story is longer than 8 pages). */
const beatAlts: Record<StoryTheme, readonly string[]> = {
  adventure: [
    'A sunny forest path between tall green trees',
    'An old parchment map and a compass on moss',
    'Forest animal friends dancing in a woodland clearing',
    'A stone puzzle gate covered in vines and fireflies',
    'Two hikers helping a friend across a small wooden bridge',
    'A cozy wooden cabin at the edge of the forest',
    'A campfire under a starry sky between pine trees',
    'An open adventure journal with a leaf bookmark',
  ],
  space: [
    'A colorful nebula with a small rocket drifting by',
    'A friendly starship beside a glowing space chart',
    'Cute aliens and robots sharing a floating space picnic',
    'A spinning puzzle made of constellations and light',
    'Two astronauts in helmets sharing a high-five in zero gravity',
    'A round space habitat window looking out at Earth',
    'A crescent moon and a ringed planet in a purple sky',
    'A holographic storybook floating in starlight',
  ],
  ocean: [
    'Sunlight through blue water over pink and orange coral',
    'A spiral seashell with a tiny scroll tucked inside',
    'Dolphins and fish playing around colorful coral',
    'A sunken puzzle chest glowing with pearl light',
    'A child diver helping a small sea turtle with friends',
    'A seashell-shaped cottage on the sandy ocean floor',
    'Glowing jellyfish and bioluminescent waves at night',
    'An open book with pages like gentle waves',
  ],
  magic: [
    'A humming flower garden with sparkles in the air',
    'A golden key floating above a tiny fairy door',
    'Fairies and sprites dancing in a ring of mushrooms',
    'A crystal puzzle orb on a pedestal of vines',
    'Healing sparkles between two wizards helping a friend',
    'A storybook cottage with a heart on the door and wand stars',
    'A smiling moon over a wizard tower and glowing moths',
    'An ancient spellbook open with runes and butterflies',
  ],
}

function buildCover(trimmed: string, theme: StoryTheme, summary: string): StoryCover {
  const label = themeLabels[theme]
  const subtitleBase = coverSubtitles[theme]
  const subtitle = summary ? `${subtitleBase} - ${summary}` : subtitleBase
  return {
    title: `${trimmed}'s ${label} Story`,
    subtitle,
    image: publicAsset(`illustrations/${theme}/cover.svg`),
    imageAlt: `Book cover: ${trimmed}'s ${label} story`,
    credit: APP_BRAND,
  }
}

function storyTexts(
  name: string,
  theme: StoryTheme,
  summary: string,
  hasCustomPortrait: boolean,
): string[] {
  const t = themes[theme]
  const idea = summary || `a kind day in ${t.place}`
  const promptPool = [
    `Can you spot the ${t.symbol}?`,
    'Can you find the tiniest sparkle?',
    'What color do you see first?',
    `Can you wave to ${name}'s friend?`,
    'Can you take a slow sleepy breath?',
    'Can you find the moon shape?',
  ]
  const portraitLead = hasCustomPortrait
    ? `On the very first page, a cozy cartoon portrait of ${name} smiled out from the paper—like a sticker from a dream, not a camera flash. `
    : ''

  const beats = [
    `${portraitLead}${name} stepped into ${t.place} with a big smile. Today was about ${idea}.`,
    `${name} found a ${t.symbol} and held it close. It felt warm and brave.`,
    `${name} met a new friend and said hello. They giggled and walked together.`,
    `A tiny puzzle appeared on the path. ${name} solved it with calm thinking.`,
    `The sky glowed pink and blue. ${name} whispered, "What a lovely day."`,
    `${name} helped someone who felt shy. Kindness made everyone glow.`,
    `They shared a snack and a silly dance. Happy feet tapped everywhere.`,
    `${name} looked up and saw gentle stars. The night felt safe and soft.`,
  ]

  const softLines = [
    'The moment slowed, as if the whole world were listening.',
    'Even the air felt gentle, like a blanket tucked just right.',
    'They took one slow breath and let the colors feel friendly.',
    'Everything around them hummed a tiny, sleepy sparkle.',
  ]

  const out = Array.from({ length: STORY_PAGE_COUNT }, (_, i) => {
    const beat = beats[i % beats.length]
    const prompt = promptPool[i % promptPool.length]
    const soft = softLines[i % softLines.length]
    return `${beat} ${soft} ${prompt}`
  })

  out[out.length - 1] = `${name} came home cozy and proud. ${t.revisit} waited for the next adventure. The End.`

  if (out.length !== STORY_PAGE_COUNT) {
    throw new Error(`Story length mismatch: expected ${STORY_PAGE_COUNT} pages, got ${out.length}`)
  }
  return out
}

function pagesFor(
  name: string,
  theme: StoryTheme,
  summary: string,
  heroPortraitCartoonUrl?: string,
): StoryPage[] {
  const alts = beatAlts[theme]
  const hasPortrait = Boolean(heroPortraitCartoonUrl)
  const texts = storyTexts(name, theme, summary, hasPortrait)
  const nBeat = alts.length

  return texts.map((text, i) => {
    const beat = (i % nBeat) + 1
    const usePortrait = Boolean(heroPortraitCartoonUrl) && i === 0
    return {
      image: usePortrait
        ? heroPortraitCartoonUrl!
        : publicAsset(`illustrations/${theme}/beat-${beat}.svg`),
      imageAlt: usePortrait
        ? `Storybook cartoon portrait of ${name}—a gentle illustrated version, not a photograph`
        : alts[i % nBeat],
      text,
    }
  })
}

export function generateDemoStory(
  characterName: string,
  theme: StoryTheme,
  summary = '',
  options?: { heroPortraitCartoonUrl?: string },
): Story {
  const trimmed = characterName.trim() || 'the traveler'
  const summaryTrimmed = summary.trim().replace(/\s+/g, ' ').slice(0, 120)
  const heroPortraitCartoonUrl = options?.heroPortraitCartoonUrl
  return {
    cover: buildCover(trimmed, theme, summaryTrimmed),
    pages: pagesFor(trimmed, theme, summaryTrimmed, heroPortraitCartoonUrl),
    ...(heroPortraitCartoonUrl ? { heroPortraitCartoonUrl } : {}),
  }
}

export function defaultStory(): Story {
  return generateDemoStory('Finn', 'magic')
}
