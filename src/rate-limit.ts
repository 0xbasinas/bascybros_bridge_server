import type { Context, Next } from "hono"

import type { AuthContext } from "./auth"

interface Bucket {
  count: number
  resetAt: number
}

export interface RateLimitOptions {
  limit: number
  windowMs: number
  methods?: string[]
  keyPrefix?: string
}

const buckets = new Map<string, Bucket>()

setInterval(() => {
  const now = Date.now()
  for (const [key, bucket] of buckets) {
    if (now > bucket.resetAt) buckets.delete(key)
  }
}, 60_000)

function resolveClientKey(c: Context): string {
  const auth = c.get("auth") as AuthContext | undefined
  if (auth?.userId) return `user:${auth.userId}`

  const authHeader = c.req.header("authorization")
  const tokenHint = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7, 32)
    : "anon"

  const trustedProxyHeaders = process.env.TRUST_PROXY_HEADERS === "true"
  const forwardedFor = trustedProxyHeaders
    ? c.req.header("x-forwarded-for")?.split(",")[0]?.trim()
    : undefined
  const realIp = trustedProxyHeaders ? c.req.header("x-real-ip")?.trim() : undefined

  return `token:${tokenHint}:${forwardedFor ?? realIp ?? "noip"}`
}

function setRateLimitHeaders(c: Context, limit: number, remaining: number, resetAt: number) {
  c.header("X-RateLimit-Limit", String(limit))
  c.header("X-RateLimit-Remaining", String(Math.max(0, remaining)))
  c.header("X-RateLimit-Reset", String(resetAt))
}

export function rateLimit(limit: number, windowMs: number, options?: Omit<RateLimitOptions, "limit" | "windowMs">) {
  const methods = options?.methods
  const keyPrefix = options?.keyPrefix ?? "route"

  return async (c: Context, next: Next) => {
    if (methods && !methods.includes(c.req.method)) {
      await next()
      return
    }

    const route = new URL(c.req.url).pathname
    const key = `${keyPrefix}:${route}:${resolveClientKey(c)}`
    const now = Date.now()
    const bucket = buckets.get(key)

    if (!bucket || now > bucket.resetAt) {
      const resetAt = now + windowMs
      buckets.set(key, { count: 1, resetAt })
      setRateLimitHeaders(c, limit, limit - 1, resetAt)
      await next()
      return
    }

    bucket.count++
    const remaining = limit - bucket.count
    setRateLimitHeaders(c, limit, remaining, bucket.resetAt)

    if (bucket.count > limit) {
      const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))
      c.header("Retry-After", String(retryAfter))
      return c.json(
        {
          ok: false,
          message: "Too many requests. Please slow down.",
          retryAfter,
        },
        429
      )
    }

    await next()
  }
}
