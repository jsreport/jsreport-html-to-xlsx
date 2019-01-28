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
	
	var _XlsxTemplateProperties = __webpack_require__(4);
	
	var _XlsxTemplateProperties2 = _interopRequireDefault(_XlsxTemplateProperties);
	
	var _jsreportStudio = __webpack_require__(3);
	
	var _jsreportStudio2 = _interopRequireDefault(_jsreportStudio);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	_jsreportStudio2.default.addPropertiesComponent('html to xlsx', _HtmlToXlsxProperties.LegacyProperties, function (entity) {
	  return entity.__entitySet === 'templates' && entity.recipe === 'html-to-xlsx';
	});
	_jsreportStudio2.default.addPropertiesComponent('html to better xlsx', _HtmlToXlsxProperties2.default, function (entity) {
	  return entity.__entitySet === 'templates' && entity.recipe === 'html-to-better-xlsx';
	});
	_jsreportStudio2.default.addPropertiesComponent(_XlsxTemplateProperties2.default.title, _XlsxTemplateProperties2.default, function (entity) {
	  return entity.__entitySet === 'templates' && entity.recipe === 'html-to-better-xlsx' && entity.htmlToXlsx && entity.htmlToXlsx.insertToXlsxTemplate === true;
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
	exports.LegacyProperties = undefined;
	
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
	
	    _this.applyDefaultsToEntity = _this.applyDefaultsToEntity.bind(_this);
	    _this.changeHtmlToXlsx = _this.changeHtmlToXlsx.bind(_this);
	    return _this;
	  }
	
	  _createClass(Properties, [{
	    key: 'componentDidMount',
	    value: function componentDidMount() {
	      this.applyDefaultsToEntity(this.props);
	    }
	  }, {
	    key: 'componentWillReceiveProps',
	    value: function componentWillReceiveProps(nextProps) {
	      // when component changes because another template is created
	      if (this.props.entity._id !== nextProps.entity._id) {
	        this.applyDefaultsToEntity(nextProps);
	      }
	    }
	  }, {
	    key: 'applyDefaultsToEntity',
	    value: function applyDefaultsToEntity(props) {
	      var entity = props.entity;
	
	      var htmlEngines = _jsreportStudio2.default.extensions['html-to-xlsx'].options.htmlEngines;
	      var entityNeedsDefault = false;
	
	      if (entity.__isNew || entity.htmlToXlsx == null || entity.htmlToXlsx.htmlEngine == null) {
	        entityNeedsDefault = true;
	      }
	
	      if (htmlEngines != null && htmlEngines[0] != null && entityNeedsDefault) {
	        this.changeHtmlToXlsx(props, {
	          htmlEngine: htmlEngines[0]
	        });
	      }
	    }
	  }, {
	    key: 'changeHtmlToXlsx',
	    value: function changeHtmlToXlsx(props, change) {
	      var entity = props.entity,
	          onChange = props.onChange;
	
	      var htmlToXlsx = entity.htmlToXlsx || {};
	
	      onChange(_extends({}, entity, {
	        htmlToXlsx: _extends({}, htmlToXlsx, change)
	      }));
	    }
	  }, {
	    key: 'render',
	    value: function render() {
	      var _this2 = this;
	
	      var legacy = this.props.legacy === true;
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
	                return _this2.changeHtmlToXlsx(_this2.props, { htmlEngine: v.target.value });
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
	        ),
	        !legacy && _react2.default.createElement(
	          'div',
	          { className: 'form-group' },
	          _react2.default.createElement(
	            'label',
	            null,
	            'font family'
	          ),
	          _react2.default.createElement('input', {
	            type: 'text', placeholder: 'Verdana', value: htmlToXlsx.fontFamily || '',
	            onChange: function onChange(v) {
	              return _this2.changeHtmlToXlsx(_this2.props, { fontFamily: v.target.value });
	            } })
	        ),
	        !legacy && _react2.default.createElement(
	          'div',
	          { className: 'form-group' },
	          _react2.default.createElement(
	            'label',
	            null,
	            'insert table output to xlsx template'
	          ),
	          _react2.default.createElement('input', {
	            type: 'checkbox', checked: htmlToXlsx.insertToXlsxTemplate === true,
	            onChange: function onChange(v) {
	              return _this2.changeHtmlToXlsx(_this2.props, { insertToXlsxTemplate: v.target.checked });
	            } })
	        ),
	        _react2.default.createElement(
	          'div',
	          { className: 'form-group' },
	          _react2.default.createElement(
	            'label',
	            { title: 'window.JSREPORT_READY_TO_START=true;' },
	            'wait for conversion trigger'
	          ),
	          _react2.default.createElement('input', {
	            type: 'checkbox', title: 'window.JSREPORT_READY_TO_START=true;', checked: htmlToXlsx.waitForJS === true,
	            onChange: function onChange(v) {
	              return _this2.changeHtmlToXlsx(_this2.props, { waitForJS: v.target.checked });
	            } })
	        )
	      );
	    }
	  }]);
	
	  return Properties;
	}(_react.Component);
	
	var LegacyProperties = function LegacyProperties(props) {
	  return _react2.default.createElement(Properties, _extends({}, props, { legacy: true }));
	};
	
	exports.default = Properties;
	exports.LegacyProperties = LegacyProperties;

/***/ },
/* 2 */
/***/ function(module, exports) {

	module.exports = Studio.libraries['react'];

/***/ },
/* 3 */
/***/ function(module, exports) {

	module.exports = Studio;

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
	
	var _react = __webpack_require__(2);
	
	var _react2 = _interopRequireDefault(_react);
	
	var _jsreportStudio = __webpack_require__(3);
	
	var _jsreportStudio2 = _interopRequireDefault(_jsreportStudio);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }
	
	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
	
	var EntityRefSelect = _jsreportStudio2.default.EntityRefSelect;
	
	var XlsxTemplateProperties = function (_Component) {
	  _inherits(XlsxTemplateProperties, _Component);
	
	  function XlsxTemplateProperties() {
	    _classCallCheck(this, XlsxTemplateProperties);
	
	    return _possibleConstructorReturn(this, (XlsxTemplateProperties.__proto__ || Object.getPrototypeOf(XlsxTemplateProperties)).apply(this, arguments));
	  }
	
	  _createClass(XlsxTemplateProperties, [{
	    key: 'componentDidMount',
	    value: function componentDidMount() {
	      this.removeInvalidXlsxTemplateReferences();
	    }
	  }, {
	    key: 'componentDidUpdate',
	    value: function componentDidUpdate() {
	      this.removeInvalidXlsxTemplateReferences();
	    }
	  }, {
	    key: 'removeInvalidXlsxTemplateReferences',
	    value: function removeInvalidXlsxTemplateReferences() {
	      var _props = this.props,
	          entity = _props.entity,
	          entities = _props.entities,
	          onChange = _props.onChange;
	
	
	      if (!entity.baseXlsxTemplate) {
	        return;
	      }
	
	      var updatedXlsxTemplates = Object.keys(entities).filter(function (k) {
	        return entities[k].__entitySet === 'xlsxTemplates' && entities[k].shortid === entity.baseXlsxTemplate.shortid;
	      });
	
	      if (updatedXlsxTemplates.length === 0) {
	        onChange({ _id: entity._id, baseXlsxTemplate: null });
	      }
	    }
	  }, {
	    key: 'render',
	    value: function render() {
	      var _props2 = this.props,
	          entity = _props2.entity,
	          _onChange = _props2.onChange;
	
	
	      return _react2.default.createElement(
	        'div',
	        { className: 'properties-section' },
	        _react2.default.createElement(
	          'div',
	          { className: 'form-group' },
	          _react2.default.createElement(EntityRefSelect, {
	            headingLabel: 'Select xlsx template',
	            filter: function filter(references) {
	              return { xlsxTemplates: references.xlsxTemplates };
	            },
	            value: entity.baseXlsxTemplate ? entity.baseXlsxTemplate.shortid : null,
	            onChange: function onChange(selected) {
	              return _onChange({ _id: entity._id, baseXlsxTemplate: selected != null && selected.length > 0 ? { shortid: selected[0].shortid } : null });
	            }
	          })
	        )
	      );
	    }
	  }], [{
	    key: 'selectItems',
	    value: function selectItems(entities) {
	      return Object.keys(entities).filter(function (k) {
	        return entities[k].__entitySet === 'xlsxTemplates';
	      }).map(function (k) {
	        return entities[k];
	      });
	    }
	  }, {
	    key: 'title',
	    value: function title(entity, entities) {
	      if (!entity.baseXlsxTemplate || !entity.baseXlsxTemplate.shortid) {
	        return 'xlsx template';
	      }
	
	      var foundItems = XlsxTemplateProperties.selectItems(entities).filter(function (e) {
	        return entity.baseXlsxTemplate.shortid === e.shortid;
	      });
	
	      if (!foundItems.length) {
	        return 'xlsx template';
	      }
	
	      return 'xlsx template: ' + foundItems[0].name;
	    }
	  }]);
	
	  return XlsxTemplateProperties;
	}(_react.Component);
	
	exports.default = XlsxTemplateProperties;

/***/ }
/******/ ]);