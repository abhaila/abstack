---
name: abstack:verify
description: Verify that a code change actually works in the running stack. Use after making changes to confirm the feature behaves correctly end-to-end. Covers Postgres (Docker), Kotlin backend (Gradle), and React frontend. Use aggressively any time you touch relevant code.
---

# Verify Skill

Verify that the change works in the real running stack, not just in tests.

## Stack

- **DB**: Postgres via Docker Compose
- **Backend**: Kotlin via Gradle (`./gradlew`)
- **Frontend**: React dev server

## Steps

### 1. Run it

Start whatever layers are affected by the change:

- **DB only**: `docker compose up -d db` (or equivalent service name in this project's `docker-compose.yml`)
- **Backend**: `./gradlew run` (or the project-specific task — check `build.gradle.kts` if unsure)
- **Frontend**: `npm run dev` / `pnpm run dev` (check `package.json`)

If all three are needed, start them in dependency order: DB → backend → frontend.

Wait for each layer to be ready before proceeding:
- DB: `docker compose ps` shows healthy
- Backend: health endpoint responds (typically `GET /health` or `GET /api/health`) — poll with `curl -s localhost:<port>/health`
- Frontend: dev server prints "ready" or `curl -s localhost:<port>` returns non-error

### 2. Drive it

**Backend changes**: `curl` the affected route(s) directly. Include auth headers if needed (use a seed token or dummy auth).

**Frontend changes**: Use the `gstack` skill to open the page in a browser, interact with the feature, and take before/after screenshots.

**Both changed**: curl the backend first to confirm the API response shape, then drive the frontend.

### 3. Prove it

- **Did data land?** Query the DB directly:
  ```
  docker compose exec db psql -U <user> -d <dbname> -c "SELECT data FROM <table> ORDER BY created_at DESC LIMIT 5;"
  ```
- **Did the path run?** Grep backend logs for key log lines covering the changed code path.
- **Does the UI reflect it?** Screenshot the relevant UI state after the action.

### 4. Unblock it

If you hit a blocker:

| Blocker | Fix |
|---|---|
| Auth required | Check for a dev/seed token in `.env.local` or project docs; or temporarily use dummy auth if the project supports it |
| No seed data | Run any seed script in the project (look for `seed`, `fixtures`, or `testdata` in scripts/db dirs) |
| Port conflict | Check `docker-compose.yml` and `.env` for port config |
| Backend won't start | Run `./gradlew build` first to surface compile errors |
| Missing env vars | Check `.env.example` and copy to `.env.local` |

## Self-Improvement

If you hit a blocker not covered above, **fix it and then update this skill** with the solution so future runs don't get stuck. Add it to the Unblock table or add a new section. Keep the skill lean — one concrete tip per blocker.

## What counts as verified

- The changed code path ran (confirmed via logs or DB query)
- The observable behaviour matches the intention (UI screenshot or curl response)
- No regressions in adjacent features you can quickly eyeball
