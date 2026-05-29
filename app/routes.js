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

// Share session results via email (requires local sendmail available)
module.exports = router
