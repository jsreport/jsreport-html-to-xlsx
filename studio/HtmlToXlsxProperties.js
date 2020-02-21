import React, { Component } from 'react'
import Studio from 'jsreport-studio'

const EntityRefSelect = Studio.EntityRefSelect

class Properties extends Component {
  static selectXlsxTemplates (entities) {
    return Object.keys(entities).filter((k) => entities[k].__entitySet === 'xlsxTemplates').map((k) => entities[k])
  }

  static selectAssets (entities) {
    return Object.keys(entities).filter((k) => entities[k].__entitySet === 'assets').map((k) => entities[k])
  }

  static title (entity, entities) {
    if (
      !entity.baseXlsxTemplate ||
      (!entity.baseXlsxTemplate.shortid && !entity.baseXlsxTemplate.templateAssetShortid)
    ) {
      return 'xlsx template'
    }

    const foundItems = Properties.selectXlsxTemplates(entities).filter((e) => entity.baseXlsxTemplate.shortid === e.shortid)
    const foundAssets = Properties.selectAssets(entities).filter((e) => entity.baseXlsxTemplate.templateAssetShortid === e.shortid)

    if (!foundItems.length && !foundAssets.length) {
      return 'xlsx template'
    }

    let name

    if (foundAssets.length) {
      name = foundAssets[0].name
    } else {
      name = foundItems[0].name
    }

    return 'xlsx template: ' + name
  }

  constructor (props) {
    super(props)

    this.applyDefaultsToEntity = this.applyDefaultsToEntity.bind(this)
    this.changeHtmlToXlsx = this.changeHtmlToXlsx.bind(this)
  }

  componentDidMount () {
    this.applyDefaultsToEntity(this.props)
    this.removeInvalidHtmlEngine()
    this.removeInvalidXlsxTemplateReferences()
  }

  componentWillReceiveProps (nextProps) {
    // when component changes because another template is created
    if (this.props.entity._id !== nextProps.entity._id) {
      this.applyDefaultsToEntity(nextProps)
    }
  }

  componentDidUpdate () {
    this.removeInvalidHtmlEngine()
    this.removeInvalidXlsxTemplateReferences()
  }

  removeInvalidXlsxTemplateReferences () {
    const { entity, entities, onChange } = this.props

    if (!entity.baseXlsxTemplate) {
      return
    }

    const updatedXlsxTemplates = Object.keys(entities).filter((k) => entities[k].__entitySet === 'xlsxTemplates' && entities[k].shortid === entity.baseXlsxTemplate.shortid)
    const updatedXlsxAssets = Object.keys(entities).filter((k) => entities[k].__entitySet === 'assets' && entities[k].shortid === entity.baseXlsxTemplate.templateAssetShortid)

    const newXlsxTemplate = { ...entity.baseXlsxTemplate }
    let changed = false

    if (entity.baseXlsxTemplate.shortid && updatedXlsxTemplates.length === 0) {
      changed = true
      newXlsxTemplate.shortid = null
    }

    if (entity.baseXlsxTemplate.templateAssetShortid && updatedXlsxAssets.length === 0) {
      changed = true
      newXlsxTemplate.templateAssetShortid = null
    }

    if (changed) {
      onChange({ _id: entity._id, baseXlsxTemplate: Object.keys(newXlsxTemplate).length ? newXlsxTemplate : null })
    }
  }

  removeInvalidHtmlEngine () {
    const { entity } = this.props

    if (!entity.htmlToXlsx || !entity.htmlToXlsx.htmlEngine) {
      return
    }

    const htmlEngines = Studio.extensions['html-to-xlsx'].options.htmlEngines
    const isValidHtmlEngine = htmlEngines.includes(entity.htmlToXlsx.htmlEngine)

    if (!isValidHtmlEngine) {
      this.changeHtmlToXlsx(this.props, { htmlEngine: htmlEngines[0] })
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

  changeBaseXlsxTemplate (oldXlsxTemplate, prop, value) {
    let newValue

    if (value == null) {
      newValue = { ...oldXlsxTemplate }
      newValue[prop] = null
    } else {
      return { ...oldXlsxTemplate, [prop]: value }
    }

    newValue = Object.keys(newValue).length ? newValue : null

    return newValue
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
            <label>xlsx asset</label>
            <EntityRefSelect
              headingLabel='Select xlsx template'
              filter={(references) => ({ data: references.assets })}
              value={entity.baseXlsxTemplate ? entity.baseXlsxTemplate.templateAssetShortid : null}
              onChange={(selected) => onChange({
                _id: entity._id,
                baseXlsxTemplate: this.changeBaseXlsxTemplate(this.props.entity.baseXlsxTemplate, 'templateAssetShortid', selected != null && selected.length > 0 ? selected[0].shortid : null)
              })}
            />
          </div>
        )}
        {htmlToXlsx.insertToXlsxTemplate === true && (
          <div className='form-group'>
            <label>xlsx template (deprecated)</label>
            <EntityRefSelect
              headingLabel='Select xlsx template'
              filter={(references) => ({ xlsxTemplates: references.xlsxTemplates })}
              value={entity.baseXlsxTemplate ? entity.baseXlsxTemplate.shortid : null}
              onChange={(selected) => onChange({
                _id: entity._id,
                baseXlsxTemplate: this.changeBaseXlsxTemplate(this.props.entity.baseXlsxTemplate, 'shortid', selected != null && selected.length > 0 ? selected[0].shortid : null)
              })}
            />
          </div>
        )}
        {htmlToXlsx.htmlEngine !== 'cheerio' && (
          <div className='form-group'>
            <label title='window.JSREPORT_READY_TO_START=true;'>wait for conversion trigger</label>
            <input
              type='checkbox' title='window.JSREPORT_READY_TO_START=true;' checked={htmlToXlsx.waitForJS === true}
              onChange={(v) => this.changeHtmlToXlsx(this.props, { waitForJS: v.target.checked })} />
          </div>
        )}
      </div>
    )
  }
}

export default Properties
