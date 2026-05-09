import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"

import { clerkAuth, getAuth } from "../auth"
import { db, schema } from "../db"
import { taskSchema } from "../lib/validators"
import { notifyUser } from "../ws"

const tasksRouter = new Hono()

tasksRouter.use("*", clerkAuth)

tasksRouter.post("/", zValidator("json", taskSchema), async (c) => {
  const { userId } = getAuth(c)
  const body = c.req.valid("json")

  const id = crypto.randomUUID()
  const now = Math.floor(Date.now() / 1000)

  await db.insert(schema.tasks).values({
    id,
    userId,
    title: body.title,
    detailsMarkdown: body.detailsMarkdown ?? "",
    status: body.status ?? "open",
    relatedEntityType: body.relatedEntityType ?? null,
    relatedEntityId: body.relatedEntityId ?? null,
    createdAt: now,
    updatedAt: now,
  })

  notifyUser(userId, "task:created", { id, title: body.title })

  return c.json({ ok: true, id }, 201)
})

export default tasksRouter
