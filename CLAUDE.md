# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ESV Threshold is an AI-powered interactive fiction game set in the Vantage deep exploration universe. Players manage persistent campaigns (worlds) and play through missions aboard the ESV Threshold. Claude generates narrative responses. The UI uses a sci-fi terminal aesthetic with a teal/cyan color scheme.

## Development Commands

### Local Development (recommended)

```bash
docker compose up          # Start all services (postgres, backend, frontend)
```

Services: frontend on :5173, backend on :3001, postgres on :5432.

**Note**: `node --watch` inside Docker on macOS does not detect file changes through volume mounts. After any backend change, run `docker compose restart backend`.

### Manual (without Docker)

```bash
# Backend
cd backend && npm run dev   # node --watch auto-restart

# Frontend
cd frontend && npm run dev  # Vite dev server with HMR
```

### Build

```bash
cd frontend && npm run build    # Production build to dist/
cd backend && npm start         # Production backend
```

## Architecture

**Monorepo**: `frontend/` (React/Vite SPA) + `backend/` (Express API) + `docker-compose.yml`.

```
Browser → React SPA (port 5173)
              ↓ fetch with cookies
         Express API (port 3001)
              ↓
         PostgreSQL (port 5432)
              ↓ (story/world routes only)
         Anthropic API
```

### Authentication Flow

Magic link email auth (no passwords):

1. User submits email → backend creates magic link (SHA256-hashed token, 15-min expiry) and sends via Resend
2. User clicks link → `GET /auth/verify?token=` → validates, marks used, sets httpOnly JWT cookie (30-day)
3. All API calls use `credentials: 'include'` to send the cookie
4. `requireAuth` middleware in `backend/src/middleware/auth.js` validates JWT and sets `req.user`

### Game Story Flow

- **Create world**: `POST /worlds` → Haiku generates a campaign name → world row created with empty `world_state`
- **Create story**: `POST /worlds/:id/stories` → `generateScenario(worldState)` builds a scenario from random ingredients (Sonnet) → Sonnet generates opening narrative → story stored linked to the world
- **Continue story**: `POST /stories/:id/message` → loads full message history + world state from DB → calls Sonnet with history + new user message → stores both → returns reply
- **Mission end**: story status set to `complete`/`failed` → `triggerWorldStateUpdate()` fires in background → Haiku extracts characters, vessels, events and merges into `world_state`; the story message history is passed as a structured messages array (not a formatted transcript string) to resist prompt injection
- Full conversation history is persisted in the `messages` table and replayed on each API call

### Database Schema (5 tables)

- `users`: id, email (unique), created_at
- `magic_links`: token_hash (SHA256, unique), expires_at, used_at, user_id FK
- `worlds`: id, name, world_state (JSONB), user_id FK, created/updated_at
- `stories`: id, title, status, scenario (JSONB), ingredients (JSONB), world_id FK, user_id FK, created/updated_at
- `messages`: story_id FK, role ('user'|'assistant'), content, created_at

### Key Frontend Files

- `frontend/src/api.js` — All API calls centralized here; uses `VITE_API_URL` env var
- `frontend/src/hooks/useAuth.jsx` — Auth context (user, loading, logout)
- `frontend/src/main.jsx` — Router + ProtectedRoute wrapper
- `frontend/src/pages/Game.jsx` — Main game UI (typewriter effect, crew panel, scroll-hide header)
- `frontend/src/pages/Dashboard.jsx` — Campaign list with world cards, mission log, create/delete
- `frontend/src/pages/Codex.jsx` — World codex view (characters, vessels, event log)

### Key Backend Files

- `backend/src/routes/story.js` — Story CRUD, message handling, mission status parsing
- `backend/src/routes/worlds.js` — World/campaign CRUD, story creation within a world
- `backend/src/routes/auth.js` — Magic link creation, verification, JWT issuance
- `backend/src/scenario.js` — Scenario generation (`generateScenario`), system prompt (`buildSystemPrompt`), intro prompt
- `backend/src/worldState.js` — World state extraction (`computeWorldStateUpdate`), background update trigger
- `backend/src/middleware/limiters.js` — Rate limiters: `authLimiter` (5/min), `claudeLimiter` (20/min), `dbLimiter` (120/min)
- `backend/src/db/schema.sql` — Database schema (run manually to initialize)
- `backend/src/db/client.js` — pg.Pool wrapper with query timing logs

## Environment Variables

Copy `.env.example` to `.env`. Required vars:

- `ANTHROPIC_API_KEY` — Claude API access
- `RESEND_API_KEY` + `RESEND_FROM_EMAIL` — Email delivery
- `JWT_SECRET` — Session signing

Docker Compose auto-injects: `DATABASE_URL`, `FRONTEND_URL`, `VITE_API_URL`, `NODE_ENV`.

## Claude Model Usage

- Story generation/continuation: `claude-sonnet-4-6`
- Scenario generation (`generateScenario`): `claude-sonnet-4-6` — Sonnet is intentionally used here (over Haiku) for richer `hidden_truth` and `theme` fields; future work may explore additional techniques to improve scenario creativity and variety
- World state extraction, title generation: `claude-haiku-4-5-20251001`
- Scenario and system prompt logic is in `backend/src/scenario.js`
- World state update logic is in `backend/src/worldState.js`

## UI Conventions

- **No external CSS files** — all styling via inline `style` props
- **Color palette**: teal `#1aadad`, bright teal `#22c8b8`, dark space `#04050a`, header bg `#080a16`, primary text `#d8e8f2`, muted text `#8aa0b0`, dim `#3d6078`
- **Fonts**: "Share Tech Mono" (story text), "Rajdhani" (UI labels) — loaded via Google Fonts in `frontend/index.html`

## Deployment (Railway)

Two Railway services: backend (`npm start`) and frontend (Docker), plus Railway Postgres plugin. Each service needs its own env vars set in the Railway dashboard.

### Frontend Docker Build (Production)

The frontend uses a multi-stage Docker build (`frontend/Dockerfile`):

1. **Builder stage**: Builds with `VITE_API_URL=VITE_API_URL_PLACEHOLDER` as a literal placeholder
2. **Runtime stage**: nginx serves the built files; on startup, `sed` replaces `VITE_API_URL_PLACEHOLDER` in all JS files with the actual `$VITE_API_URL` env var

This allows the same Docker image to be configured at runtime without rebuilding. `frontend/nginx.conf` configures nginx to serve the SPA with `try_files` fallback for client-side routing.

`frontend/Dockerfile.dev` is a simpler image that runs the Vite dev server (used by docker-compose for local development).
