import React, { Component } from 'react'
import Studio from 'jsreport-studio'

class Properties extends Component {
  constructor (props) {
    super(props)

    this.changeHtmlToXlsx = this.changeHtmlToXlsx.bind(this)
  }

  componentWillMount () {
    const { entity } = this.props
    const htmlEngines = Studio.extensions['html-to-xlsx'].options.htmlEngines

    if (entity.__isNew && htmlEngines != null && htmlEngines[0] != null) {
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
