import { Hono } from "hono"
import { getPresignedUrl, put } from "@tigrisdata/storage"

import { clerkAuth, getAuth } from "../auth"
import { compressImage } from "../lib/compress-image"
import { ALLOWED_IMAGE_TYPES, MAX_UPLOAD_SIZE } from "../lib/constants"

const uploadRouter = new Hono()

uploadRouter.use("*", clerkAuth)

uploadRouter.post("/", async (c) => {
  const { userId } = getAuth(c)

  const formData = await c.req.formData()
  const file = formData.get("file")

  if (!file || !(file instanceof File)) {
    return c.json({ ok: false, message: "No file provided" }, 400)
  }

  if (file.size > MAX_UPLOAD_SIZE) {
    return c.json({ ok: false, message: "File too large (max 10 MB)" }, 400)
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type as typeof ALLOWED_IMAGE_TYPES[number])) {
    return c.json({ ok: false, message: "Invalid file type. Allowed: PNG, JPEG, WebP, AVIF, GIF" }, 400)
  }

  const originalBuffer = Buffer.from(await file.arrayBuffer())
  const compressed = await compressImage(originalBuffer, file.type)

  const ext = compressed.mimeType.split("/")[1] || "jpg"
  const storagePath = `uploads/${userId}/${crypto.randomUUID()}.${ext}`

  const result = await put(storagePath, compressed.buffer, {
    contentType: compressed.mimeType,
  })

  if (result.error) {
    return c.json({ ok: false, message: result.error.message }, 500)
  }

  const presigned = await getPresignedUrl(storagePath, {
    operation: "get",
    expiresIn: 7 * 24 * 3600,
  })

  const url = presigned.data?.url ?? result.data?.url
  if (!url) {
    return c.json({ ok: false, message: "Failed to generate URL" }, 500)
  }

  return c.json({
    ok: true,
    url,
    storagePath,
    filename: file.name,
    mimeType: compressed.mimeType,
    size: compressed.buffer.length,
  }, 201)
})

export default uploadRouter
