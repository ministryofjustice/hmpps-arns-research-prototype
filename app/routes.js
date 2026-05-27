//
// For guidance on how to create routes see:
// https://prototype-kit.service.gov.uk/docs/create-routes
//

const fs = require('fs')
const path = require('path')

const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

const offencesDataPath = path.join(__dirname, 'data', 'offences.json')

router.get('/api/offences', (req, res) => {
  fs.readFile(offencesDataPath, 'utf8', (error, data) => {
    if (error) {
      res.status(500).json({ error: 'Could not load offences data' })
      return
    }
    res.type('application/json').send(data)
  })
})
