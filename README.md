# USS Meridian

A Star Trek-themed open-ended adventure game powered by Claude AI.

## Tech Stack

- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **Database**: PostgreSQL
- **Auth**: Magic link email via Resend
- **AI**: Anthropic Claude (claude-sonnet-4)
- **Local dev**: Docker Compose
- **Hosting**: Railway

---

## Local Development

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- An [Anthropic API key](https://console.anthropic.com/)
- A [Resend account](https://resend.com/) (free tier is fine)

### 1. Clone and configure

```bash
git clone <your-repo-url>
cd meridian
cp .env.example .env
```

Edit `.env` and fill in your keys:

```env
ANTHROPIC_API_KEY=sk-ant-...
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@resend.dev   # use resend.dev sandbox for local testing
JWT_SECRET=<generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
```

> **Resend sandbox**: During local development, Resend's sandbox (`@resend.dev`) only
> delivers to the email address registered on your Resend account. That's enough for
> testing — you'll configure a real sending domain before deploying.

### 2. Start everything

```bash
docker compose up
```

This starts:

- PostgreSQL on port 5432 (schema auto-applied on first run)
- Backend API on port 3001
- Frontend on port 5173

Open [http://localhost:5173](http://localhost:5173)

### 3. Iterating

- Frontend changes hot-reload automatically
- Backend changes restart automatically (`node --watch`)
- Database schema changes: edit `backend/src/db/schema.sql`, then run:
  ```bash
  docker compose down -v && docker compose up
  ```
  (the `-v` flag wipes the postgres volume so the schema re-applies cleanly)

---

## Project Structure

```
meridian/
├── frontend/
│   ├── src/
│   │   ├── main.jsx          # Router + auth provider
│   │   ├── api.js            # All API calls in one place
│   │   ├── hooks/
│   │   │   └── useAuth.js    # Auth context
│   │   └── pages/
│   │       ├── Login.jsx     # Magic link request form
│   │       ├── AuthVerify.jsx
│   │       ├── Dashboard.jsx # Story list
│   │       └── Game.jsx      # The game itself
│   └── ...
├── backend/
│   ├── src/
│   │   ├── index.js          # Express server
│   │   ├── routes/
│   │   │   ├── auth.js       # /auth/* — magic links, session
│   │   │   └── story.js      # /stories/* — CRUD + Claude proxy
│   │   ├── db/
│   │   │   ├── client.js     # pg Pool
│   │   │   └── schema.sql    # Table definitions
│   │   └── middleware/
│   │       └── auth.js       # JWT cookie verification
│   └── ...
└── docker-compose.yml
```

---

## Deploying to Railway

### First time setup

1. Push your repo to GitHub

2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub repo

3. Add a **PostgreSQL** plugin to your project (Railway provisions it automatically)

4. Create **two services** from your repo — one for frontend, one for backend:

   **Backend service**
   - Root directory: `backend`
   - Builder: Dockerfile using `backend/Dockerfile`
   - Create public networking URL
   - Environment variables (set in Railway dashboard): (see below)

   **Frontend service**
   - Root directory: `frontend`
   - Builder: Dockerfile using `frontend/Dockerfile`
   - Create public networking URL
   - Environment variables (set in Railway dashboard): (see below)

5. Railway will give you auto-generated URLs like `meridian-backend-production.up.railway.app`

### Database migrations

Railway runs your schema automatically on first deploy via the Docker entrypoint.
For subsequent schema changes, connect directly:

```bash
# Install Railway CLI
npm install -g @railway/cli
railway login
railway connect Postgres
# Then run your SQL
```

### Adding a custom domain (later)

When you're ready, go to your service in Railway → Settings → Custom Domain.
Update your DNS to point to Railway's provided CNAME. Railway handles SSL automatically.

---

## Environment Variables Reference

| Variable            | Where    | Description                                   |
| ------------------- | -------- | --------------------------------------------- |
| `ANTHROPIC_API_KEY` | backend  | Your Anthropic API key                        |
| `RESEND_API_KEY`    | backend  | Your Resend API key                           |
| `RESEND_FROM_EMAIL` | backend  | Sending address (must be verified in Resend)  |
| `JWT_SECRET`        | backend  | Long random string for signing session tokens |
| `DATABASE_URL`      | backend  | PostgreSQL connection string                  |
| `FRONTEND_URL`      | backend  | Full URL of frontend (for CORS + email links) |
| `NODE_ENV`          | backend  | `development` or `production`                 |
| `VITE_API_URL`      | frontend | Full URL of backend API                       |
| `API_URL`           | backend  | Full URL of backend API                       |

---

## Adding OAuth Later

When you're ready to add Google/GitHub login, the auth flow slots in cleanly:

1. Add `passport` + the relevant strategy to the backend
2. New routes: `GET /auth/google` → redirect, `GET /auth/google/callback` → issue session cookie
3. Add a "Continue with Google" button to `Login.jsx`

The session cookie and `requireAuth` middleware stay the same — OAuth just becomes another way to get one.
