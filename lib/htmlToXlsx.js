/*!
 * Copyright(c) 2018 Jan Blaha
 *
 * html-to-xlsx recipe transforms html into xlsx. The process is based on extracting html and css attributes
 * using phantomjs and then assembling excel Open XML.
 */

const util = require('util')
const path = require('path')
const fs = require('fs')
const vm = require('vm')
const extend = require('node.extend.without.arrays')
const { htmlEngines } = require('./autoDetectHtmlEngines')()
const htmlToXlsx = require('html-to-xlsx')
const chromePageEval = require('chrome-page-eval')
const phantomPageEval = require('phantom-page-eval')
const opentype = require('opentype.js')
const cheerioPageEval = require('./cheerioPageEval')
const { response } = require('jsreport-office')

const writeFileAsync = util.promisify(fs.writeFile)

const conversions = {}

module.exports = function (reporter, definition) {
  const defaultFontPath = path.join(__dirname, '../static/Calibri 400.ttf')

  definition.options = extend(true, { preview: {} }, reporter.options.xlsx, reporter.options.office, definition.options)

  if (reporter.options.office) {
    Object.assign(definition.options, reporter.options.office)
  }

  if (definition.options.previewInExcelOnline != null) {
    definition.options.preview.enabled = definition.options.previewInExcelOnline
  }

  if (definition.options.showExcelOnlineWarning != null) {
    definition.options.preview.showWarning = definition.options.showExcelOnlineWarning
  }

  if (definition.options.publicUriForPreview != null) {
    definition.options.preview.publicUri = definition.options.publicUriForPreview
  }

  reporter.documentStore.registerComplexType('HtmlToXlsxType', {
    htmlEngine: { type: 'Edm.String' },
    waitForJS: { type: 'Edm.Boolean' },
    insertToXlsxTemplate: { type: 'Edm.Boolean' }
  })

  reporter.documentStore.registerComplexType('BaseXlsxTemplateRefType', {
    'shortid': { type: 'Edm.String' }
  })

  if (reporter.documentStore.model.entityTypes['TemplateType']) {
    reporter.documentStore.model.entityTypes['TemplateType'].htmlToXlsx = { type: 'jsreport.HtmlToXlsxType' }
    reporter.documentStore.model.entityTypes['TemplateType'].baseXlsxTemplate = { type: 'jsreport.BaseXlsxTemplateRefType', schema: { type: 'null' } }
  }

  const execute = async (req, res) => {
    const htmlToXlsxOptions = req.template.htmlToXlsx || {}

    if (htmlToXlsxOptions.htmlEngine == null) {
      if (conversions.chrome) {
        htmlToXlsxOptions.htmlEngine = 'chrome'
      } else if (conversions.phantom) {
        htmlToXlsxOptions.htmlEngine = 'phantom'
      } else {
        htmlToXlsxOptions.htmlEngine = 'cheerio'
      }

      if (htmlToXlsxOptions.htmlEngine == null) {
        throw reporter.createError(`Unable to set default htmlEngine because no engine installed`, {
          statusCode: 400
        })
      }
    }

    let conversion

    conversion = conversions[htmlToXlsxOptions.htmlEngine]

    if (conversion == null) {
      throw reporter.createError(`htmlEngine "${htmlToXlsxOptions.htmlEngine}" not found`, {
        statusCode: 400
      })
    }

    const conversionOptions = {}

    if (htmlToXlsxOptions.htmlEngine === 'cheerio') {
      conversionOptions.defaults = {
        fontFamily: 'Calibri',
        fontSize: '16px',
        verticalAlign: 'middle'
      }
    } else {
      conversionOptions.styles = [`
        * {
          font-family: Calibri;
          font-size: 16px;
        }
      `]

      conversionOptions.scriptFn = htmlToXlsx.getScriptFn()
      conversionOptions.waitForJS = htmlToXlsxOptions.waitForJS
      conversionOptions.waitForJSVarName = 'JSREPORT_READY_TO_START'
    }

    let xlsxTemplateBuf

    if (htmlToXlsxOptions.insertToXlsxTemplate === true) {
      if (!req.template.baseXlsxTemplate) {
        throw reporter.createError('No base xlsx template specified, make sure to set one when "htmlToXlsx.insertToXlsxTemplate" option is true', {
          weak: true
        })
      }

      if (req.template.baseXlsxTemplate.content) {
        xlsxTemplateBuf = Buffer.from(req.template.baseXlsxTemplate.content, 'base64')
      } else {
        if (!req.template.baseXlsxTemplate.shortid) {
          throw reporter.createError('No base xlsx template specified, make sure to set one when "htmlToXlsx.insertToXlsxTemplate" option is true', {
            weak: true
          })
        }

        const docs = await reporter.documentStore.collection('xlsxTemplates').find({
          shortid: req.template.baseXlsxTemplate.shortid
        }, req)

        if (!docs.length) {
          throw reporter.createError(`Unable to find xlsx template with shortid ${req.template.baseXlsxTemplate.shortid}`, {
            statusCode: 404
          })
        }

        xlsxTemplateBuf = docs[0].contentRaw
      }
    }

    const stream = await conversion(
      res.content.toString(),
      conversionOptions,
      xlsxTemplateBuf
    )

    res.stream = stream

    return response({
      previewOptions: definition.options.preview,
      officeDocumentType: 'xlsx',
      stream: res.stream
    }, req, res)
  }

  reporter.extensionsManager.recipes.push({
    name: 'html-to-xlsx',
    execute: (req, res) => execute(req, res)
  })

  definition.options.tmpDir = reporter.options.tempAutoCleanupDirectory

  definition.options.htmlEngines = [...Object.keys(htmlEngines), 'cheerio']

  const options = extend(true, {}, definition.options)

  if (htmlEngines.chrome) {
    const chromeEvalOptions = Object.assign({ puppeteer: htmlEngines.chrome }, reporter.options.chrome, options.chrome)
    const chromeEval = chromePageEval(chromeEvalOptions)

    conversions.chrome = htmlToXlsx({
      ...Object.assign({}, reporter.options.chrome, options),
      extract: browserBasedEval(options.tmpDir, chromeEval)
    })

    reporter.logger.info('html-to-xlsx detected chrome as available html engine')
  }

  if (htmlEngines.phantom) {
    const phantomEvalOptions = {
      tmpDir: options.tmpDir,
      clean: false
    }

    if (reporter.options.phantom && reporter.options.phantom.path) {
      // global phantom path possible filled in future by compilation
      phantomEvalOptions.phantomPath = reporter.options.phantom.path
    } else {
      phantomEvalOptions.phantomPath = htmlEngines.phantom.path
    }

    const phantomEval = phantomPageEval(phantomEvalOptions)

    conversions.phantom = htmlToXlsx({
      ...options,
      extract: browserBasedEval(options.tmpDir, phantomEval)
    })

    reporter.logger.info('html-to-xlsx detected phantom as available html engine')
  }

  conversions.cheerio = htmlToXlsx({
    ...options,
    extract: cheerioPageEval(options.tmpDir, opentype.loadSync(defaultFontPath))
  })

  reporter.beforeRenderListeners.insert({ after: 'data' }, 'htmlToXlsx', async (req) => {
    if (req.template.recipe !== 'html-to-xlsx') {
      return
    }

    req.data = req.data || {}
    req.data.$tempAutoCleanupDirectory = reporter.options.tempAutoCleanupDirectory

    const helpersScript = await fs.readFileAsync(path.join(__dirname, '../static/helpers.js'), 'utf8')

    if (req.template.helpers && typeof req.template.helpers === 'object') {
      // this is the case when the jsreport is used with in-process strategy
      // and additinal helpers are passed as object
      // in this case we need to merge in xlsx helpers
      return vm.runInNewContext(helpersScript, req.template.helpers)
    }

    req.template.helpers = helpersScript + '\n' + (req.template.helpers || '')
  })

  reporter.initializeListeners.add(definition.name, () => {
    if (reporter.express) {
      reporter.express.exposeOptionsToApi(definition.name, {
        htmlEngines: definition.options.htmlEngines,
        preview: {
          enabled: definition.options.preview.enabled,
          showWarning: definition.options.preview.showWarning
        }
      })
    }
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
