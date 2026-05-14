/**
 * Turn a family photo into a bold "kids' book cartoon" look in the browser.
 * Output is a JPEG data URL sized for localStorage-friendly stories.
 */

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read image'))
    }
    img.src = url
  })
}

function scaleToMax(img: HTMLImageElement, maxSide: number): { w: number; h: number } {
  const ratio = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight))
  return {
    w: Math.max(1, Math.round(img.naturalWidth * ratio)),
    h: Math.max(1, Math.round(img.naturalHeight * ratio)),
  }
}

/** Posterize + warm lift + slight edge pop for a printed-cartoon feel. */
function cartoonizePixels(data: Uint8ClampedArray, width: number, height: number, posterStep: number) {
  const copy = new Uint8ClampedArray(data)

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i]!
    let g = data[i + 1]!
    let b = data[i + 2]!

    r = Math.min(255, Math.round(r / posterStep) * posterStep)
    g = Math.min(255, Math.round(g / posterStep) * posterStep)
    b = Math.min(255, Math.round(b / posterStep) * posterStep)

    r = Math.min(255, Math.round(r * 1.06 + 8))
    g = Math.min(255, Math.round(g * 1.03 + 4))
    b = Math.min(255, Math.round(b * 0.97 + 6))

    data[i] = r
    data[i + 1] = g
    data[i + 2] = b
  }

  // Light edge blend (cartoon ink lines) — 1px neighbor delta on luminance.
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = (y * width + x) * 4
      const lum = (data[i]! + data[i + 1]! + data[i + 2]!) / 3
      const iR = (y * width + (x + 1)) * 4
      const lumR = (data[iR]! + data[iR + 1]! + data[iR + 2]!) / 3
      const iD = ((y + 1) * width + x) * 4
      const lumD = (data[iD]! + data[iD + 1]! + data[iD + 2]!) / 3
      const edge = Math.min(55, Math.abs(lum - lumR) + Math.abs(lum - lumD))
      if (edge > 22) {
        const ink = edge * 0.45
        data[i] = Math.max(0, data[i]! - ink * 0.35)
        data[i + 1] = Math.max(0, data[i + 1]! - ink * 0.35)
        data[i + 2] = Math.max(0, data[i + 2]! - ink * 0.4)
      }
    }
  }

  // Soft mix back to avoid harsh banding.
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.round(data[i]! * 0.72 + copy[i]! * 0.28)
    data[i + 1] = Math.round(data[i + 1]! * 0.72 + copy[i + 1]! * 0.28)
    data[i + 2] = Math.round(data[i + 2]! * 0.72 + copy[i + 2]! * 0.28)
  }
}

export async function fileToCartoonDataUrl(file: File, maxSide = 320): Promise<string | null> {
  if (!file.type.startsWith('image/')) return null

  let img: HTMLImageElement
  try {
    img = await loadImageFromFile(file)
  } catch {
    return null
  }

  const { w, h } = scaleToMax(img, maxSide)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, w, h)

  const snap = ctx.getImageData(0, 0, w, h)
  cartoonizePixels(snap.data, w, h, 22)
  ctx.putImageData(snap, 0, 0)

  const out = document.createElement('canvas')
  out.width = w
  out.height = h
  const octx = out.getContext('2d')
  if (!octx) return null
  octx.filter = 'saturate(1.38) contrast(1.14) brightness(1.02)'
  octx.drawImage(canvas, 0, 0)
  octx.filter = 'none'

  try {
    return out.toDataURL('image/jpeg', 0.82)
  } catch {
    return null
  }
}
