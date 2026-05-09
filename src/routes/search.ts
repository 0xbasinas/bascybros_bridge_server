import { Hono } from "hono"
import { eq, or, like, and, sql } from "drizzle-orm"

import { clerkAuth, getAuth } from "../auth"
import { db, schema } from "../db"

const searchRouter = new Hono()

searchRouter.use("*", clerkAuth)

searchRouter.get("/", async (c) => {
  const { userId } = getAuth(c)
  const query = c.req.query("q")?.trim()

  if (!query) {
    return c.json({ ok: false, message: "Query parameter 'q' is required" }, 400)
  }

  const pattern = `%${query}%`

  const [foundNotes, foundResources, foundCommands, foundSnippets, foundTasks] =
    await Promise.all([
      db
        .select({ id: schema.notes.id, title: schema.notes.title, type: sql<"note">`'note'` })
        .from(schema.notes)
        .where(
          and(
            eq(schema.notes.userId, userId),
            or(like(schema.notes.title, pattern), like(schema.notes.contentMarkdown, pattern))
          )
        )
        .limit(5),

      db
        .select({ id: schema.resources.id, title: schema.resources.title, type: sql<"resource">`'resource'` })
        .from(schema.resources)
        .where(
          and(
            eq(schema.resources.userId, userId),
            or(like(schema.resources.title, pattern), like(schema.resources.url, pattern))
          )
        )
        .limit(5),

      db
        .select({ id: schema.commands.id, title: schema.commands.commandText, type: sql<"command">`'command'` })
        .from(schema.commands)
        .where(
          and(
            eq(schema.commands.userId, userId),
            or(
              like(schema.commands.commandText, pattern),
              like(schema.commands.description, pattern)
            )
          )
        )
        .limit(5),

      db
        .select({ id: schema.codeSnippets.id, title: schema.codeSnippets.title, type: sql<"snippet">`'snippet'` })
        .from(schema.codeSnippets)
        .where(
          and(
            eq(schema.codeSnippets.userId, userId),
            or(like(schema.codeSnippets.title, pattern), like(schema.codeSnippets.code, pattern))
          )
        )
        .limit(5),

      db
        .select({ id: schema.tasks.id, title: schema.tasks.title, type: sql<"task">`'task'` })
        .from(schema.tasks)
        .where(
          and(
            eq(schema.tasks.userId, userId),
            like(schema.tasks.title, pattern)
          )
        )
        .limit(5),
    ])

  return c.json({
    ok: true,
    results: [
      ...foundNotes,
      ...foundResources,
      ...foundCommands,
      ...foundSnippets,
      ...foundTasks,
    ],
  })
})

export default searchRouter
