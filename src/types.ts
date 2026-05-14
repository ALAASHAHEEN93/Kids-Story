export type StoryTheme = 'adventure' | 'space' | 'ocean' | 'magic'

export type StoryCover = {
  title: string
  subtitle: string
  image: string
  imageAlt: string
  /** Shown on the bottom of the cover (e.g. series name). */
  credit: string
}

export type StoryPage = {
  /** Path or URL to the illustration (e.g. `/illustrations/beat-1.svg`). */
  image: string
  /** Short description for screen readers. */
  imageAlt: string
  text: string
}

export type Story = {
  cover: StoryCover
  pages: StoryPage[]
  /**
   * Optional parent-uploaded portrait, processed into a cartoon-style data URL
   * and used on the opening page (never the raw camera photo).
   */
  heroPortraitCartoonUrl?: string
}
