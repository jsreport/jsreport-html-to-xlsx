/*!
 * Copyright(c) 2018 Jan Blaha
 *
 * html-to-xlsx recipe transforms html into xlsx. The process is based on extracting html and css attributes
 * using phantomjs and then assembling excel Open XML.
 */

const extend = require('node.extend')
const path = require('path')
const autoDetectHtmlEngines = require('./autoDetectHtmlEngines')
const responseXlsx = require('./responseXlsx')

const conversions = {}

module.exports = function (reporter, definition) {
  reporter.documentStore.registerComplexType('HtmlToXlsxType', {
    htmlEngine: { type: 'Edm.String' }
  })

  if (reporter.documentStore.model.entityTypes['TemplateType']) {
    reporter.documentStore.model.entityTypes['TemplateType'].htmlToXlsx = { type: 'jsreport.HtmlToXlsxType' }
  }

  // the public excel preview can be disabled just once in xlsx recipe
  const previewXlsxOptions = {
    previewInExcelOnline: definition.options.previewInExcelOnline || (reporter.options.xslx || {}).previewInExcelOnline,
    publicUriForPreview: definition.options.publicUriForPreview || (reporter.options.xslx || {}).publicUriForPreview
  }

  reporter.extensionsManager.recipes.push({
    name: 'html-to-xlsx',
    execute: async (request, response) => {
      const htmlToXlsxOptions = request.template.htmlToXlsx || {}

      if (htmlToXlsxOptions.htmlEngine == null) {
        throw new Error('htmlEngine options not specified')
      }

      const conversion = conversions[htmlToXlsxOptions.htmlEngine]

      if (conversion == null) {
        throw new Error(`htmlEngine "${htmlToXlsxOptions.htmlEngine}" not found`)
      }

      const stream = await conversion(response.content.toString())

      response.stream = stream

      return responseXlsx(previewXlsxOptions, request, response)
    }
  })

  if (reporter.compilation) {
    reporter.compilation.resourceInTemp('htmlToXlsxConversionScript.js', path.join(path.dirname(require.resolve('html-to-xlsx')), 'lib', 'scripts', 'conversionScript.js'))
    reporter.compilation.resourceDirectoryInTemp('xlsxTemplate', path.join(path.dirname(require.resolve('msexcel-builder-extended')), 'tmpl'))
  }

  if (Object.keys(conversions).length === 0) {
    if (!Object.getOwnPropertyNames(definition.options).length) {
      definition.options = reporter.options['html-to-xlsx'] || {}
    }

    definition.options.tmpDir = reporter.options.tempAutoCleanupDirectory

    const htmlEngines = autoDetectHtmlEngines()

    definition.options.htmlEngines = Object.keys(htmlEngines)

    const options = extend(true, {}, definition.options)

    if (reporter.execution) {
      options.conversionScriptPath = reporter.execution.resourceTempPath('htmlToXlsxConversionScript.js')
      options.xlsxTemplatePath = reporter.execution.resourceTempPath('xlsxTemplate')
    }

    const htmlToXlsx = require('html-to-xlsx')
    const chromePageEval = require('chrome-page-eval')
    const phantomPageEval = require('phantom-page-eval')

    if (htmlEngines.chrome) {
      const chromeEval = chromePageEval({
        puppeteer: htmlEngines.chrome
      })

      conversions.chrome = htmlToXlsx({
        ...options,
        extract: chromeEval
      })

      reporter.logger.info('html-to-xlsx detected chrome as available html engine')
    }

    if (htmlEngines.phantom) {
      const phantomEvalOptions = {
        tmpDir: options.tmpDir,
        clean: false
      }

      if (reporter.execution) {
        // TODO: check if this is the right thing to do with jsreport executable case
        phantomEvalOptions.phantomPath = reporter.execution.resourceTempPath('phantomjs.exe')
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
  }
}
