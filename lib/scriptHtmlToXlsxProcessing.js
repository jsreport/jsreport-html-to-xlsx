const util = require('util')
const path = require('path')
const fs = require('fs')
const { htmlEngines } = require('./autoDetectHtmlEngines')()
const chromePageEval = require('chrome-page-eval')
const phantomPageEval = require('phantom-page-eval')
const htmlToXlsx = require('html-to-xlsx')
const opentype = require('opentype.js')

const defaultFontPath = path.join(__dirname, '../static/Calibri 400.ttf')
const readFileAsync = util.promisify(fs.readFile)
const writeFileAsync = util.promisify(fs.writeFile)

const addRowsToBrowserFn = fs.readFileSync(path.join(__dirname, '../static/addRowsToBrowser.js')).toString()

const conversions = {}

module.exports = async function scriptHtmlToXlsxProcessing (inputs, callback, done) {
  const { tmpDir, htmlEngine, html, xlsxTemplateContent, chromeOptions, phantomOptions, cheerioOptions, conversionOptions } = inputs
  let logs = []

  try {
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

    if (conversions.cheerio == null && htmlEngines.cheerio && htmlEngine === 'cheerio') {
      const cheerioPageEval = require('cheerio-page-eval')

      conversions.cheerio = htmlToXlsx({
        ...cheerioOptions.conversion,
        extract: cheerioPageEval(tmpDir, opentype.loadSync(defaultFontPath))
      })
    }

    let conversion

    conversion = conversions[htmlEngine]

    if (conversion == null) {
      const engineError = new Error(`htmlEngine "${htmlEngine}" not found`)

      return done(null, {
        logs,
        error: {
          message: engineError.message,
          stack: engineError.stack
        }
      })
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
  } catch (e) {
    done(null, {
      logs,
      error: {
        message: e.message,
        stack: e.stack
      }
    })
  }
}

function browserBasedEval (tmpDir, extractImplementation) {
  return async function pageEval ({ html, uuid, ...restOptions }) {
    const htmlPath = path.join(tmpDir, `${uuid}-html-to-xlsx.html`)

    await writeFileAsync(htmlPath, html)

    const extractInfo = await extractImplementation({
      html: htmlPath,
      close: false,
      ...restOptions
    })

    const { result, instance } = extractInfo

    const tables = Array.isArray(result) ? result : [result]

    const tablesLastIndex = tables.length - 1

    return tables.map((table, tableIdx) => ({
      name: table.name,
      getRows: async (rowCb) => {
        return new Promise(async (resolve, reject) => {
          try {
            for (const row of table.rows) {
              const isRowsPlaceholder = !Array.isArray(row)

              if (!isRowsPlaceholder) {
                rowCb(row)
              } else {
                await extractRowsFromPlaceholder(row, rowCb, {
                  tmpDir,
                  instance,
                  extractImplementation,
                  extractOptions: restOptions
                })
              }
            }

            if (tableIdx === tablesLastIndex) {
              await instance.destroy()
            }

            resolve()
          } catch (e) {
            await instance.destroy()
            reject(e)
          }
        })
      },
      rowsCount: table.rows.length
    }))
  }
}

async function extractRowsFromPlaceholder (placeholder, onRow, { tmpDir, instance, extractImplementation, extractOptions }) {
  for (const file of placeholder.files) {
    const filePath = path.join(tmpDir, file)
    const rowsStr = (await readFileAsync(filePath)).toString()

    const extractInfo = await extractImplementation({
      instance,
      close: false,
      ...extractOptions,
      scriptFn: addRowsToBrowserFn,
      args: [placeholder.id, rowsStr]
    })

    for (const row of extractInfo.result) {
      onRow(row)
    }
  }
}
