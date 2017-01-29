/*!
 * Copyright(c) 2014 Jan Blaha
 *
 * html-to-xlsx recipe transforms html into xlsx. The process is based on extracting html and css attributes
 * using phantomjs and then assembling excel Open XML.
 */

var Promise = require('bluebird')
var extend = require('node.extend')

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

  if (!conversion) {
    if (!Object.getOwnPropertyNames(definition.options).length) {
      definition.options = reporter.options.phantom || {}
    }

    definition.options.strategy = definition.options.strategy || 'dedicated-process'
    var options = extend(true, {}, definition.options)
    delete options.pathToPhantomScript
    conversion = Promise.promisify(require('html-to-xlsx')(options))
  }
}
