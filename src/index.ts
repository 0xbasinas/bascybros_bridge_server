import { app } from "./app"

const port = parseInt(process.env.PORT || "8787", 10)

console.log(`Bridge server starting on port ${port}...`)

export default {
  port,
  fetch: app.fetch,
}

console.log(`Bridge server ready: http://localhost:${port}`)
console.log(`  Health check: http://localhost:${port}/api/health`)
