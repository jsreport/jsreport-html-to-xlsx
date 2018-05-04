import Properties from './HtmlToXlsxProperties'
import Studio from 'jsreport-studio'

Studio.addPropertiesComponent('html to xlsx', Properties, (entity) => entity.__entitySet === 'templates' && entity.recipe === 'html-to-xlsx')

Studio.addApiSpec({
  template: {
    htmlToXlsx: {
      htmlEngine: '...'
    }
  }
})
