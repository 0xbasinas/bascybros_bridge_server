import { Hono } from "hono"
import { db } from "../db"
import { sql } from "drizzle-orm"

const healthRouter = new Hono()

healthRouter.get("/", async (c) => {
  try {
    await db.run(sql`SELECT 1`)
    return c.json({ status: "ok", db: "connected" })
  } catch {
    return c.json({ status: "error", db: "disconnected" }, 500)
  }
})

export default healthRouter
