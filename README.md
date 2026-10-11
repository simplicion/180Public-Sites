# 180 Public Sites

> Public-facing web presences for the 180 product ecosystem.

## Apps

| App | Port | Description |
|-----|------|-------------|
| `apps/marketing-web` | `:3004` | Astro-powered marketing portal, product landing pages, SEO, blog |
| `apps/docs` | `:3005` | Docusaurus-powered public product documentation |

## Quick Start

```bash
pnpm install
pnpm dev           # Start both marketing + docs
pnpm dev:marketing # Marketing only (:3004)
pnpm dev:docs      # Docs only (:3005)
```

## Shared Packages

- `packages/ui` — Shared UI components
- `packages/db` — Database client (Prisma)
- `packages/identity-sdk` — 180 Core Identity SDK
- `packages/typescript-config` — Shared TS config
- `packages/eslint-config` — Shared lint rules

## Part of the 180 Ecosystem

| Project | Location |
|---------|----------|
| **180workspace** (Platform) | `C:\Users\saavi\Desktop\180 Project\180workspace` |
| **180 core** (Auth, Pay, Identity) | `C:\Users\saavi\Desktop\180 Project\180 core` |
| **180 social studio** (Creator Tools) | `C:\Users\saavi\Desktop\180 Project\180 social studio` |
| **180 public sites** (This repo) | `C:\Users\saavi\Desktop\180 Project\180 public sites` |
