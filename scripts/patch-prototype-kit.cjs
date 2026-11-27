const fs = require('fs')
const path = require('path')

const passwordTemplate = path.join(
  __dirname,
  '..',
  'node_modules',
  'govuk-prototype-kit',
  'lib',
  'nunjucks',
  'views',
  'manage-prototype',
  'password.njk'
)

if (!fs.existsSync(passwordTemplate)) {
  throw new Error('GOV.UK Prototype Kit password template was not found')
}

const marker = '{# Preserve the client-side fragment when returning from sign-in. #}'
const script = `${marker}
<script>
  (function () {
    var returnUrl = document.querySelector('input[name="returnURL"]')
    if (!returnUrl || !window.location.hash) return

    var fragment = window.location.hash
    if (!/^#[A-Za-z0-9_-]+$/.test(fragment)) return
    if (returnUrl.value.indexOf('#') === -1) {
      returnUrl.value += fragment
    }
  })()
</script>`

const template = fs.readFileSync(passwordTemplate, 'utf8')
if (template.includes(marker)) {
  const existingPatch = new RegExp(
    `${marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?<\\/script>`
  )
  const updatedTemplate = template.replace(existingPatch, script)
  if (updatedTemplate !== template) {
    fs.writeFileSync(passwordTemplate, updatedTemplate)
  }
  process.exit(0)
}

if (!template.includes('{% endblock %}')) {
  throw new Error('GOV.UK Prototype Kit password template has an unexpected structure')
}

const lastEndBlock = template.lastIndexOf('{% endblock %}')
const patchedTemplate = [
  template.slice(0, lastEndBlock),
  script,
  '\n',
  template.slice(lastEndBlock)
].join('')

fs.writeFileSync(passwordTemplate, patchedTemplate)
