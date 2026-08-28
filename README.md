# Tiering assessment prototype

Prototype for the **Tiering assessment** (service name in the header: **ARNS**).

## Requirements

- Node.js 24 (see `.nvmrc`)

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Prototype structure

Add pages under `app/views/`. Organise journeys by version folder:

- `app/views/01/` – version 01 pages (served at `/01/…`)
- `app/views/02/` – version 02 pages (served at `/02/…`)
- `app/views/03/` – version 03 pages (served at `/03/…`)
- `app/views/includes/` – shared HTML partials (fork into version-specific includes only when a version diverges)

Each version has its own JavaScript under `app/assets/javascripts/02/` and `app/assets/javascripts/03/` (version 01 scripts stay at `app/assets/javascripts/tiering-*.js`). Shared utilities (`offences-data.js`, `conviction-date.js`, etc.) live at the javascripts root and are imported by each version.

## Deploy

Hosted on MoJ Cloud Platform. Pushes to `main` trigger the CD workflow in `.github/workflows/cd-main.yaml`.
