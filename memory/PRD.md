# PRD — Commercial Banking Account / Relationship Creation Flow (SLDS 2 Prototype)

## Original Problem Statement
Build a Salesforce-style account creation Screen Flow for a commercial bank using (conceptually) Screen Flow + LWC. Delivered as a live **web prototype** (React + FastAPI + MongoDB) that demonstrates the UX. Four relationship levels:
- **L1** Primary Relationship (ultimate parent / global holding)
- **L2** Intermediate Relationship (regional/sub-holding group)
- **L3** Legal Entity
- **L4** Financial Account

Agents must: (1) pick a level to create → (2) search/validate against existing records via 5 filters → (3) review a filterable results datatable spanning all levels with differing columns + per-row preview → (4) launch an existing record (read-only) OR create a new L1/L2 via a validated form.

## User Choices
- Deliverable: fully working clickable web prototype.
- 5 search fields: Name (text), Relationship ID (text), Country/Region (picklist), Industry (picklist), Status (picklist).
- Launch → read-only detail view.
- Seed rich mock commercial-banking data (L1–L4).
- Only L1 & L2 creatable.
- SLDS 2 aesthetic.

## Architecture
- **Backend** `/app/backend/server.py` — FastAPI + Motor/MongoDB. Auto-seeds 19 records on startup. Endpoints: `GET /api/metadata`, `GET /api/accounts` (filterable), `GET /api/accounts/{id}`, `POST /api/accounts` (L1/L2 only, 400 otherwise).
- **Frontend** `/app/frontend/src/components/flow/*` — orchestrated by `AccountFlow.jsx` (4-step state machine). Components: GlobalHeader, PathHeader, StepLevelSelect, StepSearch, DataTable (client-side global + per-column filter, sort, pagination — DataTables.net-style in-browser filtering), StepResults, PreviewDrawer, LaunchView, StepCreateForm. Config in `lib/levelConfig.js`, API in `lib/api.js`.
- Light/dark theme toggle; SLDS 2 palette, Archivo/Public Sans/JetBrains Mono fonts.

## User Personas
- **Relationship Manager / Onboarding agent** — creates and validates enterprise relationships, checks for duplicates before creating.

## Core Requirements (static)
- 4-level hierarchy with per-level dynamic columns and detail sections.
- Duplicate-check search before creation.
- In-browser re-filterable results table with preview + launch.
- Validated dynamic create form for L1/L2 only.

## Implemented (2026-06-14)
- Full 4-step Screen Flow with SLDS progress path.
- 5-filter search + server-side filtering, "load all sample records" preset.
- Client-side datatable: global search, per-column select/text filters, sortable headers, pagination, page-size, result count.
- Preview slide-over drawer + read-only launch view with success banner for new records.
- Dynamic L1/L2 create form with required + regex validation, completion meter, parent-relationship picklist for L2.
- Rich seed data (5×L1, 6×L2, 4×L3, 4×L4). Light/dark theme.
- Verified: backend 100% (12/12 pytest), frontend 100% e2e (testing agent iteration_1).

## Backlog
- **P1**: Hierarchy tree visualization on launch view (show L1→L4 rollup for the record).
- **P1**: Persist recently-viewed / "in-progress" drafts for the create form.
- **P2**: Export results table to CSV; column show/hide chooser.
- **P2**: Actual Salesforce LWC + flow metadata scaffolding as a downloadable reference.
- **P2**: Deprecated `@app.on_event` → FastAPI lifespan; tighten CORS.

## Next Tasks
- Await user feedback on the prototype; likely next: hierarchy tree view and/or CSV export.
