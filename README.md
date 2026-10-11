# 180 Public Sites

> Public-facing web presences for the 180 product ecosystem.

## Apps

| App | Port | Description | Cloudflare Pages Project | Custom Domain |
|-----|------|-------------|--------------------------|---------------|
| `apps/marketing-web` | `:3004` | Astro-powered marketing portal, product landing pages, SEO, blog | `180workspace-marketing` | `180workspace.com`, `www.180workspace.com` |
| `apps/docs` | `:3005` | Docusaurus-powered public product documentation | `180workspace-docs` | `docs.180workspace.com` |

## Quick Start

```bash
pnpm install
pnpm dev           # Start both marketing + docs in parallel
pnpm dev:marketing # Marketing only (:3004)
pnpm dev:docs      # Docs only (:3005)
```

## Production Builds & Local Deploy

```bash
pnpm build              # Turbo build for all apps & packages
pnpm deploy:marketing   # Deploy marketing site to Cloudflare Pages
pnpm deploy:docs        # Deploy docs portal to Cloudflare Pages
pnpm deploy             # Build & deploy both apps to Cloudflare Pages
```

## CI/CD Pipeline (Cloudflare Pages)

The repository includes automated CI/CD via GitHub Actions located in [`.github/workflows/deploy-cloudflare.yml`](.github/workflows/deploy-cloudflare.yml).

### Triggering Automatically
Any commit pushed to `main` or `master` triggers parallel deployment jobs:
1. **`deploy-marketing`**: Builds Astro static output (`apps/marketing-web/dist`) and deploys to `180workspace-marketing` on Cloudflare Pages.
2. **`deploy-docs`**: Builds Docusaurus static output (`apps/docs/build`) and deploys to `180workspace-docs` on Cloudflare Pages.

### Required GitHub Repository Secrets
To connect GitHub Actions to Cloudflare, configure these two repository secrets in GitHub:
* `CLOUDFLARE_API_TOKEN` — Cloudflare API token with **Cloudflare Pages: Edit** permissions.
* `CLOUDFLARE_ACCOUNT_ID` — Your Cloudflare Account ID (found in the Cloudflare dashboard overview).

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