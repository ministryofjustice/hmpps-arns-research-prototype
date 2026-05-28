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

Add pages under `app/views/`. Organise journeys by folder, for example `app/views/01/` for version 01.

## Deploy

Hosted on MoJ Cloud Platform. Pushes to `main` trigger the CD workflow in `.github/workflows/cd-main.yaml`.
