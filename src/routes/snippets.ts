import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"

import { clerkAuth, getAuth } from "../auth"
import { db, schema } from "../db"
import { snippetSchema } from "../lib/validators"
import { notifyUser } from "../ws"

const snippetsRouter = new Hono()

snippetsRouter.use("*", clerkAuth)

snippetsRouter.post("/", zValidator("json", snippetSchema), async (c) => {
  const { userId } = getAuth(c)
  const body = c.req.valid("json")

  const id = crypto.randomUUID()
  const now = Math.floor(Date.now() / 1000)

  await db.insert(schema.codeSnippets).values({
    id,
    userId,
    title: body.title,
    language: body.language,
    code: body.code,
    notesMarkdown: body.notesMarkdown ?? "",
    createdAt: now,
    updatedAt: now,
  })

  notifyUser(userId, "snippet:created", { id, title: body.title })

  return c.json({ ok: true, id }, 201)
})

export default snippetsRouter
