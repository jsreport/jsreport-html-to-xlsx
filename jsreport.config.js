
module.exports = {
  'name': 'html-to-xlsx',
  'main': 'lib/htmlToXlsx.js',
  'optionsSchema': {
    extensions: {
      'html-to-xlsx': {
        type: 'object',
        properties: {
          previewInExcelOnline: { type: 'boolean' },
          publicUriForPreview: { type: 'string' },
          chrome: {
            type: 'object',
            properties: {
              timeout: { type: 'number' },
              launchOptions: {
                type: 'object',
                properties: {
                  args: {
                    anyOf: [{
                      type: 'string',
                      '$jsreport-constantOrArray': []
                    }, {
                      type: 'array',
                      items: { type: 'string' }
                    }]
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  'dependencies': ['templates', 'xlsx'],
  'hasPublicPart': false
}
