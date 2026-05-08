import { useState } from 'react'
import type { StoryCover } from '../types'

const OPEN_ANIM = 'bookCoverOpen'

type Props = {
  cover: StoryCover
  onOpen: () => void
}

export function BookCover({ cover, onOpen }: Props) {
  const [opening, setOpening] = useState(false)
  const heroName = cover.title.split("'s")[0]?.trim() || cover.title
  const storyTitle =
    cover.title.includes("'s") ? cover.title.split("'s")[1]?.trim() || 'Bedtime Story' : cover.title

  const startOpen = () => {
    if (opening) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      onOpen()
      return
    }
    setOpening(true)
  }

  const handleAnimEnd = (e: React.AnimationEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return
    if (e.animationName !== OPEN_ANIM) return
    setOpening(false)
    onOpen()
  }

  return (
    <div className="bookCover">
      <div className="bookCover__stage">
        <div
          className={[
            'bookCover__board',
            opening && 'bookCover__board--opening',
          ]
            .filter(Boolean)
            .join(' ')}
          onAnimationEnd={handleAnimEnd}
        >
          <div className="bookCover__spine" aria-hidden />
          <div className="bookCover__face">
            <div className="bookCover__skyDots" aria-hidden>
              <span>✦</span>
              <span>✦</span>
              <span>✦</span>
              <span>✦</span>
            </div>
            <p className="bookCover__series">Kids&apos; Bedtime Stories</p>
            <div className="bookCover__heroTitle">
              <span className="bookCover__moon" aria-hidden>
                🌙
              </span>
              <h1 className="bookCover__name">{heroName}</h1>
            </div>
            <p className="bookCover__and">AND THE</p>
            <h2 className="bookCover__title">{storyTitle}</h2>
            <div className="bookCover__artWrap">
              <img
                className="bookCover__art"
                src={cover.image}
                alt={cover.imageAlt}
                width={320}
                height={320}
              />
            </div>
            <p className="bookCover__subtitle">{cover.subtitle}</p>
            <p className="bookCover__credit">by {cover.credit}</p>
            <button
              type="button"
              className="bookCover__openBtn"
              onClick={startOpen}
              disabled={opening}
            >
              Open the book
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
