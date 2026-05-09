import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"

import { clerkAuth, getAuth } from "../auth"
import { db, schema } from "../db"
import { commandSchema } from "../lib/validators"
import { notifyUser } from "../ws"

const commandsRouter = new Hono()

commandsRouter.use("*", clerkAuth)

commandsRouter.post("/", zValidator("json", commandSchema), async (c) => {
  const { userId } = getAuth(c)
  const body = c.req.valid("json")

  const id = crypto.randomUUID()
  const now = Math.floor(Date.now() / 1000)

  const tags = (body.tags ?? "")
    .split(",")
    .map((t: string) => t.trim())
    .filter(Boolean)
    .join(", ")

  await db.insert(schema.commands).values({
    id,
    userId,
    commandText: body.commandText,
    description: body.description,
    tags,
    createdAt: now,
    updatedAt: now,
  })

  notifyUser(userId, "command:created", { id, commandText: body.commandText })

  return c.json({ ok: true, id }, 201)
})

export default commandsRouter
