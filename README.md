# jsreport-html-to-xlsx
[![NPM Version](http://img.shields.io/npm/v/jsreport-html-to-xlsx.svg?style=flat-square)](https://npmjs.com/package/jsreport-html-to-xlsx)

jsreport recipe capable of converting html into excel

See http://jsreport.net/learn/html-to-xlsx

##Installation

> **npm install jsreport-html-to-xlsx**

##Usage
To use `recipe` in for template rendering set `template.recipe=html-to-xlsx` in the rendering request.

```js
{
  template: { content: '...', recipe: 'html-to-xlsx', enginne: '...' }
}
```

##jsreport-core
You can apply this extension also manually to [jsreport-core](https://github.com/jsreport/jsreport-core)

```js
var jsreport = require('jsreport-core')()
jsreport.use(require('jsreport-html-to-xlsx')())
```
