import { useEffect, type Dispatch, type SetStateAction } from 'react'
import type { StoryPage } from '../types'

type Props = {
  pages: StoryPage[]
  readIndex: number
  pageCount: number
  onReadIndexChange: Dispatch<SetStateAction<number>>
}

function ChevronLeft() {
  return (
    <svg className="bookNav__icon" width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"
      />
    </svg>
  )
}

function ChevronRight() {
  return (
    <svg className="bookNav__icon" width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"
      />
    </svg>
  )
}

export function BookSpread({ pages, readIndex, pageCount, onReadIndexChange }: Props) {
  const canPrev = readIndex > 0
  const canNext = readIndex < pageCount - 1
  const page = pages[readIndex]

  const goNext = () => {
    onReadIndexChange((i) => Math.min(pageCount - 1, i + 1))
  }

  const goPrev = () => {
    onReadIndexChange((i) => Math.max(0, i - 1))
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return

      const target = e.target
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return
      }

      const openDialog = document.querySelector('dialog[open]')
      if (openDialog?.contains(document.activeElement)) return

      if (e.key === 'ArrowLeft') {
        if (!canPrev) return
        e.preventDefault()
        onReadIndexChange((i) => Math.max(0, i - 1))
      } else {
        if (!canNext) return
        e.preventDefault()
        onReadIndexChange((i) => Math.min(pageCount - 1, i + 1))
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [canPrev, canNext, pageCount, onReadIndexChange])

  if (!page) return null

  return (
    <div className="bookWrap bookWrap--mobile bookWrap--singlePage">
      <div className="bookStage">
        <div className="bookBoard bookBoard--kids">
          <div className="bookBlockEdge bookBlockEdge--top" aria-hidden />
          <div className="book book--mobileSingle" role="region" aria-label="Story page">
            <Page
              pageNum={readIndex + 1}
              image={page.image}
              imageAlt={page.imageAlt}
              text={page.text}
            />
          </div>
          <div className="bookBlockEdge bookBlockEdge--bottom" aria-hidden />
        </div>
      </div>

      <nav className="bookNav" aria-label="Turn pages">
        <button type="button" className="bookNav__btn bookNav__btn--prev" onClick={goPrev} disabled={!canPrev}>
          <ChevronLeft />
          <span>Previous</span>
        </button>
        <p className="bookNav__hint">
          <span className="bookNav__pageCount">
            Page {readIndex + 1} / {pageCount}
          </span>
        </p>
        <button type="button" className="bookNav__btn bookNav__btn--next" onClick={goNext} disabled={!canNext}>
          <span>Next</span>
          <ChevronRight />
        </button>
      </nav>
    </div>
  )
}

function Page({
  pageNum,
  image,
  imageAlt,
  text,
}: {
  pageNum: number
  image: string
  imageAlt: string
  text: string
}) {
  return (
    <div className="book__page book__page--single">
      <span className="book__mascot" aria-hidden>
        🐻
      </span>
      <span className="book__pageNum">Page {pageNum}</span>
      <div className="book__illustrationWrap">
        <img
          className="book__illustration"
          src={image}
          alt={imageAlt}
          loading="lazy"
          decoding="async"
        />
      </div>
      <p className="book__text">{text}</p>
    </div>
  )
}
