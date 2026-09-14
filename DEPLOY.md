# Deploying MeridianOne to Vercel

This app is a **React frontend + FastAPI backend + MongoDB**. On Vercel both the
frontend and the backend run inside **one project on one domain**:

- Everything under `/api/*` is served by the FastAPI backend (a serverless function).
- Everything else is served by the React build (static CDN).

Because the frontend calls the API **same-origin** (`/api/...`), there is no CORS
setup and no per-environment URL editing.

> ⚠️ **Hard requirement:** the MongoDB that runs inside the Emergent preview
> environment **cannot** be used from Vercel. You must create a hosted database
> (MongoDB Atlas — the free tier is enough) and give Vercel its connection string.

---

## 1. Create a MongoDB Atlas cluster

1. Go to <https://www.mongodb.com/cloud/atlas/register> and sign in / sign up.
2. **Create a free cluster** (M0). Pick any cloud/region close to your Vercel region.
3. **Database Access** → *Add New Database User* → create a username + password
   (Password auth). Save the password.
4. **Network Access** → *Add IP Address* → **Allow access from anywhere**
   (`0.0.0.0/0`). Serverless functions use dynamic IPs, so this is required.
5. **Clusters → Connect → Drivers** → copy the **connection string (SRV)**. It looks like:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   Replace `<user>` and `<password>` with the credentials from step 3.
6. Decide a **database name**, e.g. `meridianone`.

---

## 2. Push this project to Git

Commit the whole project (the folder that contains `frontend/`, `backend/`,
`api/`, and `vercel.json`) to a GitHub / GitLab / Bitbucket repository.

Files that make Vercel work (already included):

| File | Purpose |
| --- | --- |
| `vercel.json` | Builds the React app + Python function and routes `/api/*` to the backend. |
| `api/index.py` | Serverless entrypoint — re-exports the FastAPI `app` from `backend/server.py`. |
| `api/requirements.txt` | **Slim runtime-only** Python deps (fastapi, motor, pymongo, pydantic, dotenv). |
| `.vercelignore` | Keeps tests / dev-only deps / the heavy `backend/requirements.txt` out of the build. |

> The full `backend/requirements.txt` (pandas, numpy, boto3, linters, etc.) is only
> for local development. The serverless function uses `api/requirements.txt` so it
> stays small and within Vercel's function size limit. **No app feature is affected.**

---

## 3. Import the repo into Vercel

1. Go to <https://vercel.com/new> and **Import** your Git repository.
2. **Framework Preset:** leave as **Other** (the included `vercel.json` drives the build).
3. **Root Directory:** keep the repository root (the folder with `vercel.json`).
4. Do **not** override the Build/Output settings — `vercel.json` handles them.

---

## 4. Set environment variables

In the Vercel import screen (or later under **Project → Settings → Environment
Variables**), add these for **Production** (and Preview if you use it):

| Name | Value | Notes |
| --- | --- | --- |
| `MONGO_URL` | your Atlas SRV string from step 1.5 | Include the user/password. |
| `DB_NAME` | `meridianone` (or your chosen name) | Must not be empty. |
| `CORS_ORIGINS` | `https://<your-project>.vercel.app` | Locks CORS to your domain. Same-origin calls don't need it, but set it for safety. Update after you know the final domain. |

Do **not** set `REACT_APP_BACKEND_URL` — leaving it unset makes the frontend call
the API same-origin, which is exactly what you want on Vercel.

---

## 5. Deploy

Click **Deploy**. Vercel will:

1. Run `yarn build` in `frontend/` and publish `frontend/build` to the CDN.
2. Install `api/requirements.txt` and deploy `api/index.py` as a Python function.
3. Wire `/api/*` → the function and everything else → the React app.

Every future `git push` to the production branch redeploys automatically.

---

## 6. Verify

Open your deployment URL, then check:

1. **Frontend loads** — the "What would you like to create?" screen appears.
2. **Backend + DB reachable** — visit `https://<your-domain>/api/metadata`.
   You should get JSON with `countries`, `industries`, `statuses`, `levels`.
3. **Sample data seeds itself** — on the **first** backend request against an empty
   Atlas database, the app auto-seeds 19 demo records (5 L1, 6 L2, 4 L3, 4 L4).
   In the app: Step 1 → pick a level → Next → **Load all sample records**. You should
   see the populated table.
4. **Salesforce package downloads** — click **SF Package** in the header, or visit
   `https://<your-domain>/api/scaffold/download`. A `.zip` downloads.

### Notes / trade-offs on serverless
- **Cold start:** the first request after a period of inactivity takes ~1–2s while
  the function wakes; steady-state requests are fast.
- **Seeding fallback:** seeding happens automatically on first use. If you ever want
  to reset, drop the `accounts` collection in Atlas and hit `/api/metadata` again.
- **Request duration:** capped at 60s (see `vercel.json` → `functions`) — far more
  than this app's simple queries need.

---

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `/api/metadata` returns 500 | `MONGO_URL` / `DB_NAME` missing or wrong, or Atlas Network Access doesn't allow `0.0.0.0/0`. |
| API times out / can't connect to Mongo | Atlas IP allowlist not set to `0.0.0.0/0`, or wrong password in the SRV string. |
| Frontend loads but every API call 404s | Ensure `vercel.json` is at the repo root and the repo Root Directory in Vercel is that same folder. |
| Python build too large | Confirm the function is using `api/requirements.txt` (slim) and that `.vercelignore` excludes `backend/requirements.txt`. |

---

## Alternative shape (only if you need an always-on backend)

If you specifically need a backend that never cold-starts, deploy **only the
frontend** to Vercel and host `backend/` on an always-on container platform. In
that case set `REACT_APP_BACKEND_URL` in Vercel to the external backend URL and set
`CORS_ORIGINS` on the backend to your Vercel domain. This adds moving parts and
reintroduces cross-origin config, so the single-project setup above is recommended.
