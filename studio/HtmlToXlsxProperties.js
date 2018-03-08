import React, { Component } from 'react'
import Studio from 'jsreport-studio'

class Properties extends Component {
  constructor (props) {
    super(props)

    this.applyDefaultToEntity = this.applyDefaultToEntity.bind(this)
    this.changeHtmlToXlsx = this.changeHtmlToXlsx.bind(this)
  }

  componentDidMount () {
    const { entity } = this.props

    this.applyDefaultToEntity(entity)
  }

  componentWillReceiveProps (nextProps) {
    // when component changes because another template is created
    if (this.props.entity._id !== nextProps.entity._id) {
      this.applyDefaultToEntity(nextProps.entity)
    }
  }

  applyDefaultToEntity (entity) {
    const htmlEngines = Studio.extensions['html-to-xlsx'].options.htmlEngines
    let entityNeedsDefault = false

    if (
      entity.__isNew ||
      (entity.htmlToXlsx == null || entity.htmlToXlsx.htmlEngine == null)
    ) {
      entityNeedsDefault = true
    }

    if (htmlEngines != null && htmlEngines[0] != null && entityNeedsDefault) {
      this.changeHtmlToXlsx({
        htmlEngine: htmlEngines[0]
      })
    }
  }

  changeHtmlToXlsx (change) {
    const { entity, onChange } = this.props
    const htmlToXlsx = entity.htmlToXlsx || {}

    onChange({
      ...entity,
      htmlToXlsx: { ...htmlToXlsx, ...change }
    })
  }

  render () {
    const { entity } = this.props
    const htmlToXlsx = entity.htmlToXlsx || {}
    const htmlEngines = Studio.extensions['html-to-xlsx'].options.htmlEngines

    return (
      <div className='properties-section'>
        <div className='form-group'>
          <label>html engine</label>
          <select
            value={htmlToXlsx.htmlEngine}
            onChange={(v) => this.changeHtmlToXlsx({ htmlEngine: v.target.value })}
          >
            {htmlEngines.map((engine) => (
              <option key={engine} value={engine}>{engine}</option>
            ))}
          </select>
        </div>
      </div>
    )
  }
}

export default Properties
