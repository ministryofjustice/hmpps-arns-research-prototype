//
// For guidance on how to create routes see:
// https://prototype-kit.service.gov.uk/docs/create-routes
//

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

const offencesDataPath = path.join(__dirname, 'data', 'offences.json')
const offenceBrowseCategoriesPath = path.join(__dirname, 'data', 'offence-browse-categories.json')
const offenceBrowseCategories = JSON.parse(
  fs.readFileSync(offenceBrowseCategoriesPath, 'utf8')
)

const formatLongUkDate = (date) =>
  date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

/** Date of the latest commit on origin/main (last merge/push to main). */
const getUxHandoverLastUpdatedLabel = () => {
  const repoRoot = path.join(__dirname, '..')
  const refs = ['origin/main', 'main']

  for (const ref of refs) {
    try {
      const gitTimestamp = execSync(`git log -1 --format=%ct ${ref}`, {
        cwd: repoRoot,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore']
      }).trim()
      if (gitTimestamp) {
        return formatLongUkDate(new Date(parseInt(gitTimestamp, 10) * 1000))
      }
    } catch (error) {
      // Try the next ref.
    }
  }

  return formatLongUkDate(new Date())
}

/** Alex's date of birth – keep in sync with assessment offender header / JS session helpers */
const OFFENDER_DATE_OF_BIRTH = { day: 2, month: 10, year: 1969 }
const DEFAULT_FIRST_SANCTION_DATE = { day: '15', month: '5', year: '2012' }

const normaliseDatePart = (value) => String(value == null ? '' : value).trim()

const isValidDateParts = (parts) => {
  const day = parseInt(parts.day, 10)
  const month = parseInt(parts.month, 10)
  const year = parseInt(parts.year, 10)

  if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) return false
  if (month < 1 || month > 12 || day < 1 || year < 1000) return false

  const parsed = new Date(year, month - 1, day)
  return (
    parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day
  )
}

const calculateAgeOnDate = (dateOfBirth, targetDate) => {
  if (!isValidDateParts(dateOfBirth) || !isValidDateParts(targetDate)) return null

  const dob = new Date(dateOfBirth.year, dateOfBirth.month - 1, dateOfBirth.day)
  const target = new Date(
    parseInt(targetDate.year, 10),
    parseInt(targetDate.month, 10) - 1,
    parseInt(targetDate.day, 10)
  )

  let age = target.getFullYear() - dob.getFullYear()
  const birthdayNotYetThisYear =
    target.getMonth() < dob.getMonth() ||
    (target.getMonth() === dob.getMonth() && target.getDate() < dob.getDate())

  if (birthdayNotYetThisYear) age -= 1
  return age >= 0 ? age : null
}

const getFirstSanctionAgeLocals = (query = {}) => {
  const submittedDay = normaliseDatePart(query.first_sanction_date_day)
  const submittedMonth = normaliseDatePart(query.first_sanction_date_month)
  const submittedYear = normaliseDatePart(query.first_sanction_date_year)
  const hasSubmittedDate = Boolean(submittedDay || submittedMonth || submittedYear || query.calculateAge)

  const dateParts = {
    day: submittedDay || (hasSubmittedDate ? '' : DEFAULT_FIRST_SANCTION_DATE.day),
    month: submittedMonth || (hasSubmittedDate ? '' : DEFAULT_FIRST_SANCTION_DATE.month),
    year: submittedYear || (hasSubmittedDate ? '' : DEFAULT_FIRST_SANCTION_DATE.year)
  }

  let firstSanctionCalculatedAge = null
  if (query.calculateAge) {
    firstSanctionCalculatedAge = calculateAgeOnDate(OFFENDER_DATE_OF_BIRTH, dateParts)
  }

  return {
    firstSanctionDateDay: dateParts.day,
    firstSanctionDateMonth: dateParts.month,
    firstSanctionDateYear: dateParts.year,
    firstSanctionCalculatedAge
  }
}

router.use((req, res, next) => {
  res.locals.offenceBrowseCategories = offenceBrowseCategories
  if (req.path.startsWith('/02') || req.path.startsWith('/03') || req.path.startsWith('/dev')) {
    res.locals.predictorsSectionCaption = 'Reoffending predictors'
    res.locals.useReoffendingServiceNavigation = true
    res.locals.hideOffenderViewAnswers = true
  }
  if (/^\/dev\/ux-handover(\.html)?$/.test(req.path)) {
    res.locals.uxHandoverLastUpdated = getUxHandoverLastUpdatedLabel()
  }
  if (/^\/(01|02|03|dev)\/a2(b)?(\.html)?$/.test(req.path)) {
    Object.assign(res.locals, getFirstSanctionAgeLocals(req.query))
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
