import sharp from "sharp"

const MAX_WIDTH = 1920
const MAX_HEIGHT = 1080

export async function compressImage(buffer: Buffer, mimeType: string): Promise<{ buffer: Buffer; mimeType: string }> {
  const image = sharp(buffer)

  const metadata = await image.metadata()

  const needsResize = (metadata.width ?? 0) > MAX_WIDTH || (metadata.height ?? 0) > MAX_HEIGHT

  let pipeline = image
    .rotate()

  if (needsResize) {
    pipeline = pipeline.resize({
      width: MAX_WIDTH,
      height: MAX_HEIGHT,
      fit: "inside",
      withoutEnlargement: true,
      kernel: sharp.kernel.lanczos3,
    })
  }

  pipeline = pipeline.sharpen({ sigma: 0.5 })

  const isScreenshot = metadata.height && metadata.width
    && (metadata.width === metadata.height * 1.6 || metadata.width === metadata.height * 1.78
    || metadata.width === metadata.height * 1.33)

  const isGif = mimeType === "image/gif"
  const isSvg = mimeType === "image/svg+xml"
  const isPng = mimeType === "image/png"
  const hasAlpha = isPng && metadata.hasAlpha === true

  if (isGif || isSvg) {
    return { buffer, mimeType }
  }

  if (isPng && hasAlpha && (metadata.width ?? 0) <= 512 && (metadata.height ?? 0) <= 512) {
    buffer = await pipeline.png({ compressionLevel: 9, palette: true }).toBuffer()
    return { buffer, mimeType }
  }

  try {
    const avifQuality = isScreenshot ? 75 : 65
    buffer = await pipeline.avif({ quality: avifQuality, effort: 4 }).toBuffer()
    return { buffer, mimeType: "image/avif" }
  } catch {
  }

  const webpQuality = isScreenshot ? 85 : 80
  buffer = await pipeline
    .webp({ quality: webpQuality, effort: 6, smartSubsample: true })
    .toBuffer()
  return { buffer, mimeType: "image/webp" }
}
