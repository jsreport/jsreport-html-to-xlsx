import Properties, { LegacyProperties } from './HtmlToXlsxProperties'
import XlsxTemplateProperties from './XlsxTemplateProperties'
import Studio from 'jsreport-studio'

Studio.addPropertiesComponent('html to xlsx', LegacyProperties, (entity) => entity.__entitySet === 'templates' && entity.recipe === 'html-to-xlsx')
Studio.addPropertiesComponent('html to better xlsx', Properties, (entity) => entity.__entitySet === 'templates' && entity.recipe === 'html-to-better-xlsx')
Studio.addPropertiesComponent(XlsxTemplateProperties.title, XlsxTemplateProperties, (entity) => entity.__entitySet === 'templates' && entity.recipe === 'html-to-better-xlsx' && entity.htmlToXlsx && entity.htmlToXlsx.insertToXlsxTemplate === true)

Studio.addApiSpec({
  template: {
    htmlToXlsx: {
      htmlEngine: '...'
    }
  }
})
