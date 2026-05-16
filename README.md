# BascyBros Bridge Server

Standalone HTTP + WebSocket API for the [BascyBros Chrome extension](https://github.com/0xbasinas/bascybros-chrome-extension). Built with [Hono](https://hono.dev/) on [Bun](https://bun.sh/). Authenticates requests with Clerk JWTs and reads/writes the same Turso database and Tigris uploads as the [main dashboard](https://github.com/0xbasinas/bascybros).

The mobile app talks to Next.js directly, not this service.

## Stack

- Bun, Hono, Zod
- Turso / libSQL + Drizzle ORM
- Tigris storage, Sharp (image compression)
- Clerk JWT verification (`jose` + JWKS)
- WebSocket fan-out for upload notifications

## Related repos

| Repo | Role |
|------|------|
| [bascybros](https://github.com/0xbasinas/bascybros) | Next.js dashboard (primary backend for web + mobile) |
| [bascybros-chrome-extension](https://github.com/0xbasinas/bascybros-chrome-extension) | Extension client |
| [bascybrosmobile](https://github.com/0xbasinas/bascybrosmobile) | Expo app (does not use the bridge) |

## Setup

1. Install dependencies:

   ```bash
   bun install
   ```

2. Create a `.env` file (gitignored). Typical variables:

   | Variable | Purpose |
   |----------|---------|
   | `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` | Database (same as web app) |
   | `CLERK_JWT_ISSUER` | Required for JWT verification |
   | `CLERK_JWT_AUDIENCE`, `CLERK_JWT_AUTHORIZED_PARTY` | Optional JWT constraints |
   | `ALLOWED_ORIGIN` | Production CORS allowlist |
   | `PORT` | Listen port (default **8787**) |

3. Run:

   ```bash
   bun run dev
   ```

   Health check: [http://localhost:8787/api/health](http://localhost:8787/api/health)

## Scripts

```bash
bun run dev        # hot reload
bun run typecheck
```

## API overview

REST routes under `/api/` include notes, resources, commands, snippets, tasks, search, health, multipart upload, and file metadata. Extension clients set `PLASMO_PUBLIC_BRIDGE_URL` to this server's origin (HTTPS in production).
