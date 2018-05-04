const util = require('util')
const httpRequest = require('request')
const toArray = require('stream-to-array')
const toArrayAsync = util.promisify(toArray)

const preview = (request, response, options) => {
  return new Promise((resolve, reject) => {
    const req = httpRequest.post(options.publicUriForPreview || 'http://jsreport.net/temp', (err, resp, body) => {
      if (err) {
        return reject(err)
      }
      const iframe = '<iframe style="height:100%;width:100%" src="https://view.officeapps.live.com/op/view.aspx?src=' +
        encodeURIComponent((options.publicUriForPreview || 'http://jsreport.net/temp') + '/' + body) + '" />'
      const title = request.template.name || 'jsreport'
      const html = '<html><head><title>' + title + '</title><body>' + iframe + '</body></html>'
      response.content = Buffer.from(html)
      response.meta.contentType = 'text/html'
      // sometimes files is not completely flushed and excel online cannot find it immediately
      setTimeout(function () {
        resolve()
      }, 500)
    })

    const form = req.form()
    form.append('file', response.stream)
    response.meta.contentType = 'text/html'
  })
}

module.exports = async (previewOptions = {}, request, response) => {
  if (request.options.preview && previewOptions.previewInExcelOnline !== false) {
    return preview(request, response, previewOptions)
  }

  response.meta.contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  response.meta.contentDisposition = 'inline; filename="report.xlsx"'
  response.meta.fileExtension = 'xlsx'

  response.content = Buffer.concat(await toArrayAsync(response.stream))
}
