import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { eq, and, desc } from "drizzle-orm"
import { remove } from "@tigrisdata/storage"

import { clerkAuth, getAuth } from "../auth"
import { db, schema } from "../db"
import { uploadedFileSchema } from "../lib/validators"
import { notifyUser } from "../ws"

const uploadedFilesRouter = new Hono()

uploadedFilesRouter.use("*", clerkAuth)

uploadedFilesRouter.post("/", zValidator("json", uploadedFileSchema), async (c) => {
  const { userId } = getAuth(c)
  const body = c.req.valid("json")
  const expectedPrefix = `uploads/${userId}/`
  if (!body.storagePath.startsWith(expectedPrefix)) {
    return c.json({ ok: false, message: "Invalid storage path" }, 400)
  }

  const id = crypto.randomUUID()
  await db.insert(schema.uploadedFiles).values({
    id,
    userId,
    filename: body.filename,
    storagePath: body.storagePath,
    url: body.url,
    mimeType: body.mimeType,
    size: body.size,
    entityType: body.entityType ?? null,
    entityId: body.entityId ?? null,
  })

  notifyUser(userId, "file:created", { id, filename: body.filename })
  return c.json({ ok: true, id }, 201)
})

uploadedFilesRouter.delete("/:id", async (c) => {
  const { userId } = getAuth(c)
  const id = c.req.param("id")

  const [file] = await db
    .select({ storagePath: schema.uploadedFiles.storagePath })
    .from(schema.uploadedFiles)
    .where(and(eq(schema.uploadedFiles.id, id), eq(schema.uploadedFiles.userId, userId)))
    .limit(1)

  if (!file) {
    return c.json({ ok: false, message: "File not found" }, 404)
  }
  const expectedPrefix = `uploads/${userId}/`
  if (!file.storagePath.startsWith(expectedPrefix)) {
    return c.json({ ok: false, message: "Invalid storage path" }, 400)
  }

  const delResult = await remove(file.storagePath)

  await db
    .delete(schema.uploadedFiles)
    .where(and(eq(schema.uploadedFiles.id, id), eq(schema.uploadedFiles.userId, userId)))

  notifyUser(userId, "file:deleted", { id })
  return c.json({ ok: true })
})

uploadedFilesRouter.get("/", async (c) => {
  const { userId } = getAuth(c)
  const entityType = c.req.query("entityType")

  const where = entityType
    ? and(eq(schema.uploadedFiles.entityType, entityType), eq(schema.uploadedFiles.userId, userId))
    : eq(schema.uploadedFiles.userId, userId)

  const files = await db
    .select()
    .from(schema.uploadedFiles)
    .where(where)
    .orderBy(desc(schema.uploadedFiles.createdAt))

  return c.json({ ok: true, files })
})

export default uploadedFilesRouter
