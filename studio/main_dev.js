import Properties, { LegacyProperties } from './HtmlToXlsxProperties'
import Studio from 'jsreport-studio'

Studio.addPropertiesComponent('html to xlsx', LegacyProperties, (entity) => entity.__entitySet === 'templates' && entity.recipe === 'html-to-xlsx')
Studio.addPropertiesComponent('html to better xlsx', Properties, (entity) => entity.__entitySet === 'templates' && entity.recipe === 'html-to-better-xlsx')

Studio.addApiSpec({
  template: {
    htmlToXlsx: {
      htmlEngine: '...'
    }
  }
})
