const util = require('util')
const path = require('path')
const fs = require('fs')
const { htmlEngines } = require('./autoDetectHtmlEngines')()
const chromePageEval = require('chrome-page-eval')
const phantomPageEval = require('phantom-page-eval')
const htmlToXlsx = require('html-to-xlsx')
const opentype = require('opentype.js')
const cheerioPageEval = require('./cheerioPageEval')

const defaultFontPath = path.join(__dirname, '../static/Calibri 400.ttf')
const writeFileAsync = util.promisify(fs.writeFile)

const conversions = {}

module.exports = async function scriptHtmlToXlsxProcessing (inputs, callback, done) {
  const { tmpDir, htmlEngine, html, xlsxTemplateContent, chromeOptions, phantomOptions, cheerioOptions, conversionOptions } = inputs
  let logs = []

  if (htmlEngines.chrome && conversions.chrome == null && htmlEngine === 'chrome') {
    const chromeEval = chromePageEval({ ...chromeOptions.eval, puppeteer: htmlEngines.chrome })

    conversions.chrome = htmlToXlsx({
      ...chromeOptions.conversion,
      extract: browserBasedEval(tmpDir, chromeEval)
    })
  }

  if (htmlEngines.phantom && conversions.phantom == null && htmlEngine === 'phantom') {
    const phantomPath = phantomOptions.eval.phantomPath != null ? phantomOptions.eval.phantomPath : htmlEngines.phantom.path
    const phantomEval = phantomPageEval({ ...phantomOptions.eval, phantomPath })

    conversions.phantom = htmlToXlsx({
      ...phantomOptions.conversion,
      extract: browserBasedEval(tmpDir, phantomEval)
    })
  }

  if (conversions.cheerio == null && htmlEngine === 'cheerio') {
    conversions.cheerio = htmlToXlsx({
      ...cheerioOptions.conversion,
      extract: cheerioPageEval(tmpDir, opentype.loadSync(defaultFontPath))
    })
  }

  let conversion

  conversion = conversions[htmlEngine]

  if (conversion == null) {
    return done(null, new Error(`htmlEngine "${htmlEngine}" not found`))
  }

  const stream = await conversion(
    html,
    conversionOptions,
    xlsxTemplateContent
  )

  const xlsxPath = stream.path

  stream.destroy()

  done(null, {
    logs,
    htmlToXlsxFilePath: xlsxPath
  })
}

function browserBasedEval (tmpDir, extractImplementation) {
  return async function pageEval ({ html, uuid, ...restOptions }) {
    const htmlPath = path.join(tmpDir, `${uuid}-html-to-xlsx.html`)

    await writeFileAsync(htmlPath, html)

    const result = await extractImplementation({
      html: htmlPath,
      ...restOptions
    })

    const tables = Array.isArray(result) ? result : [result]

    return tables.map((table) => ({
      name: table.name,
      getRows: async (rowCb) => {
        table.rows.forEach((row) => {
          rowCb(row)
        })
      },
      rowsCount: table.rows.length
    }))
  }
}
