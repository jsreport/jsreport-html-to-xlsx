const path = require('path')
const fs = require('fs')
const { response } = require('jsreport-office')
const htmlToXlsx = require('html-to-xlsx')

module.exports = (reporter, definition) => async (req, res) => {
  const htmlEngines = definition.options.htmlEngines
  const htmlToXlsxOptions = req.template.htmlToXlsx || {}

  if (htmlToXlsxOptions.htmlEngine == null) {
    if (htmlEngines.includes('chrome')) {
      htmlToXlsxOptions.htmlEngine = 'chrome'
    } else if (htmlEngines.includes('phantom')) {
      htmlToXlsxOptions.htmlEngine = 'phantom'
    } else {
      htmlToXlsxOptions.htmlEngine = 'cheerio'
    }
  }

  const chromeOptions = {
    conversion: Object.assign({}, reporter.options.chrome, definition.options),
    eval: Object.assign({}, reporter.options.chrome, definition.options.chrome)
  }

  Object.assign(chromeOptions.eval, {
    ...(chromeOptions.eval.launchOptions || {}),
    args: [
      `--window-size=12800000000000,1024`,
      ...(
        chromeOptions.eval.launchOptions && chromeOptions.eval.launchOptions.args ? chromeOptions.eval.launchOptions.args : []
      )
    ]
  })

  const phantomEvalOptions = {
    tmpDir: definition.options.tmpDir,
    clean: false
  }

  const cheerioOptions = {
    conversion: Object.assign({}, definition.options)
  }

  if (reporter.options.phantom && reporter.options.phantom.path) {
    // global phantom path possible filled in future by compilation
    phantomEvalOptions.phantomPath = reporter.options.phantom.path
  }

  const phantomOptions = {
    conversion: Object.assign({}, definition.options),
    eval: phantomEvalOptions
  }

  const conversionOptions = {}

  if (htmlToXlsxOptions.htmlEngine === 'cheerio') {
    conversionOptions.defaults = {
      fontFamily: 'Calibri',
      fontSize: '16px',
      verticalAlign: 'middle'
    }
  } else {
    conversionOptions.styles = [`
      * {
        font-family: Calibri;
        font-size: 16px;
      }
    `]

    conversionOptions.scriptFn = htmlToXlsx.getScriptFn()
    conversionOptions.waitForJS = htmlToXlsxOptions.waitForJS
    conversionOptions.waitForJSVarName = 'JSREPORT_READY_TO_START'
  }

  reporter.logger.info('html-to-xlsx generation is starting', req)

  let xlsxTemplateBuf

  if (htmlToXlsxOptions.insertToXlsxTemplate === true) {
    if (!req.template.baseXlsxTemplate) {
      throw reporter.createError('No base xlsx template specified, make sure to set one when "htmlToXlsx.insertToXlsxTemplate" option is true', {
        weak: true
      })
    }

    if (req.template.baseXlsxTemplate.templateAsset && req.template.baseXlsxTemplate.templateAsset.content) {
      xlsxTemplateBuf = Buffer.from(req.template.baseXlsxTemplate.templateAsset.content, req.template.baseXlsxTemplate.templateAsset.encoding || 'utf8')
    } else if (req.template.baseXlsxTemplate.content) {
      xlsxTemplateBuf = Buffer.from(req.template.baseXlsxTemplate.content, 'base64')
    } else {
      if (!req.template.baseXlsxTemplate.shortid && !req.template.baseXlsxTemplate.templateAssetShortid) {
        throw reporter.createError('No base xlsx template specified, make sure to set one when "htmlToXlsx.insertToXlsxTemplate" option is true', {
          weak: true
        })
      }

      let docs

      if (req.template.baseXlsxTemplate.templateAssetShortid) {
        docs = await reporter.documentStore.collection('assets').find({
          shortid: req.template.baseXlsxTemplate.templateAssetShortid
        }, req)
      } else {
        docs = await reporter.documentStore.collection('xlsxTemplates').find({
          shortid: req.template.baseXlsxTemplate.shortid
        }, req)
      }

      if (!docs.length) {
        throw reporter.createError(`Unable to find xlsx template with shortid ${req.template.baseXlsxTemplate.shortid}`, {
          statusCode: 404
        })
      }

      if (req.template.baseXlsxTemplate.templateAssetShortid) {
        xlsxTemplateBuf = docs[0].content
      } else {
        xlsxTemplateBuf = docs[0].contentRaw
      }
    }
  }

  const result = await reporter.executeScript(
    {
      tmpDir: definition.options.tmpDir,
      htmlEngine: htmlToXlsxOptions.htmlEngine,
      html: res.content.toString(),
      xlsxTemplateContent: xlsxTemplateBuf,
      chromeOptions,
      phantomOptions,
      cheerioOptions,
      conversionOptions
    },
    {
      execModulePath: path.join(__dirname, 'scriptHtmlToXlsxProcessing.js'),
      timeoutErrorMessage: 'Timeout during execution of html-to-xlsx recipe'
    },
    req
  )

  if (result.logs) {
    result.logs.forEach(m => {
      reporter.logger[m.level](m.message, { ...req, timestamp: m.timestamp })
    })
  }

  if (result.error) {
    const error = new Error(result.error.message)
    error.stack = result.error.stack

    throw reporter.createError('Error while executing html-to-xlsx recipe', {
      original: error,
      weak: true
    })
  }

  reporter.logger.info('html-to-xlsx generation was finished', req)

  res.stream = fs.createReadStream(result.htmlToXlsxFilePath)

  return response({
    previewOptions: definition.options.preview,
    officeDocumentType: 'xlsx',
    stream: res.stream
  }, req, res)
}
