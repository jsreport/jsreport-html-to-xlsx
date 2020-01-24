/* eslint no-unused-vars: 1 */
/* eslint no-new-func: 0 */
/* *global __rootDirectory */
;(function (global) {
  const path = require('path')
  const fs = require('fs')
  const nanoid = require('nanoid')
  const Handlebars = require('handlebars')

  global.eachRows = function (data, options) {
    const maxRows = 1000
    let totalRows = 0
    let rowsCount = 0
    const files = []
    let chunks = []

    for (let i = 0; i < data.length; i++) {
      const item = data[i]

      chunks.push(options.fn(item))

      rowsCount++
      totalRows++

      if (rowsCount === maxRows) {
        const tempFile = write(options.data.root.$tempAutoCleanupDirectory, chunks.join(''))
        files.push(path.basename(tempFile))
        rowsCount = 0
        chunks = []
      }
    }

    if (chunks.length > 0) {
      const tempFile = write(options.data.root.$tempAutoCleanupDirectory, chunks.join(''))
      files.push(path.basename(tempFile))
    }

    return new Handlebars.SafeString(`<tr data-rows-placeholder data-total-rows="${totalRows}" data-files="${files.join(',')}" />`)
  }

  function write (tmp, data) {
    const file = path.join(tmp, `${nanoid(7)}.html`)
    fs.writeFileSync(file, data)
    return file
  }
})(this)
