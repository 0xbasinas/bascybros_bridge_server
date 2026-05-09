import { Hono } from "hono"
import { cors } from "hono/cors"
import { logger } from "hono/logger"

import { mountWebSocket } from "./ws"
import notesRouter from "./routes/notes"
import resourcesRouter from "./routes/resources"
import commandsRouter from "./routes/commands"
import snippetsRouter from "./routes/snippets"
import tasksRouter from "./routes/tasks"
import searchRouter from "./routes/search"
import healthRouter from "./routes/health"
import uploadRouter from "./routes/uploads"
import filesRouter from "./routes/files"
import { rateLimit } from "./rate-limit"

const app = new Hono()

app.use("*", logger())
app.use("*", async (c, next) => {
  await next()
  c.header("X-Content-Type-Options", "nosniff")
  c.header("X-Frame-Options", "DENY")
  c.header("Referrer-Policy", "strict-origin-when-cross-origin")
  if (process.env.NODE_ENV === "production") {
    c.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload")
  }
})
app.use("/api/search/*", rateLimit(60, 60_000))
app.use("/api/upload/*", rateLimit(20, 60_000))
app.use("/api/files/*", rateLimit(60, 60_000))

app.use(
  "*",
  cors({
    origin: (origin) => {
      const allowed = [process.env.ALLOWED_ORIGIN!].filter(Boolean)
      if (process.env.NODE_ENV !== "production") {
        allowed.push("http://localhost:5173", "http://localhost:3000")
      }
      if (origin && allowed.includes(origin)) return origin
      if (!origin && process.env.NODE_ENV !== "production") return "http://localhost:5173"
      return null
    },
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Authorization", "Content-Type"],
    maxAge: 86400,
  })
)

app.route("/api/notes", notesRouter)
app.route("/api/resources", resourcesRouter)
app.route("/api/commands", commandsRouter)
app.route("/api/snippets", snippetsRouter)
app.route("/api/tasks", tasksRouter)
app.route("/api/search", searchRouter)
app.route("/api/health", healthRouter)
app.route("/api/upload", uploadRouter)
app.route("/api/files", filesRouter)

mountWebSocket(app)

app.notFound((c) => c.json({ ok: false, message: "Not found" }, 404))

app.onError((err, c) => {
  console.error("Unhandled error:", err instanceof Error ? err.message : "Unknown error")
  return c.json({ ok: false, message: "Internal server error" }, 500)
})

export { app }
