import React, { Component } from 'react'
import Studio from 'jsreport-studio'

class Properties extends Component {
  render () {
    const { entity, onChange } = this.props
    const htmlToXlsx = entity.htmlToXlsx || {}
    const htmlEngines = Studio.extensions['html-to-xlsx'].options.htmlEngines

    const changeHtmlToXlsx = (change) => onChange({
      ...entity,
      htmlToXlsx: { ...entity.htmlToXlsx, ...change }
    })

    return (
      <div className='properties-section'>
        <div className='form-group'>
          <label>html engine</label>
          <select
            value={htmlToXlsx.htmlEngine || htmlEngines[0]}
            onChange={(v) => changeHtmlToXlsx({ htmlEngine: v.target.value })}
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
