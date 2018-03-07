
module.exports = () => {
  const htmlEngines = {}

  const puppeteer = getModule('puppeteer')

  if (puppeteer) {
    htmlEngines.chrome = puppeteer
  }

  const phantomjsPrebuilt = getModule('phantomjs-prebuilt')

  if (phantomjsPrebuilt) {
    htmlEngines.phantom = phantomjsPrebuilt
  } else {
    const phantomjs = getModule('phantomjs')

    if (phantomjs) {
      htmlEngines.phantom = phantomjs
    }
  }

  return htmlEngines
}

function getModule (moduleName) {
  let pkgExport

  try {
    pkgExport = require(moduleName)

    return pkgExport
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      return pkgExport
    }

    throw err
  }
}
