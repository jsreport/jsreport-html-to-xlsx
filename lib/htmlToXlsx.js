/*!
 * Copyright(c) 2014 Jan Blaha
 *
 * html-to-xlsx recipe transforms html into xlsx. The process is based on extracting html and css attributes
 * using phantomjs and then assembling excel Open XML.
 */

var Promise = require('bluebird')
var extend = require('node.extend')
var path = require('path')

var conversion

module.exports = function (reporter, definition) {
  reporter.extensionsManager.recipes.push({
    name: 'html-to-xlsx',
    execute: function (request, response) {
      return conversion(response.content.toString()).then(function (stream) {
        response.stream = stream
        return reporter.xlsx.responseXlsx(request, response)
      })
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
    var options = extend(true, {}, definition.options)
    delete options.pathToPhantomScript

    if (reporter.execution) {
      options.standaloneScriptPath = reporter.execution.resourceTempPath('htmlToXlsxStandaloneScript.js')
      options.phantomJSPath = reporter.execution.resourceTempPath('phantomjs.exe')
      options.xlsxTemplatePath = reporter.execution.resourceTempPath('xlsxTemplate')
    }

    conversion = Promise.promisify(require('html-to-xlsx')(options))
  }
}
