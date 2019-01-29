require('should')
const util = require('util')
const path = require('path')
const fs = require('fs')
const XlsxPopulate = require('html-to-xlsx').XlsxPopulate
const jsreport = require('jsreport-core')
const readFileAsync = util.promisify(fs.readFile)

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

  it('should use default htmlEngine', async () => {
    const request = {
      template: {
        content: '<table><tr><td>a</td></tr></table>',
        recipe: 'html-to-xlsx',
        engine: 'none'
      }
    }

    const response = await reporter.render(request)
    response.content.toString().should.containEql('PK')
  })

  it('should insert into xlsx template', async () => {
    const xlsxTemplateBuf = await readFileAsync(path.join(__dirname, 'sum-template.xlsx'))

    const request = {
      template: {
        content: `
        <table name="Data">
          <tr>
              <td data-cell-type="number">1</td>
          </tr>
          <tr>
              <td data-cell-type="number">2</td>
          </tr>
          <tr>
              <td data-cell-type="number">3</td>
          </tr>
          <tr>
              <td data-cell-type="number">4</td>
          </tr>
          <tr>
              <td data-cell-type="number">5</td>
          </tr>
          <tr>
              <td data-cell-type="number">6</td>
          </tr>
        </table>
        `,
        recipe: 'html-to-better-xlsx',
        engine: 'none',
        baseXlsxTemplate: {
          content: xlsxTemplateBuf.toString('base64')
        },
        htmlToXlsx: {
          insertToXlsxTemplate: true
        }
      }
    }

    const response = await reporter.render(request)
    const workbook = await XlsxPopulate.fromDataAsync(response.content)

    workbook.sheets().length.should.be.eql(2)
    workbook.sheets()[1].name().should.be.eql('Data')
    workbook.sheets()[1].cell(1, 1).value().should.be.eql(1)
    workbook.sheets()[1].cell(2, 1).value().should.be.eql(2)
    workbook.sheets()[1].cell(3, 1).value().should.be.eql(3)
    workbook.sheets()[1].cell(4, 1).value().should.be.eql(4)
    workbook.sheets()[1].cell(5, 1).value().should.be.eql(5)
    workbook.sheets()[1].cell(6, 1).value().should.be.eql(6)
  })

  it('should replace sheet when insert into xlsx template gets into duplicated sheet name', async () => {
    const xlsxTemplateBuf = await readFileAsync(path.join(__dirname, 'duplicate-template.xlsx'))

    const request = {
      template: {
        content: `
        <table name="Data">
          <tr>
              <td data-cell-type="number">1</td>
          </tr>
        </table>
        `,
        recipe: 'html-to-better-xlsx',
        engine: 'none',
        baseXlsxTemplate: {
          content: xlsxTemplateBuf.toString('base64')
        },
        htmlToXlsx: {
          insertToXlsxTemplate: true
        }
      }
    }

    const response = await reporter.render(request)
    const workbook = await XlsxPopulate.fromDataAsync(response.content)

    workbook.sheets().length.should.be.eql(2)
    workbook.sheets()[1].name().should.be.eql('Data')
    workbook.sheets()[1].cell(1, 1).value().should.be.eql(1)
  })

  it('should not throw error when replacing sheet in excel that contains only one sheet', async () => {
    const xlsxTemplateBuf = await readFileAsync(path.join(__dirname, 'only-one-sheet-template.xlsx'))

    const request = {
      template: {
        content: `
        <table name="Main">
          <tr>
              <td data-cell-type="number">1</td>
          </tr>
        </table>
        `,
        recipe: 'html-to-better-xlsx',
        engine: 'none',
        baseXlsxTemplate: {
          content: xlsxTemplateBuf.toString('base64')
        },
        htmlToXlsx: {
          insertToXlsxTemplate: true
        }
      }
    }

    const response = await reporter.render(request)
    const workbook = await XlsxPopulate.fromDataAsync(response.content)

    workbook.sheets().length.should.be.eql(1)
    workbook.sheets()[0].name().should.be.eql('Main')
    workbook.sheets()[0].cell(1, 1).value().should.be.eql(1)
  })
})
