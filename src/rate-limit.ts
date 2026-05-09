import type { Context, Next } from "hono"

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

setInterval(() => {
  const now = Date.now()
  for (const [key, bucket] of buckets) {
    if (now > bucket.resetAt) buckets.delete(key)
  }
}, 60_000)

export function rateLimit(limit: number, windowMs: number) {
  return async (c: Context, next: Next) => {
    const authHeader = c.req.header("authorization")
    const tokenHint = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7, 32)
      : "anon"
    const trustedProxyHeaders = process.env.TRUST_PROXY_HEADERS === "true"
    const forwardedFor = trustedProxyHeaders
      ? c.req.header("x-forwarded-for")?.split(",")[0]?.trim()
      : undefined
    const realIp = trustedProxyHeaders ? c.req.header("x-real-ip")?.trim() : undefined
    const route = new URL(c.req.url).pathname
    const key = `${route}:${tokenHint}:${forwardedFor ?? realIp ?? "noip"}`
    const now = Date.now()
    const bucket = buckets.get(key)

    if (!bucket || now > bucket.resetAt) {
      buckets.set(key, { count: 1, resetAt: now + windowMs })
    } else {
      bucket.count++
      if (bucket.count > limit) {
        return c.json(
          {
            ok: false,
            message: "Too many requests. Please slow down.",
            retryAfter: Math.ceil((bucket.resetAt - now) / 1000),
          },
          429
        )
      }
    }

    await next()
  }
}
