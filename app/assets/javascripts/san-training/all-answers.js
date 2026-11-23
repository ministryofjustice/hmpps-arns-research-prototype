import { getSanSession, getSanVariant } from './session.js'
import { historicalSession } from './historical-sessions.js'
import {
  renderSectionSummary as renderCommunityAccommodation,
  sectionQuestionsComplete as communityAccommodationComplete
} from './community/accommodation.js'
import {
  renderSectionSummary as renderPrisonAccommodation,
  sectionQuestionsComplete as prisonAccommodationComplete
} from './prison/accommodation.js'
import {
  renderSectionSummary as renderCommunityEmployment,
  sectionQuestionsComplete as communityEmploymentComplete
} from './community/employment.js'
import {
  renderSectionSummary as renderPrisonEmployment,
  sectionQuestionsComplete as prisonEmploymentComplete
} from './prison/employment.js'
import {
  renderSectionSummary as renderCommunityFinances,
  sectionQuestionsComplete as communityFinancesComplete
} from './community/finances.js'
import {
  renderSectionSummary as renderPrisonFinances,
  sectionQuestionsComplete as prisonFinancesComplete
} from './prison/finances.js'
import {
  renderSectionSummary as renderCommunityDrugs,
  sectionQuestionsComplete as communityDrugsComplete
} from './community/drugs.js'
import {
  renderSectionSummary as renderPrisonDrugs,
  sectionQuestionsComplete as prisonDrugsComplete
} from './prison/drugs.js'
import {
  renderSectionSummary as renderCommunityAlcohol,
  sectionQuestionsComplete as communityAlcoholComplete
} from './community/alcohol.js'
import {
  renderSectionSummary as renderPrisonAlcohol,
  sectionQuestionsComplete as prisonAlcoholComplete
} from './prison/alcohol.js'
import {
  renderSectionSummary as renderCommunityHealth,
  sectionQuestionsComplete as communityHealthComplete
} from './community/health.js'
import {
  renderSectionSummary as renderPrisonHealth,
  sectionQuestionsComplete as prisonHealthComplete
} from './prison/health.js'
import {
  renderSectionSummary as renderCommunityRelationships,
  sectionQuestionsComplete as communityRelationshipsComplete
} from './community/relationships.js'
import {
  renderSectionSummary as renderPrisonRelationships,
  sectionQuestionsComplete as prisonRelationshipsComplete
} from './prison/relationships.js'
import {
  renderSectionSummary as renderCommunityThinking,
  sectionQuestionsComplete as communityThinkingComplete
} from './community/thinking.js'
import {
  renderSectionSummary as renderPrisonThinking,
  sectionQuestionsComplete as prisonThinkingComplete
} from './prison/thinking.js'
import {
  renderSectionSummary as renderCommunityOffence,
  sectionQuestionsComplete as communityOffenceComplete
} from './community/offence.js'
import {
  renderSectionSummary as renderPrisonOffence,
  sectionQuestionsComplete as prisonOffenceComplete
} from './prison/offence.js'

const analysisMounts = {
  accommodation: { attribute: 'data-san-analysis-summary', formId: 'san-accommodation-analysis-form' },
  employment: { attribute: 'data-ee-analysis-summary', formId: 'san-employment-analysis-form' },
  finances: { attribute: 'data-fi-analysis-summary', formId: 'san-finances-analysis-form' },
  drugs: { attribute: 'data-du-analysis-summary', formId: 'san-drugs-analysis-form' },
  alcohol: { attribute: 'data-al-analysis-summary', formId: 'san-alcohol-analysis-form' },
  health: { attribute: 'data-hw-analysis-summary', formId: 'san-health-analysis-form' },
  relationships: { attribute: 'data-san-analysis-summary', formId: 'san-relationships-analysis-form' },
  thinking: { attribute: 'data-tb-analysis-summary', formId: 'san-thinking-analysis-form' }
}

const communitySections = {
  accommodation: [renderCommunityAccommodation, communityAccommodationComplete],
  employment: [renderCommunityEmployment, communityEmploymentComplete],
  finances: [renderCommunityFinances, communityFinancesComplete],
  drugs: [renderCommunityDrugs, communityDrugsComplete],
  alcohol: [renderCommunityAlcohol, communityAlcoholComplete],
  health: [renderCommunityHealth, communityHealthComplete],
  relationships: [renderCommunityRelationships, communityRelationshipsComplete],
  thinking: [renderCommunityThinking, communityThinkingComplete],
  offence: [renderCommunityOffence, communityOffenceComplete]
}

const prisonSections = {
  accommodation: [renderPrisonAccommodation, prisonAccommodationComplete],
  employment: [renderPrisonEmployment, prisonEmploymentComplete],
  finances: [renderPrisonFinances, prisonFinancesComplete],
  drugs: [renderPrisonDrugs, prisonDrugsComplete],
  alcohol: [renderPrisonAlcohol, prisonAlcoholComplete],
  health: [renderPrisonHealth, prisonHealthComplete],
  relationships: [renderPrisonRelationships, prisonRelationshipsComplete],
  thinking: [renderPrisonThinking, prisonThinkingComplete],
  offence: [renderPrisonOffence, prisonOffenceComplete]
}

const completeKeys = {
  accommodation: 'accommodationComplete',
  employment: 'employmentComplete',
  finances: 'financeComplete',
  drugs: 'drugComplete',
  alcohol: 'alcoholComplete',
  health: 'healthComplete',
  relationships: 'relationshipsComplete',
  thinking: 'thinkingComplete',
  offence: 'offenceComplete'
}

const summaryPages = {
  accommodation: 'accommodation-summary.html',
  employment: 'employment-summary.html',
  finances: 'finances-summary.html',
  drugs: 'drugs-summary.html',
  alcohol: 'alcohol-summary.html',
  health: 'health-summary.html',
  relationships: 'personal-relationships-summary.html',
  thinking: 'thinking-behaviours-summary.html',
  offence: 'offence-analysis-summary.html'
}

const renderSection = (element, sectionKey, session, renderSummary, questionsComplete) => {
  const status = element.querySelector('[data-all-answers-status]')
  const answers = element.querySelector('[data-all-answers-content]')
  const mount = element.querySelector('[data-all-answers-mount]')
  if (!status || !answers || !mount) return

  const markedComplete = !!session[completeKeys[sectionKey]]
  status.textContent = markedComplete ? 'Complete' : 'Incomplete'
  status.classList.toggle('govuk-tag--light-blue', markedComplete)
  status.classList.toggle('govuk-tag--light-grey', !markedComplete)

  if (!questionsComplete(session)) return

  const analysis = analysisMounts[sectionKey]
  let temporaryAnalysis
  let temporaryForm
  if (analysis) {
    temporaryAnalysis = document.createElement('div')
    temporaryAnalysis.setAttribute(analysis.attribute, '')
    temporaryAnalysis.hidden = true
    temporaryForm = document.createElement('form')
    temporaryForm.id = analysis.formId
    temporaryAnalysis.append(temporaryForm)
    document.body.append(temporaryAnalysis)
  }

  const renderingSession = { ...session, [completeKeys[sectionKey]]: true }
  renderSummary(renderingSession, mount)

  if (temporaryAnalysis && temporaryAnalysis.innerHTML && temporaryAnalysis.querySelector('.govuk-summary-list')) {
    const analysisHtml = temporaryAnalysis.querySelector('.govuk-summary-list').outerHTML
    mount.insertAdjacentHTML('beforeend', `<h3 class="govuk-heading-m">Practitioner analysis</h3>${analysisHtml}`)
  }
  temporaryAnalysis?.remove()
  answers.hidden = false
}

const initAllAnswers = () => {
  const page = document.querySelector('[data-san-all-answers]')
  if (!page) {
    document.querySelectorAll('[data-san-view-all-answers]').forEach((link) => {
      const url = new URL(link.href, window.location.origin)
      url.searchParams.set('returnTo', `${window.location.pathname}${window.location.search}${window.location.hash}`)
      link.setAttribute('href', `${url.pathname}?${url.searchParams}`)
    })
    document.querySelectorAll('[data-san-view-previous-versions]').forEach((link) => {
      const url = new URL(link.href, window.location.origin)
      url.searchParams.set('returnTo', `${window.location.pathname}${window.location.search}${window.location.hash}`)
      link.setAttribute('href', `${url.pathname}?${url.searchParams}`)
    })
    const previousPage = document.querySelector('[data-san-previous-versions]')
    const returnTo = new URLSearchParams(window.location.search).get('returnTo')
    const previousBack = previousPage?.closest('.assessment-layout')?.querySelector('.assessment-layout__back-link')
    if (previousBack && returnTo) previousBack.setAttribute('href', returnTo)
    return
  }

  const historyVersion = page.closest('[data-san-history-version]')?.getAttribute('data-san-history-version')
  const variant = getSanVariant()
  const session = historyVersion ? historicalSession(variant, historyVersion) : getSanSession()
  const sections = variant === 'prison' ? prisonSections : communitySections
  const params = new URLSearchParams(window.location.search)
  const sourceSection = params.get('section')
  const source = params.get('returnTo')
  const backLink = document.querySelector('.assessment-layout__back-link')
  const sourceState = sections[sourceSection]
  if (backLink && sourceState && !historyVersion) {
    backLink.setAttribute('href', sourceState[1](session) ? summaryPages[sourceSection] : (source || backLink.getAttribute('href')))
  }

  page.querySelectorAll('[data-all-answers-section]').forEach((element) => {
    const sectionKey = element.getAttribute('data-all-answers-section')
    const section = sections[sectionKey]
    if (!section) return
    renderSection(element, sectionKey, session, section[0], section[1])
  })
}

window.GOVUKPrototypeKit.documentReady(initAllAnswers)
