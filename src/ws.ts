import { createRemoteJWKSet, jwtVerify } from "jose"
import { upgradeWebSocket } from "hono/bun"
import type { Hono } from "hono"
import type { WSContext } from "hono/ws"

const issuer = process.env.CLERK_JWT_ISSUER!
const JWKS = createRemoteJWKSet(
  new URL(`${issuer}/.well-known/jwks.json`)
)
const audience = process.env.CLERK_JWT_AUDIENCE?.trim()
const authorizedParty = process.env.CLERK_JWT_AUTHORIZED_PARTY?.trim()

const clients = new Map<string, Set<WSContext>>()

export function addClient(userId: string, ws: WSContext) {
  if (!clients.has(userId)) clients.set(userId, new Set())
  clients.get(userId)!.add(ws)
}

export function removeClient(userId: string, ws: WSContext) {
  clients.get(userId)?.delete(ws)
}

export function notifyUser(userId: string, event: string, payload: unknown) {
  const userClients = clients.get(userId)
  if (!userClients) return

  const message = JSON.stringify({ event, payload, timestamp: Date.now() })
  for (const ws of userClients) {
    try {
      ws.send(message)
    } catch {
      userClients.delete(ws)
    }
  }
}

export function mountWebSocket(app: Hono) {
  app.get(
    "/ws",
    upgradeWebSocket((c) => ({
      onOpen: async (_event, ws) => {
        const url = new URL(c.req.url)
        const authHeader = c.req.header("authorization")
        const protocolHeader = c.req.header("sec-websocket-protocol")
        const protocolToken = protocolHeader
          ?.split(",")
          .map((part) => part.trim())
          .find((part) => part.startsWith("bearer."))
          ?.slice("bearer.".length)
        const queryToken = process.env.NODE_ENV !== "production" ? url.searchParams.get("token") : null
        const token = authHeader?.startsWith("Bearer ")
          ? authHeader.slice(7)
          : protocolToken ?? queryToken
        if (!token) {
          ws.close(4001, "Missing token")
          return
        }

        try {
          const { payload } = await jwtVerify(token, JWKS, {
            issuer,
            audience: audience || undefined,
          })
          if (authorizedParty && payload.azp !== authorizedParty) {
            ws.close(4001, "Invalid token")
            return
          }
          const userId = payload.sub!
          addClient(userId, ws)
          ws.send(JSON.stringify({ event: "connected", userId }))
        } catch {
          ws.close(4001, "Invalid token")
        }
      },
      onMessage: (event, ws) => {
        const msg = typeof event.data === "string" ? event.data : ""
        if (msg === "ping") {
          ws.send("pong")
        }
      },
      onClose: (_event, ws) => {
        for (const [uid, set] of clients) {
          if (set.has(ws)) {
            set.delete(ws)
            if (set.size === 0) clients.delete(uid)
          }
        }
      },
    }))
  )
}
