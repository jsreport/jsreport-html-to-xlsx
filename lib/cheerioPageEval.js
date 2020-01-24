const path = require('path')
const fs = require('fs')
const Cornet = require('cornet')
const cheerio = require('cheerio')
const htmlparser2 = require('htmlparser2')
const tinycolor = require('tinycolor2')
const pEachSeries = require('p-each-series')

module.exports = (tmpDir, defaultFont) => {
  return async function cheerioEval ({ html, defaults, ...restOptions }) {
    const tablesOutput = []
    const $ = cheerio.load(html)

    const tableNames = []
    const tablesWithoutName = []
    const styleCache = new Map()

    $('table').each((idx, tableEl) => {
      const $table = $(tableEl)
      const tableOut = { rows: [], placeholders: [] }
      let rowsCount = 0

      const nameAttr = $table.attr('name')
      const dataSheetName = $table.data('sheet-name')
      const dataIgnoreName = $table.data('ignore-sheet-name')

      if (dataIgnoreName == null) {
        if (dataSheetName != null) {
          tableOut.name = dataSheetName
        } else if (nameAttr != null) {
          tableOut.name = nameAttr
        }
      }

      if (tableOut.name == null) {
        tablesWithoutName.push(tableOut)
      } else {
        tableNames.push(tableOut.name)
      }

      $table.find('tr').each((_rowIndex, rowEl) => {
        const $row = $(rowEl)

        if ($row.data('rows-placeholder') != null) {
          const totalRowsInPlaceholder = parseInt($row.data('total-rows'), 10)

          tableOut.rows.push({
            files: $row.data('files').split(',')
          })

          rowsCount += totalRowsInPlaceholder

          return
        }

        const row = extractRowInformation(rowEl, { $, defaultFont, styleCache, defaults })

        rowsCount++

        if (row.length === 0) {
          return
        }

        tableOut.rows.push(row)
      })

      tableOut.rowsCount = rowsCount

      tablesOutput.push(tableOut)
    })

    let currentIndex = 0
    let targetTableName

    for (let i = 0; i < tablesWithoutName.length; i++) {
      do {
        currentIndex++
        targetTableName = 'Sheet' + currentIndex
      } while (tableNames.indexOf(targetTableName) !== -1)

      tablesWithoutName[i].name = targetTableName
    }

    let completed = 0
    const tablesCount = tablesOutput.length

    return tablesOutput.map((tableOut) => ({
      name: tableOut.name,
      getRows: async (rowCb) => {
        await pEachSeries(tableOut.rows, async (row) => {
          const isRowsPlaceholder = !Array.isArray(row)

          if (!isRowsPlaceholder) {
            rowCb(row)
          } else {
            await extractRowsFromPlaceholder(
              row,
              rowCb,
              {
                tmpDir,
                defaultFont,
                styleCache,
                defaults
              }
            )
          }
        })

        completed++

        if (tablesCount === completed) {
          styleCache.clear()
        }
      },
      rowsCount: tableOut.rowsCount
    }))
  }
}

async function extractRowsFromPlaceholder (placeholder, onRow, { tmpDir, defaultFont, styleCache, defaults }) {
  await pEachSeries(placeholder.files, async (file) => {
    const filePath = path.join(tmpDir, file)
    const $ = cheerio
    const cornet = new Cornet()

    await new Promise((resolve, reject) => {
      const parser = new htmlparser2.WritableStream(cornet)
      const fileStream = fs.createReadStream(filePath)

      fileStream.on('error', reject)
      parser.on('error', reject)
      cornet.on('dom', resolve)

      cornet.select('tr', (rowEl) => {
        const row = extractRowInformation(rowEl, { $, defaultFont, styleCache, defaults })

        if (row.length === 0) {
          return
        }

        onRow(row)
      })

      fileStream.pipe(parser)
    })
  })
}

function extractRowInformation (rowEl, { $, defaultFont, styleCache, defaults }) {
  const row = []
  const $row = $(rowEl)
  const $cells = $row.find('th, td')

  if ($cells.length === 0) {
    // skip empty rows
    return row
  }

  $cells.each((_cellIndex, cellEl) => {
    const $cell = $(cellEl)
    const type = $cell.data('cell-type') != null && $cell.data('cell-type') !== '' ? $cell.data('cell-type').toLowerCase() : undefined
    const formatStr = $cell.data('cell-format-str') != null ? $cell.data('cell-format-str') : undefined
    const formatEnum = $cell.data('cell-format-enum') != null && !isNaN(parseInt($cell.data('cell-format-enum'), 10)) ? parseInt($cell.data('cell-format-enum'), 10) : undefined
    const cellText = $cell.text()

    const styleAttr = $cell.attr('style')
    let style = {}

    if (styleAttr) {
      if (styleCache.has(styleAttr)) {
        style = { ...styleCache.get(styleAttr) }
      } else {
        style = $cell.css([
          'width', 'height', 'background-color', 'color', 'font-family', 'font-size',
          'font-style', 'font-weight', 'text-decoration', 'vertical-align',
          'text-align', 'overflow', 'border', 'border-top', 'border-left',
          'border-right', 'border-bottom', 'border-top-color', 'boder-top-style', 'border-top-width',
          'border-left-color', 'boder-left-style', 'border-left-width',
          'border-right-color', 'boder-right-style', 'border-right-width',
          'border-bottom-color', 'boder-bottom-style', 'border-bottom-width',
          'padding', 'padding-top', 'padding-left', 'padding-right', 'padding-bottom'
        ])

        if (style['background-color']) {
          style['background-color'] = colorToRgb(style['background-color'])
        }

        if (style.color) {
          style.color = colorToRgb(style.color)
        }

        if (style['text-decoration']) {
          style['text-decoration'] = style['text-decoration'].split(' ')[0]
        }

        style.border = {
          ...parseBorderProperty(style, 'top'),
          ...parseBorderProperty(style, 'right'),
          ...parseBorderProperty(style, 'bottom'),
          ...parseBorderProperty(style, 'left')
        }

        style.padding = {
          ...parsePaddingProperty(style, 'top'),
          ...parsePaddingProperty(style, 'right'),
          ...parsePaddingProperty(style, 'bottom'),
          ...parsePaddingProperty(style, 'left')
        }

        styleCache.set(styleAttr, { ...style })
      }
    }

    style['font-family'] = style['font-family'] || defaults.fontFamily
    style['font-size'] = style['font-size'] || defaults.fontSize
    style['vertical-align'] = style['vertical-align'] || defaults.verticalAlign
    style['background-color'] = style['background-color'] || []
    style.color = style.color || []
    style.border = style.border || {}
    style.padding = style.padding || {}

    const fontSize = parsePx(style['font-size'])

    let fontBox

    const getFontDimension = (text, fontSize, side) => {
      const getWidth = (box) => box.x2 - box.x1
      const getHeight = (box) => box.y2 - box.y1

      if (fontBox) {
        return side === 'width' ? getWidth(fontBox) : getHeight(fontBox)
      }

      const fontPath = defaultFont.getPath(text, 0, 0, fontSize)
      fontBox = fontPath.getBoundingBox()

      return side === 'width' ? getWidth(fontBox) : getHeight(fontBox)
    }

    if (style.width == null) {
      style.width = getFontDimension(cellText, fontSize, 'width')
      style.width += parsePx(style.padding['padding-left']) + parsePx(style.padding['padding-right'])

      if (style.border.leftWidth) {
        style.width += parsePx(style.border.leftWidth)
      }

      if (style.border.rightWidth) {
        style.width += parsePx(style.border.rightWidth)
      }
    }

    if (style.height == null) {
      style.height = getFontDimension(cellText, fontSize, 'height')
      style.height += parsePx(style.padding['padding-top']) + parsePx(style.padding['padding-bottom'])

      if (style.border.topWidth) {
        style.height += parsePx(style.border.topWidth)
      }

      if (style.border.bottomWidth) {
        style.height += parsePx(style.border.bottomWidth)
      }
    }

    row.push({
      type,
      // returns the html inside the td element with special html characters like "&" escaped to &amp;
      value: $cell.html(),
      // returns just the real text inside the td element with special html characters like "&" left as it is
      valueText: cellText,
      formatStr,
      formatEnum,
      backgroundColor: style['background-color'],
      foregroundColor: style.color,
      fontFamily: style['font-family'],
      fontSize: style['font-size'],
      fontStyle: style['font-style'],
      fontWeight: style['font-weight'],
      textDecoration: {
        line: style['text-decoration']
      },
      verticalAlign: style['vertical-align'],
      horizontalAlign: style['text-align'],
      wrapText: style['overflow'],
      width: style.width,
      height: style.height,
      rowspan: $cell.attr('rowspan') != null ? parseInt($cell.attr('rowspan'), 10) : 1,
      colspan: $cell.attr('colspan') != null ? parseInt($cell.attr('colspan'), 10) : 1,
      border: style.border
    })
  })

  return row
}

function colorToRgb (colorInput, defaultColor) {
  const color = tinycolor(colorInput)
  let rgbValue

  if (!color.isValid()) {
    if (!defaultColor) {
      return
    }

    rgbValue = tinycolor(defaultColor).toRgb()
  } else {
    rgbValue = color.toRgb()
  }

  return [rgbValue.r, rgbValue.g, rgbValue.b, rgbValue.a]
}

function parsePx (value) {
  if (!value) {
    return 0
  }

  if (typeof value === 'number') {
    return value
  }

  const px = value.match(/([.\d]+)px/i)

  if (px && px.length === 2) {
    return parseFloat(px[1], 10)
  }

  return 0
}

function parsePaddingProperty (style, part) {
  const paddingValue = parsePaddingRule(style.padding)
  const paddingPartValue = parsePaddingRule(style[`padding-${part}`], true)

  const result = {}

  if (paddingPartValue) {
    result[`padding-${part}`] = paddingPartValue
  } else if (paddingValue && paddingValue[part]) {
    result[`padding-${part}`] = paddingValue[part]
  } else {
    result[`padding-${part}`] = '0px'
  }

  return result
}

function parseBorderProperty (style, part) {
  const borderValue = parseBorderRule(style.border)
  const borderPartValue = parseBorderRule(style[`border-${part}`])
  const partColorValue = style[`border-${part}-color`]
  const partStyleValue = style[`border-${part}-style`]
  const partWidthValue = style[`border-${part}-width`]

  const result = {}

  if (partColorValue) {
    result[`${part}Color`] = partColorValue
  } else if (borderPartValue && borderPartValue.color) {
    result[`${part}Color`] = borderPartValue.color
  } else if (borderValue && borderValue.color) {
    result[`${part}Color`] = borderValue.color
  }

  result[`${part}Color`] = colorToRgb(result[`${part}Color`], '#000')

  if (partStyleValue) {
    result[`${part}Style`] = partStyleValue
  } else if (borderPartValue && borderPartValue.style) {
    result[`${part}Style`] = borderPartValue.style
  } else if (borderValue && borderValue.style) {
    result[`${part}Style`] = borderValue.style
  } else {
    result[`${part}Style`] = 'none'
  }

  if (partWidthValue) {
    result[`${part}Width`] = partWidthValue
  } else if (borderPartValue && borderPartValue.width) {
    result[`${part}Width`] = borderPartValue.width
  } else if (borderValue && borderValue.width) {
    result[`${part}Width`] = borderValue.width
  } else {
    result[`${part}Width`] = '0px'
  }

  return result
}

function parseBorderRule (rule) {
  if (rule == null) {
    return
  }

  const result = rule.match(/(\S+)/g)

  if (result == null) {
    return
  }

  return {
    width: result[0],
    style: result[1],
    color: result[2]
  }
}

function parsePaddingRule (rule, single = false) {
  if (rule == null) {
    return
  }

  const result = rule.match(/(\S+)/g)

  if (result == null) {
    return
  }

  const values = {}

  if (single) {
    return result[0]
  }

  if (result.length === 1) {
    values.top = result[0]
    values.left = result[0]
    values.right = result[0]
    values.bottom = result[0]
  } else if (result.length === 2) {
    values.top = result[0]
    values.bottom = result[0]
    values.left = result[1]
    values.right = result[1]
  } else if (result.length === 3) {
    values.top = result[0]
    values.left = result[1]
    values.right = result[1]
    values.bottom = result[2]
  } else {
    values.top = result[0]
    values.right = result[1]
    values.bottom = result[2]
    values.left = result[3]
  }

  return values
}
