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
- `app/views/includes/` – shared HTML partials (fork into version-specific includes only when a version diverges)

Each version has its own JavaScript under `app/assets/javascripts/02/` (version 01 scripts stay at `app/assets/javascripts/tiering-*.js`). Shared utilities (`offences-data.js`, `conviction-date.js`, etc.) live at the javascripts root and are imported by both versions.

## SAN Prison accommodation journey

The `/san-prison/` journey stores its answers separately from the other prototypes.

- Settled accommodation asks whether the person plans to return after release. Yes
  continues to location suitability; No and Unknown ask about release accommodation plans.
- Temporary accommodation has a separate type screen, retaining optional expected end
  dates. Approved premises, CAS2, CAS3 and Unknown go to release plans. Immigration
  and short term accommodation ask whether the person plans to return.
- Release plans of Yes require details, then ask who the person plans to live with
  before suitability. No skips suitability and goes to the changes question.
- No accommodation retains the existing reasons and changes questions.
- Suitability concerns, summaries and practitioner analysis continue as before.

With the prototype running and Playwright available (as for the storyboard scripts),
run `node --test scripts/test-san-prison-accommodation.mjs` to check this journey.

## SAN training copies

Training is a separate snapshot of the current Community and Prison prototypes:

- Community entry: `/san#community-training`
- Prison entry: `/san#prison-training`
- Pages and local includes: `app/views/san-training/community/` and `app/views/san-training/prison/`
- Section scripts: `app/assets/javascripts/san-training/community/` and `app/assets/javascripts/san-training/prison/`
- Answers use `sanTrainingCommunityAssessment` and `sanTrainingPrisonAssessment` in session storage.

Each Training Start button clears only its own training answers and drafts. It does
not call the shared server-side clear-data endpoint. The original `/san/`,
`/san-research/` and `/san-prison/` journeys keep their own code and storage.
Shared GOV.UK/MOJ components and application styling remain common foundations.
Make training changes inside the training folders, not the research folders.

Open `storyboards/san-training/index.html` for the training storyboards. Community's
existing detailed snapshots and images are copied into this folder. Both variants
also have fresh section-overview captures. Regenerate those overview captures with
`node scripts/capture-san-training.mjs`; this writes only inside `storyboards/san-training/`.

With the prototype running and Playwright installed, run
`node --test scripts/test-san-training.mjs` for training, deep-link and isolation checks.
Both scripts accept `BASE_URL` (default `http://localhost:3000`).

## Deploy

Hosted on MoJ Cloud Platform. Pushes to `main` trigger the CD workflow in `.github/workflows/cd-main.yaml`.
