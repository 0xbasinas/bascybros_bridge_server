import { createClient } from "@libsql/client"
import { drizzle } from "drizzle-orm/libsql"
import * as schema from "./db/schema"

const tursoUrl = process.env.TURSO_DATABASE_URL
const tursoAuthToken = process.env.TURSO_AUTH_TOKEN

if (!tursoUrl) {
  throw new Error("TURSO_DATABASE_URL is not set")
}

if (!tursoAuthToken) {
  throw new Error("TURSO_AUTH_TOKEN is not set")
}

const turso = createClient({
  url: tursoUrl,
  authToken: tursoAuthToken,
})

export const db = drizzle(turso, { schema })
export { schema }
