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

Prison training's drug last-used screen uses the question as its main heading.
"Add another drug" is hidden. Selecting Other on the drug selection page still
opens a name and last-used group; existing entries remain editable and saved.
The before-custody wording applies when use in custody is No; Yes retains the
last-six-months wording. Community training is unchanged.
Prison training's injection timing screen also uses a "Drug use" caption and
the question as its main heading, retaining the before-custody wording for No.

Community training's current drug-support screen uses "Drug use" as its main
heading, with the support and motivation questions as subheadings.

Both training variants ask about changes to thinking, behaviours and attitudes
on a separate page after the main questions and before the sexual-harm questions.

Open `storyboards/san-training/index.html` for the training storyboards, then choose
Community or Prison. Both use the research storyboard scenarios, captured directly
from their own training routes with synthetic answers. Right-click any screenshot
to copy its image into Miro, download its PNG, or drag the ordered PNGs from a
section's images folder onto the board.

Regenerate both journey storyboards with `node scripts/capture-san-training.mjs`.
To refresh only one section of one variant, use
`node scripts/capture-san-training.mjs --variant prison --section thinking`;
other sections keep their existing captures.
The generator checks the training route, loaded training modules and Beta banner
before every capture, and records each PNG's source URL and SHA-256 in
`captures.json` beside its storyboard. It never copies research or Community
screenshots into Prison, and writes only inside `storyboards/san-training/`.
Community's separate overview page has been removed.

Card titles use the visible page heading (not hidden questions) and selected tab.
Every scenario includes its completion flow: summary, practitioner analysis,
three answered questions and the completed state with the blue navigation tick.
The existing exceptions remain: no further financial assessment, no drug use and
never drunk alcohol show "Practitioner analysis not required"; offence analysis
completes directly without a practitioner-analysis tab. Completion is checked
immediately after submission and again after refresh. Community training now
updates the completed state immediately, matching Prison.

Relationship captures include the victim-details screen after answering Yes to
being a victim of domestic abuse; those details are entered on that screen rather
than pre-filled before the branch. Both training variants check this sequence and
the No-children/No-abuse route, which skips child details, perpetrator follow-ups
and victim details.

With the prototype running and Playwright installed, run
`node --test scripts/test-san-training.mjs` for training, deep-link and isolation checks.
Both scripts accept `BASE_URL` (default `http://localhost:3000`).

## Deploy

Hosted on MoJ Cloud Platform. Pushes to `main` trigger the CD workflow in `.github/workflows/cd-main.yaml`.
