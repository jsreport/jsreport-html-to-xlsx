/*!
 * Copyright(c) 2018 Jan Blaha
 *
 * html-to-xlsx recipe transforms html into xlsx. The process is based on extracting html and css attributes
 * using phantomjs and then assembling excel Open XML.
 */

const extend = require('node.extend.without.arrays')
const { htmlEngines } = require('./autoDetectHtmlEngines')()
const mergeXlsx = require('./mergeXlsx')
const htmlToXlsx = require('html-to-xlsx')
const chromePageEval = require('chrome-page-eval')
const phantomPageEval = require('phantom-page-eval')
const { response } = require('jsreport-office')

const conversions = {}

module.exports = function (reporter, definition) {
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
      }

      if (conversions.phantom) {
        htmlToXlsxOptions.htmlEngine = 'phantom'
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

    const stream = await conversion(res.content.toString(), {
      // default styles for the excel
      styles: [`
        * {
          font-family: Calibri;
          font-size: 16px;
        }
      `],
      waitForJS: htmlToXlsxOptions.waitForJS,
      waitForJSVarName: 'JSREPORT_READY_TO_START'
    })

    res.stream = stream

    if (htmlToXlsxOptions.insertToXlsxTemplate === true) {
      await mergeXlsx(reporter, req, res)
    }

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

  definition.options.htmlEngines = Object.keys(htmlEngines)

  const options = extend(true, {}, definition.options)

  if (htmlEngines.chrome) {
    const chromeEvalOptions = Object.assign({puppeteer: htmlEngines.chrome}, reporter.options.chrome, options.chrome)
    const chromeEval = chromePageEval(chromeEvalOptions)

    conversions.chrome = htmlToXlsx({
      ...Object.assign({}, reporter.options.chrome, options),
      extract: chromeEval
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
      extract: phantomEval
    })

    reporter.logger.info('html-to-xlsx detected phantom as available html engine')
  }

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
