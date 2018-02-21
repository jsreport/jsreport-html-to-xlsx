/*!
 * Copyright(c) 2018 Jan Blaha
 *
 * html-to-xlsx recipe transforms html into xlsx. The process is based on extracting html and css attributes
 * using phantomjs and then assembling excel Open XML.
 */

const Promise = require('bluebird')
const extend = require('node.extend')
const path = require('path')
const responseXlsx = require('./responseXlsx')

let conversion

module.exports = function (reporter, definition) {
  // the public excel preview can be disabled just once in xlsx recipe
  const previewXlsxOptions = {
    previewInExcelOnline: definition.options.previewInExcelOnline || (reporter.options.xslx || {}).previewInExcelOnline,
    publicUriForPreview: definition.options.publicUriForPreview || (reporter.options.xslx || {}).publicUriForPreview
  }

  reporter.extensionsManager.recipes.push({
    name: 'html-to-xlsx',
    execute: async (request, response) => {
      const stream = await conversion(response.content.toString())
      response.stream = stream
      return responseXlsx(previewXlsxOptions, request, response)
    }
  })

  if (reporter.compilation) {
    reporter.compilation.resourceInTemp('htmlToXlsxStandaloneScript.js', path.join(path.dirname(require.resolve('html-to-xlsx')), 'lib', 'scripts', 'standaloneScript.js'))
    reporter.compilation.resourceDirectoryInTemp('xlsxTemplate', path.join(path.dirname(require.resolve('msexcel-builder-extended')), 'tmpl'))
  }

  if (!conversion) {
    if (!Object.getOwnPropertyNames(definition.options).length) {
      definition.options = reporter.options.phantom || {}
    }

    definition.options.strategy = definition.options.strategy || 'dedicated-process'
    const options = extend(true, {}, definition.options)
    delete options.pathToPhantomScript

    if (reporter.execution) {
      options.standaloneScriptPath = reporter.execution.resourceTempPath('htmlToXlsxStandaloneScript.js')
      options.phantomJSPath = reporter.execution.resourceTempPath('phantomjs.exe')
      options.xlsxTemplatePath = reporter.execution.resourceTempPath('xlsxTemplate')
    }

    conversion = Promise.promisify(require('html-to-xlsx')(options))
  }
}
