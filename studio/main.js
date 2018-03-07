/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _HtmlToXlsxProperties = __webpack_require__(1);
	
	var _HtmlToXlsxProperties2 = _interopRequireDefault(_HtmlToXlsxProperties);
	
	var _jsreportStudio = __webpack_require__(3);
	
	var _jsreportStudio2 = _interopRequireDefault(_jsreportStudio);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	_jsreportStudio2.default.addPropertiesComponent('html to xlsx', _HtmlToXlsxProperties2.default, function (entity) {
	  return entity.__entitySet === 'templates' && entity.recipe === 'html-to-xlsx';
	});
	
	_jsreportStudio2.default.addApiSpec({
	  template: {
	    htmlToXlsx: {
	      htmlEngine: '...'
	    }
	  }
	});

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };
	
	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
	
	var _react = __webpack_require__(2);
	
	var _react2 = _interopRequireDefault(_react);
	
	var _jsreportStudio = __webpack_require__(3);
	
	var _jsreportStudio2 = _interopRequireDefault(_jsreportStudio);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }
	
	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
	
	var Properties = function (_Component) {
	  _inherits(Properties, _Component);
	
	  function Properties(props) {
	    _classCallCheck(this, Properties);
	
	    var _this = _possibleConstructorReturn(this, (Properties.__proto__ || Object.getPrototypeOf(Properties)).call(this, props));
	
	    _this.changeHtmlToXlsx = _this.changeHtmlToXlsx.bind(_this);
	    return _this;
	  }
	
	  _createClass(Properties, [{
	    key: 'componentWillMount',
	    value: function componentWillMount() {
	      var entity = this.props.entity;
	
	      var htmlEngines = _jsreportStudio2.default.extensions['html-to-xlsx'].options.htmlEngines;
	
	      if (entity.__isNew && htmlEngines != null && htmlEngines[0] != null) {
	        this.changeHtmlToXlsx({
	          htmlEngine: htmlEngines[0]
	        });
	      }
	    }
	  }, {
	    key: 'changeHtmlToXlsx',
	    value: function changeHtmlToXlsx(change) {
	      var _props = this.props,
	          entity = _props.entity,
	          onChange = _props.onChange;
	
	      var htmlToXlsx = entity.htmlToXlsx || {};
	
	      onChange(_extends({}, entity, {
	        htmlToXlsx: _extends({}, htmlToXlsx, change)
	      }));
	    }
	  }, {
	    key: 'render',
	    value: function render() {
	      var _this2 = this;
	
	      var entity = this.props.entity;
	
	      var htmlToXlsx = entity.htmlToXlsx || {};
	      var htmlEngines = _jsreportStudio2.default.extensions['html-to-xlsx'].options.htmlEngines;
	
	      return _react2.default.createElement(
	        'div',
	        { className: 'properties-section' },
	        _react2.default.createElement(
	          'div',
	          { className: 'form-group' },
	          _react2.default.createElement(
	            'label',
	            null,
	            'html engine'
	          ),
	          _react2.default.createElement(
	            'select',
	            {
	              value: htmlToXlsx.htmlEngine,
	              onChange: function onChange(v) {
	                return _this2.changeHtmlToXlsx({ htmlEngine: v.target.value });
	              }
	            },
	            htmlEngines.map(function (engine) {
	              return _react2.default.createElement(
	                'option',
	                { key: engine, value: engine },
	                engine
	              );
	            })
	          )
	        )
	      );
	    }
	  }]);
	
	  return Properties;
	}(_react.Component);
	
	exports.default = Properties;

/***/ },
/* 2 */
/***/ function(module, exports) {

	module.exports = Studio.libraries['react'];

/***/ },
/* 3 */
/***/ function(module, exports) {

	module.exports = Studio;

/***/ }
/******/ ]);