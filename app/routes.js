//
// For guidance on how to create routes see:
// https://prototype-kit.service.gov.uk/docs/create-routes
//

const fs = require('fs')
const path = require('path')

const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

const offencesDataPath = path.join(__dirname, 'data', 'offences.json')
const offenceBrowseCategoriesPath = path.join(__dirname, 'data', 'offence-browse-categories.json')
const offenceBrowseCategories = JSON.parse(
  fs.readFileSync(offenceBrowseCategoriesPath, 'utf8')
)

router.use((req, res, next) => {
  res.locals.offenceBrowseCategories = offenceBrowseCategories
  if (req.path.startsWith('/02') || req.path.startsWith('/dev')) {
    res.locals.tieringSectionCaption = 'Predictors'
    res.locals.useReoffendingServiceNavigation = true
    res.locals.hideOffenderViewAnswers = true
  }
  next()
})

router.get('/api/offences', (req, res) => {
  fs.readFile(offencesDataPath, 'utf8', (error, data) => {
    if (error) {
      res.status(500).json({ error: 'Could not load offences data' })
      return
    }
    res.type('application/json').send(data)
  })
})

module.exports = router
