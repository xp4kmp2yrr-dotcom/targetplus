# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── target-plus/        # Target+ Expo mobile app
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Artifacts

### `artifacts/target-plus` — Target+ Mobile App

A study-support mobile app (Expo + React Native) for Target 1900 English vocabulary.

**Features:**
- **Home tab** — Welcome screen with app description in Japanese
- **Synonym Classification tab** — Register English word groups, AI analyzes shared meaning, nuance differences, and memory tips. Saves locally via AsyncStorage.
- **Meaning Search tab** — Search any English word for detailed Japanese explanations (meaning, nuance, usage hints, similar words, memory tips). Search history persisted locally.
- **Derivative Words tab** — Under development (開発中) screen

**AI Integration:**
- Gemini 2.5 Flash via Replit AI Integrations proxy (no user API key required)
- Expo app calls `POST /api/ai/synonyms` and `POST /api/ai/meaning` on the API server
- API server uses `@workspace/integrations-gemini-ai` to call Gemini
- Service layer at `artifacts/target-plus/services/ai.ts`

**Storage:**
- All data stored locally with AsyncStorage (no backend/auth needed)
- Service layer at `artifacts/target-plus/services/storage.ts`

**Navigation:**
- Bottom tabs with NativeTabs (liquid glass on iOS 26+) + classic Tabs fallback
- Web-safe padding and safe area handling throughout

**Colors:** Navy blue (#1D3557) + red (#E63946) + steel blue accent (#457B9D)

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server powering Target+'s AI features.

**AI Routes (`src/routes/ai.ts`):**
- `POST /api/ai/synonyms` — analyzes a group of English synonyms via Gemini AI
- `POST /api/ai/meaning` — explains an English word in detail in Japanese via Gemini AI

**Notes:**
- `@google/genai` is bundled (NOT externalized) in build.mjs — removed `@google/*` from external list
- Uses `@workspace/integrations-gemini-ai` for Gemini access via Replit's free AI proxy

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references
