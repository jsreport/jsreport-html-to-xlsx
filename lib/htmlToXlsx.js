﻿/*! 
 * Copyright(c) 2014 Jan Blaha
 *
 * html-to-xlsx recipe transforms html into xlsx. The process is based on extracting html and css attributes
 * using phantomjs and then assembling excel Open XML.
 */

var path = require("path"),
    q = require("q"),
    extend = require("node.extend");

var conversion;

module.exports = function (reporter, definition) {
    reporter.extensionsManager.recipes.push({
        name: "html-to-xlsx",
        execute: function (request, response) {
            return q.nfcall(conversion, response.content.toString()).then(function (stream) {
                response.stream = stream;
                return reporter.xlsx.responseXlsx(request, response);
            });
        }
    });

    if (!conversion) {
        reporter.options.phantom = reporter.options.phantom || {};
        var options = extend(true, {}, reporter.options.phantom);
        delete options.pathToPhantomScript;
        conversion = require("html-to-xlsx")(options);
    }
};