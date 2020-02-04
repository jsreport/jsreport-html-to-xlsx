/* eslint no-unused-vars: 1 */
/* eslint no-new-func: 0 */
/* *global __rootDirectory */
;(function (global) {
  const tmpHandler = this.tmpHandler || require('tmpHandler.js')
  const Handlebars = require('handlebars')

  global.htmlToXlsxEachRows = function (data, options) {
    const maxRows = 1000
    let totalRows = 0
    let rowsCount = 0
    const files = []
    let chunks = []
    let contextData

    if (options.data) {
      contextData = Handlebars.createFrame(options.data)
    }

    for (let i = 0; i < data.length; i++) {
      if (contextData) {
        contextData.index = i
      }

      const item = data[i]

      chunks.push(options.fn(item, { data: contextData }))

      if (options.data.root.$writeToFiles === true) {
        rowsCount++
        totalRows++

        if (rowsCount === maxRows) {
          const tempFile = tmpHandler.write(options.data.root.$tempAutoCleanupDirectory, chunks.join(''))
          files.push(tmpHandler.basename(tempFile))
          rowsCount = 0
          chunks = []
        }
      }
    }

    if (!options.data.root.$writeToFiles) {
      return new Handlebars.SafeString(chunks.join(''))
    }

    if (chunks.length > 0) {
      const tempFile = tmpHandler.write(options.data.root.$tempAutoCleanupDirectory, chunks.join(''))
      files.push(tmpHandler.basename(tempFile))
    }

    return new Handlebars.SafeString(`<tr data-rows-placeholder data-total-rows="${totalRows}" data-files="${files.join(',')}" />`)
  }
})(this)
