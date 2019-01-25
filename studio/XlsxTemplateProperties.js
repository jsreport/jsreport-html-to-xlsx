import React, { Component } from 'react'
import Studio from 'jsreport-studio'

const EntityRefSelect = Studio.EntityRefSelect

export default class XlsxTemplateProperties extends Component {
  static selectItems (entities) {
    return Object.keys(entities).filter((k) => entities[k].__entitySet === 'xlsxTemplates').map((k) => entities[k])
  }

  static title (entity, entities) {
    if (!entity.baseXlsxTemplate || !entity.baseXlsxTemplate.shortid) {
      return 'xlsx template'
    }

    const foundItems = XlsxTemplateProperties.selectItems(entities).filter((e) => entity.baseXlsxTemplate.shortid === e.shortid)

    if (!foundItems.length) {
      return 'xlsx template'
    }

    return 'xlsx template: ' + foundItems[0].name
  }

  componentDidMount () {
    this.removeInvalidXlsxTemplateReferences()
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

  render () {
    const { entity, onChange } = this.props

    return (
      <div className='properties-section'>
        <div className='form-group'>
          <EntityRefSelect
            headingLabel='Select xlsx template'
            filter={(references) => ({ xlsxTemplates: references.xlsxTemplates })}
            value={entity.baseXlsxTemplate ? entity.baseXlsxTemplate.shortid : null}
            onChange={(selected) => onChange({ _id: entity._id, baseXlsxTemplate: selected != null && selected.length > 0 ? { shortid: selected[0].shortid } : null })}
          />
        </div>
      </div>
    )
  }
}
