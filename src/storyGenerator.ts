import { APP_BRAND } from './brand'
import type { Story, StoryPage, StoryCover, StoryTheme } from './types'

/** More pages = longer book. Illustrations cycle through `beat-1` … `beat-8` per theme. */
export const STORY_PAGE_COUNT = 33

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

function buildCover(trimmed: string, theme: StoryTheme): StoryCover {
  const label = themeLabels[theme]
  return {
    title: `${trimmed}'s ${label} Story`,
    subtitle: coverSubtitles[theme],
    image: publicAsset(`illustrations/${theme}/cover.svg`),
    imageAlt: `Book cover: ${trimmed}'s ${label} story`,
    credit: APP_BRAND,
  }
}

function storyTexts(name: string, theme: StoryTheme): string[] {
  const t = themes[theme]
  const out = [
    `Once upon a time, ${name} stepped into ${t.place} and felt the world open like a gift. The air was ${t.mood}, and every sound seemed wrapped in kindness—birds, breeze, and the soft hum of a day that wanted to be remembered.`,
    `${name} paused to take it all in, breathing slowly, noticing tiny details: the way the light shifted, the friendly shapes in the clouds, and the feeling that something wonderful was about to begin.`,
    `Soon ${name} discovered a clue: a ${t.symbol} resting beside a note that said, "Follow the kind path." The words were written in looping letters, as if the universe itself had left a gentle invitation.`,
    `${name} tucked the clue away like treasure and chose a route that felt brave but not reckless. Each step forward made ${name}'s heart beat a little faster—in the best way, like the start of a song.`,
    `Along the trail, ${name} met new friends with warm eyes and easy laughter. They shared fruit, told jokes that did not need to be perfect, and invented a silly dance that made everyone collapse into giggles.`,
    `The group rested beneath a kind shade and swapped stories: favorite colors, smallest fears, and dreams that felt too big to say out loud—until suddenly they did not feel big at all.`,
    `When a tricky puzzle appeared, ${name} did not rush. ${name} listened, asked questions, and tried small ideas one by one. The answer arrived like sunrise—slow, then bright—until the puzzle bloomed into golden light.`,
    `A harder challenge followed, and for a moment ${name} worried. Then a friend placed a hand on ${name}'s shoulder and said, "We can try together." That sentence changed everything.`,
    `Together, ${name} and the friends helped someone who felt stuck. They offered patience instead of pressure, and learned that courage can be as soft as a hug and as steady as showing up.`,
    `Afterward, the rescued friend thanked them with happy tears and a promise: "Whenever you need me, I will come running." ${name} realized kindness travels in circles, always finding its way home.`,
    `The friends celebrated with a feast of simple treats—nothing fancy, only warmth. They made a toast to curiosity, to second chances, and to the magic of believing the day could still surprise them.`,
    `As the celebration quieted, ${name} sat still and felt proud—not loud proud, but deep proud, like roots growing stronger underground.`,
    `The weather turned playful: a gust, a sprinkle, then a rainbow edge along the horizon. Instead of complaining, ${name} laughed and said, "Even the sky wants to join our story."`,
    `They wandered farther and found a hidden nook—quieter than the rest of ${t.place}, glowing as if it had been waiting just for them. ${name} whispered thank you to no one in particular, and somehow that felt right.`,
    `A gentle elder appeared, neither loud nor stern, and offered advice in riddles that were easier than they sounded. ${name} listened twice, nodded once, and understood: the best paths are shared, never stolen.`,
    `For a little while they lost the trail—nothing scary, only confusing. They backtracked kindly, compared notes, and rebuilt the map in the air with fingers and hope until the true path returned.`,
    `A second puzzle blinked awake, smaller than the first but sneakier. ${name} pretended it was a game, counted to three, and let everyone offer one idea. The answer popped free like a cork, and the group cheered.`,
    `A sudden squall rolled in—quick, rattling, impossible to ignore. They huddled close, counted breaths, and waited it out while telling the silliest jokes they knew until the world softened again.`,
    `When night leaned closer, they made camp in a safe hollow. ${name} watched embers or starlight (or both) and felt very small in a good way—small enough to belong to something enormous and kind.`,
    `Someone began a song with a shaky first line, and the others joined until the melody grew brave. ${name} hummed along, not caring if the notes were perfect, only that the sound carried their hearts.`,
    `Dawn arrived with pink edges and fresh courage. ${name} stretched, smiled at the friends, and said, "We still have a little farther to go—and I am glad it is with you."`,
    `On the path they met a traveler with empty pockets and a heavy cart. Without being asked, ${name} offered help: a push, a joke, a sip of water—small things that made the stranger's eyes shine.`,
    `${name} picked a tiny keepsake—not to take ${t.place} away, but to remember it: a smooth stone, a pressed petal, a chip of stardust, a polished shell—something honest that fit in a palm.`,
    `Goodbyes came slowly, the way the best ones do. They hugged, promised to meet again, and traded silly nicknames that would make no sense to anyone else—and perfect sense to them.`,
    `${name} walked homeward with slow steps, turning back once, then twice, waving until the friends were only sparkles on the horizon. The road felt longer and sweeter because it was real.`,
    `The journey continued through afternoon heat and cool evening, through tired legs and stubborn grins. ${name} told the story out loud to the wind, practicing the best parts and forgiving the messy ones.`,
    `At last ${name} saw something familiar—a roofline, a smell of bread, a dog barking hello. Home had not moved, but ${name} saw it with new eyes, as if the house had been learning patience the whole time.`,
    `${name} burst through the door with boots dusty and eyes bright, spilling words and laughter. The listeners crowded close, asked a hundred questions, and demanded the silly dance immediately.`,
    `They told the tale again at supper, slower this time, letting each chapter breathe. Even the quiet moments sounded exciting, because love was listening.`,
    `Later, alone with a cup of something warm, ${name} replayed the adventure like a favorite song. The fear parts felt smaller now; the brave parts felt bigger; the friends felt closer than miles.`,
    `That night, ${name} drifted to sleep with a smile, listening to the quiet house and the faraway echo of friendship. Tomorrow could be ordinary, and that would be fine—but it could also hold another gentle surprise.`,
    `Seasons rolled on, and ${name} grew—not only taller, but gentler. When someone new felt nervous, ${name} remembered the hand on the shoulder and offered the same.`,
    `And whenever ${name} felt lonely, they would visit ${t.revisit}, where memories still sparkled and the world remembered their name. The End.`,
  ]
  if (out.length !== STORY_PAGE_COUNT) {
    throw new Error(`Story length mismatch: expected ${STORY_PAGE_COUNT} pages, got ${out.length}`)
  }
  return out
}

function pagesFor(name: string, theme: StoryTheme): StoryPage[] {
  const alts = beatAlts[theme]
  const texts = storyTexts(name, theme)
  const nBeat = alts.length

  return texts.map((text, i) => {
    const beat = (i % nBeat) + 1
    return {
      image: publicAsset(`illustrations/${theme}/beat-${beat}.svg`),
      imageAlt: alts[i % nBeat],
      text,
    }
  })
}

export function generateDemoStory(
  characterName: string,
  theme: StoryTheme,
): Story {
  const trimmed = characterName.trim() || 'the traveler'
  return {
    cover: buildCover(trimmed, theme),
    pages: pagesFor(trimmed, theme),
  }
}

export function defaultStory(): Story {
  return generateDemoStory('Finn', 'magic')
}
