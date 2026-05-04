import { useState } from 'react'
import type { StoryCover } from '../types'

const OPEN_ANIM = 'bookCoverOpen'

type Props = {
  cover: StoryCover
  onOpen: () => void
}

export function BookCover({ cover, onOpen }: Props) {
  const [opening, setOpening] = useState(false)

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
            <h1 className="bookCover__title">{cover.title}</h1>
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
            <p className="bookCover__credit">{cover.credit}</p>
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
