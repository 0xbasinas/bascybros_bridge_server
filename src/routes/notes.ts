import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { eq, and } from "drizzle-orm"

import { clerkAuth, getAuth } from "../auth"
import { db, schema } from "../db"
import { noteSchema } from "../lib/validators"
import { notifyUser } from "../ws"

const notesRouter = new Hono()

notesRouter.use("*", clerkAuth)

notesRouter.post("/", zValidator("json", noteSchema), async (c) => {
  const { userId } = getAuth(c)
  const body = c.req.valid("json")

  const id = crypto.randomUUID()
  const now = Math.floor(Date.now() / 1000)

  const tags = body.tags
    .split(",")
    .map((t: string) => t.trim())
    .filter(Boolean)
    .join(", ")

  await db.insert(schema.notes).values({
    id,
    userId,
    title: body.title,
    contentMarkdown: body.contentMarkdown,
    tags,
    createdAt: now,
    updatedAt: now,
  })

  notifyUser(userId, "note:created", { id, title: body.title })

  return c.json({ ok: true, id }, 201)
})

notesRouter.post("/:id/append", async (c) => {
  const { userId } = getAuth(c)
  const id = c.req.param("id")
  const { markdown } = await c.req.json<{ markdown: string }>()

  if (!markdown?.trim()) {
    return c.json({ ok: false, message: "Markdown content is required" }, 400)
  }

  const [current] = await db
    .select({ contentMarkdown: schema.notes.contentMarkdown })
    .from(schema.notes)
    .where(and(eq(schema.notes.id, id), eq(schema.notes.userId, userId)))
    .limit(1)

  if (!current) {
    return c.json({ ok: false, message: "Note not found" }, 404)
  }

  const nextContent = [current.contentMarkdown, markdown.trim()]
    .filter(Boolean)
    .join("\n\n")
    .trim()

  await db
    .update(schema.notes)
    .set({ contentMarkdown: nextContent, updatedAt: Math.floor(Date.now() / 1000) })
    .where(and(eq(schema.notes.id, id), eq(schema.notes.userId, userId)))

  notifyUser(userId, "note:appended", { id })

  return c.json({ ok: true })
})

export default notesRouter
