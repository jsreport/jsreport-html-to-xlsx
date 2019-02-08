import React, { Component } from 'react'
import Studio from 'jsreport-studio'

const EntityRefSelect = Studio.EntityRefSelect

class Properties extends Component {
  static selectXlsxTemplates (entities) {
    return Object.keys(entities).filter((k) => entities[k].__entitySet === 'xlsxTemplates').map((k) => entities[k])
  }

  static title (entity, entities) {
    if (!entity.baseXlsxTemplate || !entity.baseXlsxTemplate.shortid) {
      return 'xlsx template'
    }

    const foundItems = Properties.selectXlsxTemplates(entities).filter((e) => entity.baseXlsxTemplate.shortid === e.shortid)

    if (!foundItems.length) {
      return 'xlsx template'
    }

    return 'xlsx template: ' + foundItems[0].name
  }

  constructor (props) {
    super(props)

    this.applyDefaultsToEntity = this.applyDefaultsToEntity.bind(this)
    this.changeHtmlToXlsx = this.changeHtmlToXlsx.bind(this)
  }

  componentDidMount () {
    this.applyDefaultsToEntity(this.props)
    this.removeInvalidXlsxTemplateReferences()
  }

  componentWillReceiveProps (nextProps) {
    // when component changes because another template is created
    if (this.props.entity._id !== nextProps.entity._id) {
      this.applyDefaultsToEntity(nextProps)
    }
  }

  componentDidUpdate () {
    this.removeInvalidXlsxTemplateReferences()
  }

  removeInvalidXlsxTemplateReferences () {
    const { entity, entities, onChange } = this.props

    if (!entity.baseXlsxTemplate) {
      return
    }

    const updatedXlsxTemplates = Object.keys(entities).filter((k) => entities[k].__entitySet === 'xlsxTemplates' && entities[k].shortid === entity.baseXlsxTemplate.shortid)

    if (updatedXlsxTemplates.length === 0) {
      onChange({ _id: entity._id, baseXlsxTemplate: null })
    }
  }

  applyDefaultsToEntity (props) {
    const { entity } = props
    const htmlEngines = Studio.extensions['html-to-xlsx'].options.htmlEngines
    let entityNeedsDefault = false

    if (
      entity.__isNew ||
      (entity.htmlToXlsx == null || entity.htmlToXlsx.htmlEngine == null)
    ) {
      entityNeedsDefault = true
    }

    if (htmlEngines != null && htmlEngines[0] != null && entityNeedsDefault) {
      this.changeHtmlToXlsx(props, {
        htmlEngine: htmlEngines[0]
      })
    }
  }

  changeHtmlToXlsx (props, change) {
    const { entity, onChange } = props
    const htmlToXlsx = entity.htmlToXlsx || {}

    onChange({
      ...entity,
      htmlToXlsx: { ...htmlToXlsx, ...change }
    })
  }

  render () {
    const { entity, onChange } = this.props
    const htmlToXlsx = entity.htmlToXlsx || {}
    const htmlEngines = Studio.extensions['html-to-xlsx'].options.htmlEngines

    return (
      <div className='properties-section'>
        <div className='form-group'>
          <label>html engine</label>
          <select
            value={htmlToXlsx.htmlEngine}
            onChange={(v) => this.changeHtmlToXlsx(this.props, { htmlEngine: v.target.value })}
          >
            {htmlEngines.map((engine) => (
              <option key={engine} value={engine}>{engine}</option>
            ))}
          </select>
        </div>
        <div className='form-group'>
          <label>insert table output to xlsx template</label>
          <input
            type='checkbox' checked={htmlToXlsx.insertToXlsxTemplate === true}
            onChange={(v) => this.changeHtmlToXlsx(this.props, { insertToXlsxTemplate: v.target.checked })} />
        </div>
        {htmlToXlsx.insertToXlsxTemplate === true && (
          <div className='form-group'>
            <label>xlsx template</label>
            <EntityRefSelect
              headingLabel='Select xlsx template'
              filter={(references) => ({ xlsxTemplates: references.xlsxTemplates })}
              value={entity.baseXlsxTemplate ? entity.baseXlsxTemplate.shortid : null}
              onChange={(selected) => onChange({ _id: entity._id, baseXlsxTemplate: selected != null && selected.length > 0 ? { shortid: selected[0].shortid } : null })}
            />
          </div>
        )}
        <div className='form-group'>
          <label title='window.JSREPORT_READY_TO_START=true;'>wait for conversion trigger</label>
          <input
            type='checkbox' title='window.JSREPORT_READY_TO_START=true;' checked={htmlToXlsx.waitForJS === true}
            onChange={(v) => this.changeHtmlToXlsx(this.props, { waitForJS: v.target.checked })} />
        </div>
      </div>
    )
  }
}

export default Properties
