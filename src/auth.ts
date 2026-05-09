import { createRemoteJWKSet, jwtVerify } from "jose"
import type { Context, Next } from "hono"

const issuer = process.env.CLERK_JWT_ISSUER
if (!issuer) {
  throw new Error("CLERK_JWT_ISSUER is not set")
}

const JWKS = createRemoteJWKSet(
  new URL(`${issuer}/.well-known/jwks.json`)
)
const audience = process.env.CLERK_JWT_AUDIENCE?.trim()
const authorizedParty = process.env.CLERK_JWT_AUTHORIZED_PARTY?.trim()

export interface AuthContext {
  userId: string
  sessionId: string
}

export async function clerkAuth(c: Context, next: Next) {
  const header = c.req.header("Authorization")
  if (!header?.startsWith("Bearer ")) {
    return c.json({ error: "Missing or invalid Authorization header" }, 401)
  }

  const token = header.slice(7)

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer,
      audience: audience || undefined,
    })

    const userId = payload.sub
    const sessionId = payload.sid as string | undefined

    if (!userId || !sessionId) {
      return c.json({ error: "Invalid token claims" }, 401)
    }
    if (authorizedParty && payload.azp !== authorizedParty) {
      return c.json({ error: "Invalid token claims" }, 401)
    }

    c.set("auth", { userId, sessionId } satisfies AuthContext)

    await next()
  } catch {
    return c.json({ error: "Token verification failed" }, 401)
  }
}

export function getAuth(c: Context): AuthContext {
  const auth = c.get("auth") as AuthContext | undefined
  if (!auth) throw new Error("Auth middleware not applied")
  return auth
}
