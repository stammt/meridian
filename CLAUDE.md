# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

USS Meridian is a Star Trek-themed AI-powered interactive fiction game. Players create and continue stories aboard a Nova-class starship, with Claude generating narrative responses. The UI uses a LCARS (Star Trek computer interface) aesthetic.

## Development Commands

### Local Development (recommended)
```bash
docker compose up          # Start all services (postgres, backend, frontend)
```
Services: frontend on :5173, backend on :3001, postgres on :5432.

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
              ↓ (story routes only)
         Anthropic API
```

### Authentication Flow
Magic link email auth (no passwords):
1. User submits email → backend creates magic link (SHA256-hashed token, 15-min expiry) and sends via Resend
2. User clicks link → `GET /auth/verify?token=` → validates, marks used, sets httpOnly JWT cookie (30-day)
3. All API calls use `credentials: 'include'` to send the cookie
4. `requireAuth` middleware in `backend/src/middleware/auth.js` validates JWT and sets `req.user`

### Game Story Flow
- **Create story**: `POST /stories` → calls Claude (Sonnet) with system prompt + intro prompt → stores opening as first assistant message → calls Claude (Haiku) to auto-generate title
- **Continue story**: `POST /stories/:id/message` → loads full message history from DB → calls Claude with history + new user message → stores both → returns reply
- Full conversation history is persisted in the `messages` table and replayed on each API call

### Database Schema (4 tables)
- `users`: id, email (unique), created_at
- `magic_links`: token_hash (SHA256, unique), expires_at, used_at, user_id FK
- `stories`: id, title, user_id FK, created/updated_at
- `messages`: story_id FK, role ('user'|'assistant'), content, created_at

### Key Frontend Files
- `frontend/src/api.js` — All API calls centralized here; uses `VITE_API_URL` env var
- `frontend/src/hooks/useAuth.jsx` — Auth context (user, loading, logout)
- `frontend/src/main.jsx` — Router + ProtectedRoute wrapper
- `frontend/src/pages/Game.jsx` — Main game UI (typewriter effect, crew panel, LCARS styling, scroll-hide header)
- `frontend/src/pages/Dashboard.jsx` — Story list with create/delete

### Key Backend Files
- `backend/src/routes/story.js` — Core game logic, system prompt, Claude API calls
- `backend/src/routes/auth.js` — Magic link creation, verification, JWT issuance
- `backend/src/db/schema.sql` — Database schema (run manually to initialize)
- `backend/src/db/client.js` — pg.Pool wrapper with query timing logs

## Environment Variables

Copy `.env.example` to `.env`. Required vars:
- `ANTHROPIC_API_KEY` — Claude API access
- `RESEND_API_KEY` + `RESEND_FROM_EMAIL` — Email delivery
- `JWT_SECRET` — Session signing

Docker Compose auto-injects: `DATABASE_URL`, `FRONTEND_URL`, `VITE_API_URL`, `NODE_ENV`.

## Claude Model Usage

- Story generation/continuation: `claude-sonnet-4-20250514`
- Title generation: `claude-haiku-4-5-20251001`
- System prompt and character bios are defined inline in `backend/src/routes/story.js`

## UI Conventions

- **No external CSS files** — all styling via inline `style` props
- **LCARS color palette**: gold `#c8830a`, orange `#e05c00`, cream `#e8dcc8`, space `#05060f`
- **Fonts**: "Share Tech Mono" (story text), "Rajdhani" (UI labels) — loaded via Google Fonts in `frontend/index.html`
- Crew panel (5 senior staff: Thorn, Jorek, Bashara, Fesh, K'veth) is defined in `Game.jsx`

## Deployment (Railway)

Two Railway services: backend (`npm start`) and frontend (Docker), plus Railway Postgres plugin. Each service needs its own env vars set in the Railway dashboard.

### Frontend Docker Build (Production)

The frontend uses a multi-stage Docker build (`frontend/Dockerfile`):
1. **Builder stage**: Builds with `VITE_API_URL=VITE_API_URL_PLACEHOLDER` as a literal placeholder
2. **Runtime stage**: nginx serves the built files; on startup, `sed` replaces `VITE_API_URL_PLACEHOLDER` in all JS files with the actual `$VITE_API_URL` env var

This allows the same Docker image to be configured at runtime without rebuilding. `frontend/nginx.conf` configures nginx to serve the SPA with `try_files` fallback for client-side routing.

`frontend/Dockerfile.dev` is a simpler image that runs the Vite dev server (used by docker-compose for local development).
