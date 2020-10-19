/*!
 * Copyright(c) 2018 Jan Blaha
 *
 * html-to-xlsx recipe transforms html into xlsx. The process is based on extracting html and css attributes
 * using phantomjs and then assembling excel Open XML.
 */

const path = require('path')
const fs = require('fs')
const vm = require('vm')
const extend = require('node.extend.without.arrays')
const { htmlEngines } = require('./autoDetectHtmlEngines')()
const recipe = require('./recipe')

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
    templateAssetShortid: { type: 'Edm.String', referenceTo: 'assets', schema: { type: 'null' } },
    htmlEngine: { type: 'Edm.String' },
    waitForJS: { type: 'Edm.Boolean' }
  })

  reporter.documentStore.registerComplexType('BaseXlsxTemplateRefType', {
    shortid: { type: 'Edm.String', referenceTo: 'xlsxTemplates', schema: { type: 'null' } }
  })

  if (reporter.documentStore.model.entityTypes.TemplateType) {
    reporter.documentStore.model.entityTypes.TemplateType.htmlToXlsx = { type: 'jsreport.HtmlToXlsxType' }
    reporter.documentStore.model.entityTypes.TemplateType.baseXlsxTemplate = { type: 'jsreport.BaseXlsxTemplateRefType', schema: { type: 'null' } }
  }

  definition.options.tmpDir = reporter.options.tempAutoCleanupDirectory

  definition.options.htmlEngines = Object.keys(htmlEngines)

  if (htmlEngines.chrome) {
    reporter.logger.info('html-to-xlsx detected chrome as available html engine')
  }

  if (htmlEngines.phantom) {
    reporter.logger.info('html-to-xlsx detected phantom as available html engine')
  }

  reporter.extensionsManager.recipes.push({
    name: 'html-to-xlsx',
    execute: recipe(reporter, definition)
  })

  reporter.options.templatingEngines.modules.push({
    alias: 'tmpHandler.js',
    path: path.join(__dirname, './tmpHandler.js')
  })

  reporter.beforeRenderListeners.insert({ after: 'data' }, 'htmlToXlsx', async (req) => {
    if (req.template.recipe !== 'html-to-xlsx') {
      return
    }

    req.data = req.data || {}
    req.data.$tempAutoCleanupDirectory = reporter.options.tempAutoCleanupDirectory
    req.data.$writeToFiles = ['cheerio', 'chrome'].includes((req.template.htmlToXlsx || {}).htmlEngine)

    const helpersScript = await fs.readFileAsync(path.join(__dirname, '../static/helpers.js'), 'utf8')

    if (req.template.helpers && typeof req.template.helpers === 'object') {
      // this is the case when the jsreport is used with in-process strategy
      // and additinal helpers are passed as object
      // in this case we need to merge in xlsx helpers
      req.template.helpers.require = require
      req.template.helpers.tmpHandler = require(path.join(__dirname, './tmpHandler.js'))
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
