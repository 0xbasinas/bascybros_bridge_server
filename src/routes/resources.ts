import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"

import { clerkAuth, getAuth } from "../auth"
import { db, schema } from "../db"
import { resourceSchema } from "../lib/validators"
import { notifyUser } from "../ws"

const resourcesRouter = new Hono()

resourcesRouter.use("*", clerkAuth)

resourcesRouter.post("/", zValidator("json", resourceSchema), async (c) => {
  const { userId } = getAuth(c)
  const body = c.req.valid("json")

  const id = crypto.randomUUID()
  const now = Math.floor(Date.now() / 1000)

  const tags = (body.tags ?? "")
    .split(",")
    .map((t: string) => t.trim())
    .filter(Boolean)
    .join(", ")

  await db.insert(schema.resources).values({
    id,
    userId,
    title: body.title,
    url: body.url,
    tags,
    notesMarkdown: body.notesMarkdown ?? "",
    createdAt: now,
    updatedAt: now,
  })

  notifyUser(userId, "resource:created", { id, title: body.title })

  return c.json({ ok: true, id }, 201)
})

export default resourcesRouter
