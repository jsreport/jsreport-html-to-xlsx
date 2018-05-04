require('should')
const jsreport = require('jsreport-core')

describe('html to xlsx', () => {
  let reporter

  beforeEach(() => {
    reporter = jsreport().use(require('../')()).use(require('jsreport-templates')())
    return reporter.init()
  })

  it('should not fail when rendering', async () => {
    const request = {
      template: {
        content: '<table><tr><td>a</td></tr></table>',
        recipe: 'html-to-xlsx',
        engine: 'none',
        htmlToXlsx: {
          htmlEngine: 'chrome'
        }
      }
    }

    const response = await reporter.render(request)
    response.content.toString().should.containEql('PK')
  })
})
