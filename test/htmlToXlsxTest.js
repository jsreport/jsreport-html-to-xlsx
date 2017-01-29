require('should')

var Reporter = require('jsreport-core').Reporter

describe('html to xlsx', function () {
  var reporter

  beforeEach(function () {
    reporter = new Reporter().use(require('../')()).use(require('jsreport-xlsx')()).use(require('jsreport-templates')())

    return reporter.init()
  })

  it('should not fail when rendering', function () {
    var request = {
      template: { content: '<table><tr><td>a</td></tr></table>', recipe: 'html-to-xlsx', engine: 'none' }
    }

    return reporter.render(request, {}).then(function (response) {
      response.content.toString().should.containEql('PK')
    })
  })
})
