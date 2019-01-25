const util = require('util')
const fs = require('fs')
const XlsxPopulate = require('html-to-xlsx').XlsxPopulate
const toArray = require('stream-to-array')
const writeFileAsync = util.promisify(fs.writeFile)
const toArrayAsync = util.promisify(toArray)

module.exports = async (reporter, request, response) => {
  let xlsxTemplateBuf
  let tableXlsxBuf

  reporter.logger.debug('Merging html-to-xlsx result into xlsx template is starting', request)

  if (response.stream.path == null) {
    throw reporter.createError('No path was found in xlsx response stream', {
      weak: true
    })
  }

  if (!request.template.baseXlsxTemplate) {
    throw reporter.createError('No base xlsx template specified, make sure to set one when "htmlToXlsx.insertToXlsxTemplate" option is true', {
      weak: true
    })
  }

  if (request.template.baseXlsxTemplate.content) {
    xlsxTemplateBuf = Buffer.from(request.template.baseXlsxTemplate.content, 'base64')
  } else {
    if (!request.template.baseXlsxTemplate.shortid) {
      throw reporter.createError('No base xlsx template specified, make sure to set one when "htmlToXlsx.insertToXlsxTemplate" option is true', {
        weak: true
      })
    }

    const docs = await reporter.documentStore.collection('xlsxTemplates').find({
      shortid: request.template.baseXlsxTemplate.shortid
    }, request)

    if (!docs.length) {
      throw reporter.createError(`Unable to find xlsx template with shortid ${request.template.baseXlsxTemplate.shortid}`, {
        statusCode: 404
      })
    }

    xlsxTemplateBuf = docs[0].contentRaw
  }

  tableXlsxBuf = Buffer.concat(await toArrayAsync(response.stream))

  const [templateWorkbook, tableWorkbook] = await Promise.all([
    XlsxPopulate.fromDataAsync(xlsxTemplateBuf),
    XlsxPopulate.fromDataAsync(tableXlsxBuf)
  ])

  const sheetsInTableWorkbook = tableWorkbook.sheets()

  sheetsInTableWorkbook.forEach((sheet) => {
    if (templateWorkbook.sheet(sheet.name()) != null) {
      throw new Error(`insert to xlsx template failed. sheet with name "${sheet.name()}" already exists on xlsx template, make sure that html table(s) does not produce sheet(s) with duplicated names`)
    }

    const newSheetInTemplateWorkbook = templateWorkbook.addSheet(sheet.name())
    const usedRange = sheet.usedRange()
    const oldValues = usedRange.value()

    // for now we just copy the values, there is no support yet to
    // preserve the styles of sheets in xlsx produced by html-to-xlsx
    newSheetInTemplateWorkbook.range(usedRange.address()).value(oldValues)

    usedRange.cells().forEach((cells) => {
      cells.forEach((cell) => {
        // copying number format style to be able to preserve date format
        if (cell.style('numberFormat') != null) {
          newSheetInTemplateWorkbook.cell(cell.rowNumber(), cell.columnNumber()).style('numberFormat', cell.style('numberFormat'))
        }
      })
    })
  })

  await writeFileAsync(response.stream.path, await templateWorkbook.outputAsync())

  reporter.logger.debug(`Merging html-to-xlsx result (${sheetsInTableWorkbook.length} sheet(s)) into xlsx template ended`, request)

  response.stream = fs.createReadStream(response.stream.path)
}
