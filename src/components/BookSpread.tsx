import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import { useMediaQuery } from '../hooks/useMediaQuery'
import type { StoryPage } from '../types'

type AnimDir = 'next' | 'prev' | null

type Props = {
  pages: StoryPage[]
  readIndex: number
  pageCount: number
  spreadCount: number
  onReadIndexChange: Dispatch<SetStateAction<number>>
}

const MOBILE_QUERY = '(max-width: 700px)'
const ANIM_NEXT = 'bookFlipNext'
const ANIM_PREV = 'bookFlipPrev'

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

export function BookSpread({
  pages,
  readIndex,
  pageCount,
  spreadCount,
  onReadIndexChange,
}: Props) {
  const isMobile = useMediaQuery(MOBILE_QUERY)
  const [animDir, setAnimDir] = useState<AnimDir>(null)

  const spreadIndex = Math.min(Math.floor(readIndex / 2), spreadCount - 1)
  const busy = animDir !== null

  const canPrevMobile = readIndex > 0
  const canNextMobile = readIndex < pageCount - 1
  const canPrevDesktop = spreadIndex > 0
  const canNextDesktop = spreadIndex < spreadCount - 1

  const canPrev = isMobile ? canPrevMobile : canPrevDesktop
  const canNext = isMobile ? canNextMobile : canNextDesktop

  const leftIdx = spreadIndex * 2
  const rightIdx = leftIdx + 1
  const leftPage = pages[leftIdx]
  const rightPage = pages[rightIdx] ?? pages[leftIdx]
  const leftNum = leftIdx + 1
  const rightNum = Math.min(rightIdx + 1, pageCount)

  const nextLeftIdx = (spreadIndex + 1) * 2
  const nextLeftPage = pages[nextLeftIdx]
  const nextLeftNum = nextLeftIdx + 1

  const prevSpreadLeftIdx = (spreadIndex - 1) * 2
  const prevRightIdx = prevSpreadLeftIdx + 1
  const prevRightPage =
    spreadIndex > 0 ? (pages[prevRightIdx] ?? pages[prevSpreadLeftIdx]) : leftPage
  const prevRightNum =
    spreadIndex > 0 ? Math.min(prevRightIdx + 1, pageCount) : rightNum

  const goNextMobile = () => {
    onReadIndexChange((i) => Math.min(pageCount - 1, i + 1))
  }

  const goPrevMobile = () => {
    onReadIndexChange((i) => Math.max(0, i - 1))
  }

  const goNextDesktop = () => {
    if (!canNextDesktop || busy) return
    setAnimDir('next')
  }

  const goPrevDesktop = () => {
    if (!canPrevDesktop || busy) return
    setAnimDir('prev')
  }

  const goNext = isMobile ? goNextMobile : goNextDesktop
  const goPrev = isMobile ? goPrevMobile : goPrevDesktop

  const onFlipAnimationEnd = (e: React.AnimationEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return
    if (animDir === 'next' && e.animationName === ANIM_NEXT) {
      onReadIndexChange((spreadIndex + 1) * 2)
      setAnimDir(null)
    }
    if (animDir === 'prev' && e.animationName === ANIM_PREV) {
      onReadIndexChange(Math.max(0, spreadIndex - 1) * 2)
      setAnimDir(null)
    }
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

      if (isMobile) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault()
          onReadIndexChange((i) => Math.max(0, i - 1))
        } else {
          e.preventDefault()
          onReadIndexChange((i) => Math.min(pageCount - 1, i + 1))
        }
        return
      }

      if (e.key === 'ArrowLeft') {
        if (!canPrevDesktop || busy) return
        e.preventDefault()
        setAnimDir('prev')
      } else {
        if (!canNextDesktop || busy) return
        e.preventDefault()
        setAnimDir('next')
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isMobile, canPrevDesktop, canNextDesktop, busy, pageCount, spreadIndex, onReadIndexChange])

  const mobilePage = pages[readIndex]

  if (isMobile) {
    return (
      <div className="bookWrap bookWrap--mobile">
        <div className="bookStage">
          <div className="bookBoard">
            <div className="bookBlockEdge bookBlockEdge--top" aria-hidden />
            <div className="book book--mobileSingle" role="region" aria-label="Story page">
              <Page
                layout="single"
                pageNum={readIndex + 1}
                image={mobilePage.image}
                imageAlt={mobilePage.imageAlt}
                text={mobilePage.text}
              />
            </div>
            <div className="bookBlockEdge bookBlockEdge--bottom" aria-hidden />
          </div>
        </div>

        <nav className="bookNav" aria-label="Turn pages">
          <button
            type="button"
            className="bookNav__btn bookNav__btn--prev"
            onClick={goPrev}
            disabled={!canPrev}
          >
            <ChevronLeft />
            <span>Previous</span>
          </button>
          <p className="bookNav__hint">
            <span className="bookNav__pageCount">
              Page {readIndex + 1} / {pageCount}
            </span>
          </p>
          <button
            type="button"
            className="bookNav__btn bookNav__btn--next"
            onClick={goNext}
            disabled={!canNext}
          >
            <span>Next</span>
            <ChevronRight />
          </button>
        </nav>
      </div>
    )
  }

  return (
    <div className="bookWrap">
      <div className="bookStage">
        <div className="bookBoard">
          <div className="bookBlockEdge bookBlockEdge--top" aria-hidden />
          <div className="book" role="region" aria-label="Story pages">
            {canPrevDesktop ? (
              <div className="book__flipWell book__flipWell--left">
                <div className="book__flipStatic book__flipStatic--left">
                  <Page
                    layout="spread"
                    align="left"
                    pageNum={prevRightNum}
                    image={prevRightPage.image}
                    imageAlt={prevRightPage.imageAlt}
                    text={prevRightPage.text}
                  />
                </div>
                <div
                  key={`flip-left-${spreadIndex}`}
                  className={[
                    'book__flipper',
                    'book__flipper--left',
                    animDir === 'prev' && 'book__flipper--animPrev',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onAnimationEnd={onFlipAnimationEnd}
                >
                  <div className="book__flipFace book__flipFace--front">
                    <Page
                      layout="spread"
                      align="left"
                      pageNum={leftNum}
                      image={leftPage.image}
                      imageAlt={leftPage.imageAlt}
                      text={leftPage.text}
                    />
                  </div>
                  <div className="book__flipFace book__flipFace--back">
                    <div className="book__flipFaceInner">
                      <Page
                        layout="spread"
                        align="left"
                        pageNum={prevRightNum}
                        image={prevRightPage.image}
                        imageAlt={prevRightPage.imageAlt}
                        text={prevRightPage.text}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <Page
                layout="spread"
                align="left"
                pageNum={leftNum}
                image={leftPage.image}
                imageAlt={leftPage.imageAlt}
                text={leftPage.text}
              />
            )}

            <div className="book__spine" aria-hidden />

            {canNextDesktop ? (
              <div className="book__flipWell book__flipWell--right">
                <div className="book__flipStatic book__flipStatic--right">
                  <Page
                    layout="spread"
                    align="right"
                    pageNum={nextLeftNum}
                    image={nextLeftPage.image}
                    imageAlt={nextLeftPage.imageAlt}
                    text={nextLeftPage.text}
                  />
                </div>
                <div
                  key={`flip-right-${spreadIndex}`}
                  className={[
                    'book__flipper',
                    'book__flipper--right',
                    animDir === 'next' && 'book__flipper--animNext',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onAnimationEnd={onFlipAnimationEnd}
                >
                  <div className="book__flipFace book__flipFace--front">
                    <Page
                      layout="spread"
                      align="right"
                      pageNum={rightNum}
                      image={rightPage.image}
                      imageAlt={rightPage.imageAlt}
                      text={rightPage.text}
                    />
                  </div>
                  <div className="book__flipFace book__flipFace--back">
                    <div className="book__flipFaceInner">
                      <Page
                        layout="spread"
                        align="right"
                        pageNum={nextLeftNum}
                        image={nextLeftPage.image}
                        imageAlt={nextLeftPage.imageAlt}
                        text={nextLeftPage.text}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <Page
                layout="spread"
                align="right"
                pageNum={rightNum}
                image={rightPage.image}
                imageAlt={rightPage.imageAlt}
                text={rightPage.text}
              />
            )}
          </div>
          <div className="bookBlockEdge bookBlockEdge--bottom" aria-hidden />
        </div>
      </div>

      <nav className="bookNav" aria-label="Turn pages">
        <button
          type="button"
          className="bookNav__btn bookNav__btn--prev"
          onClick={goPrev}
          disabled={!canPrev || busy}
        >
          <ChevronLeft />
          <span>Previous</span>
        </button>
        <p className="bookNav__hint">
          <kbd className="bookNav__kbd">←</kbd>
          <kbd className="bookNav__kbd">→</kbd>
          <span className="bookNav__hintText">keyboard</span>
        </p>
        <button
          type="button"
          className="bookNav__btn bookNav__btn--next"
          onClick={goNext}
          disabled={!canNext || busy}
        >
          <span>Next</span>
          <ChevronRight />
        </button>
      </nav>
    </div>
  )
}

function Page({
  layout,
  align,
  pageNum,
  image,
  imageAlt,
  text,
}: {
  layout: 'spread' | 'single'
  align?: 'left' | 'right'
  pageNum: number
  image: string
  imageAlt: string
  text: string
}) {
  const cls =
    layout === 'single'
      ? 'book__page book__page--single'
      : `book__page book__page--${align}`

  return (
    <div className={cls}>
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
