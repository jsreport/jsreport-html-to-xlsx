const util = require('util')
const fs = require('fs')
const XlsxPopulate = require('html-to-xlsx').XlsxPopulate
const getXlsxStyleNames = require('html-to-xlsx').getXlsxStyleNames
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
    let oldSheet

    if (templateWorkbook.sheet(sheet.name()) != null) {
      if (templateWorkbook.sheets().length === 1) {
        oldSheet = `${sheet.name()}-old`
        // the workbook can not have empty sheets so we need to rename the only sheet first and then delete it
        templateWorkbook.sheet(sheet.name()).name(oldSheet)
      } else {
        templateWorkbook.deleteSheet(sheet.name())
      }
    }

    const newSheetInTemplateWorkbook = templateWorkbook.addSheet(sheet.name())

    if (oldSheet != null) {
      templateWorkbook.deleteSheet(oldSheet)
    }

    const usedRange = sheet.usedRange()
    const oldValues = usedRange.value()

    const columnList = []
    const rowList = []
    let mergedCells

    if (sheet._mergeCells != null) {
      mergedCells = Object.keys(sheet._mergeCells).reduce((acu, address) => {
        acu[address] = false
        return acu
      }, {})
    }

    // copying the values
    newSheetInTemplateWorkbook.range(usedRange.address()).value(oldValues)

    // propagating styles, merged cells, and formulas
    usedRange.cells().forEach((cells) => {
      cells.forEach((cell) => {
        if (!columnList.includes(cell.columnNumber())) {
          columnList.push(cell.columnNumber())
        }

        if (!rowList.includes(cell.rowNumber())) {
          rowList.push(cell.rowNumber())
        }

        const mergedAddress = getRangeAddressIfMergedCell(mergedCells, cell)

        if (mergedAddress != null && mergedCells[mergedAddress] === true) {
          // don't process cells that are merged already
          return
        }

        const targetCell = newSheetInTemplateWorkbook.cell(cell.rowNumber(), cell.columnNumber())

        // applying formula if some exists in the cell
        if (cell.formula() != null && cell.formula() !== 'SHARED') {
          targetCell.formula(cell.formula())
        }

        // copying number format style to be able to preserve date format or some ther custom format
        if (cell.style('numberFormat') != null) {
          targetCell.style('numberFormat', cell.style('numberFormat'))
        }

        const stylesToApply = {}

        getXlsxStyleNames().forEach((styleName) => {
          if (cell.style(styleName) != null) {
            stylesToApply[styleName] = cell.style(styleName)
          }
        })

        if (mergedAddress != null) {
          const range = newSheetInTemplateWorkbook.range(mergedAddress).merged(true)

          if (Object.keys(stylesToApply).length > 0) {
            range.style(stylesToApply)
          }

          mergedCells[mergedAddress] = true
        } else {
          if (Object.keys(stylesToApply).length > 0) {
            targetCell.style(stylesToApply)
          }
        }
      })
    })

    columnList.forEach((columnNumber) => {
      const column = sheet.column(columnNumber)

      // applying colum width and row height
      if (column.width() != null) {
        newSheetInTemplateWorkbook.column(columnNumber).width(column.width())
      }
    })

    rowList.forEach((rowNumber) => {
      const row = sheet.row(rowNumber)

      if (row.height() != null) {
        newSheetInTemplateWorkbook.row(rowNumber).height(row.height())
      }
    })
  })

  await writeFileAsync(response.stream.path, await templateWorkbook.outputAsync())

  reporter.logger.debug(`Merging html-to-xlsx result (${sheetsInTableWorkbook.length} sheet(s)) into xlsx template ended`, request)

  response.stream = fs.createReadStream(response.stream.path)
}

function getRangeAddressIfMergedCell (mergedCells, cell) {
  if (!mergedCells || Object.keys(mergedCells).length === 0) {
    return
  }

  const sheet = cell.sheet()

  let addressFound

  Object.keys(mergedCells).some((address) => {
    const parts = address.split(':')
    const startCell = sheet.cell(parts[0])
    const endCell = sheet.cell(parts[1])

    if (
      (
        cell.columnNumber() >= startCell.columnNumber() &&
        cell.columnNumber() <= endCell.columnNumber()
      ) && (
        cell.rowNumber() >= startCell.rowNumber() &&
        cell.rowNumber() <= endCell.rowNumber()
      )
    ) {
      addressFound = address
      return true
    }
  })

  return addressFound
}
