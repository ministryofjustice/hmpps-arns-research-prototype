//
// For guidance on how to create routes see:
// https://prototype-kit.service.gov.uk/docs/create-routes
//

const fs = require('fs')
const path = require('path')

const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

const offencesDataPath = path.join(__dirname, 'data', 'offences.json')
const telemetryLogPath = path.join(__dirname, 'data', 'telemetry-log.jsonl')

router.get('/api/offences', (req, res) => {
  fs.readFile(offencesDataPath, 'utf8', (error, data) => {
    if (error) {
      res.status(500).json({ error: 'Could not load offences data' })
      return
    }
    res.type('application/json').send(data)
  })
})

const appendTelemetryLine = (obj) => {
  const line = JSON.stringify(obj)
  fs.appendFileSync(telemetryLogPath, `${line}\n`, 'utf8')
}

// Persist a session event (calculate score / section complete)
router.post('/api/telemetry/event', async (req, res) => {
  const body = req.body || {}
  const sessionId = String(body.sessionId || '').trim()
  const type = String(body.type || '').trim() // completed | sectionComplete | notRecorded

  if (!sessionId || !type) {
    res.status(400).json({ error: 'Missing sessionId or type' })
    return
  }

  try {
    appendTelemetryLine({
      sessionId,
      type,
      at: new Date().toISOString(),
      consent: body.consent === 'declined' ? 'declined' : body.consent === 'agreed' ? 'agreed' : null,
      usabilityScore: typeof body.usabilityScore === 'number' ? body.usabilityScore : null,
      bandTitle: body.bandTitle ? String(body.bandTitle) : null,
      results: body.results || null,
      ip: req.ip
    })
    res.json({ ok: true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to write telemetry log' })
  }
})

const readTelemetryLines = () => {
  const raw = fs.existsSync(telemetryLogPath) ? fs.readFileSync(telemetryLogPath, 'utf8') : ''
  return raw
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line)
      } catch (e) {
        return null
      }
    })
    .filter(Boolean)
}

// Session history for session-results page
router.get('/api/telemetry/history', (req, res) => {
  try {
    const events = readTelemetryLines()
    const sessions = new Map()
    const deletedSessionIds = new Set()

    events.forEach((event) => {
      const id = event.sessionId
      if (!id) return

      if (event.type === 'deleted') {
        deletedSessionIds.add(id)
        return
      }

      const existing = sessions.get(id) || {
        sessionId: id,
        createdAt: null,
        consent: event.consent || null,
        completedAt: null,
        sectionCompleteAt: null,
        usabilityScore: null,
        bandTitle: null,
        results: null
      }

      existing.consent = event.consent || existing.consent
      existing.createdAt = existing.createdAt || event.at

      if (event.type === 'completed') {
        existing.completedAt = event.at
        existing.usabilityScore =
          typeof event.usabilityScore === 'number' ? event.usabilityScore : existing.usabilityScore
        existing.bandTitle = event.bandTitle || existing.bandTitle
        existing.results = event.results || existing.results
      }

      if (event.type === 'sectionComplete') {
        existing.sectionCompleteAt = event.at
      }

      sessions.set(id, existing)
    })

    // Ignore unfinished sessions (must have completedAt)
    const list = [...sessions.values()].filter((s) => Boolean(s.completedAt) && !deletedSessionIds.has(s.sessionId))

    list.sort((a, b) => String(b.completedAt).localeCompare(String(a.completedAt)))

    res.json({ sessions: list.slice(0, 50) })
  } catch (e) {
    res.status(500).json({ error: 'Failed to read telemetry history' })
  }
})

router.post('/api/telemetry/delete', async (req, res) => {
  const body = req.body || {}
  const sessionId = String(body.sessionId || '').trim()

  if (!sessionId) {
    res.status(400).json({ error: 'Missing sessionId' })
    return
  }

  try {
    appendTelemetryLine({
      sessionId,
      type: 'deleted',
      at: new Date().toISOString()
    })
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete session' })
  }
})

// Share session results via email (requires local sendmail available)
module.exports = router
