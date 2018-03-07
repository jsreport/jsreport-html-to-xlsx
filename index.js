const main = require('./lib/htmlToXlsx.js')
const config = require('./jsreport.config.js')

module.exports = function (options) {
  const newConfig = { ...config }

  newConfig.options = options
  newConfig.main = main
  newConfig.directory = __dirname

  return newConfig
}
