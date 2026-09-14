# Packaging this app for Vercel

## Objective
Make the MeridianOne prototype (React frontend + FastAPI backend + MongoDB) deployable on Vercel from a Git repo, and provide a written step‑by‑step deploy guide. No app features change.

## What Vercel can and cannot host here
- **Frontend (React):** native fit. Vercel builds it and serves it on a global CDN.
- **Backend (FastAPI):** Vercel now runs FastAPI natively, but as a **serverless function** — it wakes on request and does not stay running between requests.
- **Database:** the current MongoDB runs locally inside this environment and **cannot go to Vercel**. A hosted database is required.

## What the user must provide (hard dependency)
- A **MongoDB Atlas** cluster (free tier is enough) with:
  - a connection string (SRV URI), and
  - a database name.
- A Git repository (GitHub/GitLab/Bitbucket) connected to a Vercel account.

Without a hosted database connection string, the app cannot run on Vercel.

## Proposed deployment shape
**One Vercel project containing both the frontend and the backend** (Vercel "Services"), with all `/api/*` traffic routed to the backend and everything else to the frontend, served under **one domain**.

Why this shape:
- The project already splits into `frontend/` and `backend/`, and every backend route is already under `/api` — this maps onto Vercel almost as‑is.
- Same domain means **no CORS setup and no cross‑site URL juggling**; the frontend simply calls `/api/...`.

**Alternative (worth challenging if preferred):** deploy only the frontend to Vercel and host the backend elsewhere (e.g. a container host that keeps the server always‑on). Choose this if always‑on backend behavior or avoiding serverless limits matters more than a single Vercel project. This is more moving parts and reintroduces cross‑origin config.

## Behavior and trade‑offs on Vercel serverless (decisions worth knowing)
- **Cold starts:** the first request after idle is slower (roughly a second or two) while the function wakes. Steady‑state requests are fast.
- **Sample data seeding:** the demo records are seeded automatically the first time the backend sees an empty database, so a freshly connected Atlas database fills itself on first use. (A one‑time seed step can be documented as a fallback.)
- **Request limits:** serverless requests have a max duration (configurable, default around 60s) — fine for this app's simple queries.
- **Function size:** the backend's current dependency list includes heavy/dev‑only packages (data‑science and tooling libraries) that are not needed at runtime. A **slimmer runtime dependency set** will be used for the Vercel build so it stays within serverless size limits. No feature is affected.

## Configuration decisions (recorded, not asked)
- Frontend will call the API **same‑origin** (`/api/...`) so it works on any Vercel domain without editing URLs per environment.
- Backend allowed‑origins will be **locked to the deployed domain** instead of the current wildcard.
- Secrets (database URI, database name) are set as **Vercel environment variables**, not committed to the repo.

## What stays the same
- All app functionality: the 4‑step flow, search, datatable filtering, preview/launch, L1/L2 creation, hierarchy tree, and the downloadable Salesforce package.

## Deliverable
1. Vercel configuration added to the repo so a Git import "just works".
2. A runtime‑only backend dependency set for the serverless function.
3. A **`DEPLOY.md`** guide covering: creating the Atlas cluster, getting the connection string, importing the repo into Vercel, setting the environment variables, deploying, and verifying (including how the sample data appears).

## Assumptions
- MongoDB Atlas is the hosted database (free tier acceptable).
- Single‑project (frontend + backend on one Vercel domain) is the default; will switch to frontend‑only + external backend if requested.
- This remains a demo/prototype (no authentication, sample data is public).

## Open decision for the user
- Confirm the **single‑project on Vercel** shape, or ask for **frontend‑only on Vercel with the backend hosted elsewhere**.

> Note: This platform also offers its own one‑click deployment as an alternative to Vercel. This plan proceeds with Vercel because that was requested.
