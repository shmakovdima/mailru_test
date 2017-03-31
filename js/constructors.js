/**
 * Фабрики конструкторов моделей и представлений, выполняющие часть рутинной работы
 * @requires 'lib/basic.js'
 * @requires 'lib/polyfills/es5.basic.js'
 * @requires 'lib/polyfills/es5.array.js'
 * @requires 'tools/tools.Callbacks.js'
 * @requires 'tools/tools.pubsub.js'
 */

(function (window, oCpf) {
	var oBasic = oCpf.Basic;
	var typeOf = oBasic.typeOf;
	var extend = oBasic.Extend;
	var fMerge = oBasic.Merge;
	var fGetConstructor = oBasic.getConstructor;
	var fGetByPath = oBasic.getByPath;
	var initializationTools = oBasic.moduleOpts;
	var aServiceProps = ['_Events', '_Parent', '_Handlers', '_parentElement'];
	var aEventCategories = ['self', 'dom', 'model', 'set', 'pubsub', 'opts'];
	function addEventTypes (oTypes) {
		oCpf.Methods.registerEventTypes.call(this, {
			Types: oTypes
		});
	}
	function addHandlersSet (sSetName, aParams, mHandlers) {
		var oSets, oCurrentSet;
		if ('_bindHandlerSet' in this) {
			oSets = this._bindHandlerSet._Sets;
		} else {
			oSets = {};
			this._bindHandlerSet = bindHandlerSet.bind(this, oSets);
			this._bindHandlerSet._Sets = oSets;
		}
		oCurrentSet = oSets[sSetName] = oSets[sSetName] || {};
		if (aEventCategories.indexOf(aParams[0]) < 0) {
			aParams.unshift('dom');
		}
		oCurrentSet[aParams.join(':')] = mHandlers;
		return oSets;
	}
	function bindHandlerSet (oSets, sSetName) {
		var oSet = oSets[sSetName];
		if (typeOf(oSet, 'object')) {
			bindHandlers.call(this, oSet, null, sSetName);
		}
	}

	function wrapToDomLib (parent, elem) {
		return (elem == window) ? $(elem) : parent.add(elem).not(parent);
	}

	/**
	 * Назначает обработчики событий
	 * @param {object} oHandlers хеш сответствий параметры события - обработчик или имя метода
	 * @param {string} sBaseParams строка "базовых" параметров, используется при рекурсивном вызове
	 * @param {string} [sBindSet] имя набора обработчиков,
	 * используется для назначения dom-обработчиков элементам отличным от Parent
	 * Параметры событий записываются строкой, разделенный символом ".",
	 * например: <event_type>:<event_name>:<selector_path>
	 * <selector_path> опускается для типов отличных от "dom",
	 * <event_type> по-умолчанию равен "self" (обработчик события экземпляра)
	 */
	function bindHandlers (oHandlers, sBaseParams, sBindSet) {
		var opts = this._opts;
		var elements = this._elems;
		var selectors = opts.cssSels;
		var pubsub = oCpf.Tools.PubSub;
		var aEventParams, sEventType, sEventName, mSelectorPath, selectorVal, targetElem;
		var mBindTo, mParamsValue, sValueType, mHandlers;
		// TODO обработчики событий для инстансов из произвольных свойств
		for (var sEventParams in oHandlers) {
			if (oHandlers.hasOwnProperty(sEventParams)) {
				mParamsValue = oHandlers[sEventParams];
				sValueType = typeOf(mParamsValue);
				if (sBaseParams) {
					sEventParams = [sBaseParams, sEventParams].join(':');
				}
				aEventParams = sEventParams.split(':');

				if (aEventParams[0] === 'opts') {
					aEventParams = fGetByPath(aEventParams[1], opts).split(':').concat(aEventParams.slice(2));
					sEventParams = aEventParams.join(':');
				}

				if (aEventCategories.indexOf(aEventParams[0]) > -1) {
					sEventType = aEventParams.shift();
				} else {
					sEventType = aEventCategories[0];
				}
				sEventName = aEventParams.shift();
				if (sEventType === 'set') {
					addHandlersSet.call(this, sEventName, aEventParams, mParamsValue);
					continue;
				}

				switch (sValueType) {
					case 'string': // Имя метода текущего экземпляра
						mHandlers = this[mParamsValue];
						break;
					case 'function':
					case 'array':
						mHandlers = mParamsValue;
						break;
					case 'object':
						bindHandlers.call(this, mParamsValue, sEventParams, sBindSet);
						continue;
					default:
						continue;
				}
				if (typeOf(mHandlers, 'function')) {
					mHandlers = mHandlers.bind(this);
				} else if (Array.isArray(mHandlers) && sEventType !== 'dom') {
					for (var mHandler, handlerNo = mHandlers.length; handlerNo--;) {
						mHandler = mHandlers[handlerNo];
						if (typeOf(mHandler, 'string')) {
							mHandler = this[mHandler];
						}
						if (!typeOf(mHandler, 'function')) {
							mHandlers.splice(handlerNo, 1);
						} else {
							mHandlers[handlerNo] = mHandler.bind(this);
						}
					}
					if (mHandlers.length < 1) {
						continue;
					}
				} else {
					continue;
				}
				selectorVal = mSelectorPath = null;

				switch (sEventType) {
					case aEventCategories[0]:
						mBindTo = this;
						break;
					case aEventCategories[1]:
						if ('_elems' in this) {
							mSelectorPath = aEventParams.shift();
							/** @deprecated */
							if (mSelectorPath && mSelectorPath.charAt(0) === '$') {
								aEventParams.push(mSelectorPath.substr(1));
								mSelectorPath = 'document';
							}
							// оборачиваем документ в инстанс библиотеки для работы с DOM (jQuery, например)
							// для служебных селекторов $, document и window
							switch (mSelectorPath) {
								case 'document':
									mBindTo = wrapToDomLib(elements.parent, window.document);
									mSelectorPath = aEventParams.shift();
									break;
								case 'window':
									mBindTo = wrapToDomLib(elements.parent, window);
									mSelectorPath = aEventParams.shift();
									break;
								default:
									mBindTo = sBindSet && elements[sBindSet] || elements.parent;
							}
							if (mSelectorPath) {
								mSelectorPath = mSelectorPath.split('.');
								/* if (
									(mSelectorPath[0] === 'main' || mSelectorPath[0] === 'Main') &&
									(targetElem = elements[mSelectorPath[1]])
								) {
									mBindTo = targetElem;
								} else { */
								selectorVal = fGetByPath(mSelectorPath, selectors);
								// XXX если указан путь к селектору, но не указан селектор - не назначаем обработчик
								if (typeOf(selectorVal, 'undefined') || selectorVal === false) {
									mBindTo = null;
								}
								// }
							}
						}
						break;
					case aEventCategories[2]:
						mBindTo = this._model;
						break;

					// pubsub like a `pubsub:msg`
					case aEventCategories[4]:
						if (pubsub) {
							if (typeof mHandlers === 'function') {
								mHandlers = [mHandlers];
							}
							oHandlers[sEventName] = []; // для сохранения id подписок
							mHandlers.forEach(function (handler) {
								oHandlers[sEventName].push(pubsub.subscribe(sEventName, handler));
							}, this);
						}
						break;
				}
				if (mBindTo) {
					if (typeOf(selectorVal, 'string') && selectorVal.length) {
						mBindTo.on(sEventName, selectorVal, mHandlers);
					} else {
						mBindTo.on(sEventName, mHandlers);
					}
				}
			}
		}
	}
	function processParent (parentConstructor, moduleProto) {
		var parentPrototype;
		if (typeOf(parentConstructor, 'function') && (parentPrototype = parentConstructor.prototype)) {
			if (!('_Init' in moduleProto)) {
				moduleProto._Init = null;
			}
			moduleProto = extend(Object.create(parentPrototype), moduleProto);
			moduleProto._parent = parentPrototype;
			/** @deprecated */
			moduleProto._Parent = parentPrototype;
		}
		return moduleProto;
	}
	function processElementGet (sSelector, selName, oElems, containerElement) {
		var mFindElement;
		if (typeOf(sSelector, 'string') && !(oElems[selName] && oElems[selName].length)) {
			mFindElement = containerElement.find(sSelector).add(containerElement.filter(sSelector));
			oElems[selName] = mFindElement && mFindElement.length > 0 ? mFindElement : null;
		}
		return oElems[selName];
	}
	/**
	 * Получает набор элементов на основании плоского хеша (имя елемента - селектор),
	 * елементы ищутся в рамках единого родителя
	 * @param {object|string} mSelectors список селекторов для поиска или один селектор
	 * @param {object|string} [mElement] ссылка на элемент-родитель (jQuery-like set) или,
	 * если первый аргумент - строка, то имя елемента для поиска
	 * @param {string} [elemName] имя елемента для поиска, в случае, если передан единичный селектор
	 * @returns {object|null} elements список ссылок на найденные елементы или, если первый аргумент - строка,
	 * то результат поиска (jQuery-like set или null)
	 * @example
	 * _getElements('.js-some', 'some') найдет в _elems.parent соотв. елемент,
	 * добавит его в _elems под именем "some" и вернет ссылку на него
	 * _getElements('.js-some', container, 'some') то же самое, только ищет в container
	 * _getElements({some: '.js-some'}) то же самое, что первый вызов,
	 * но для множества элементов и возвращена будет ссылка на _elems
	 * _getElements({some: '.js-some'}, container) то же самое, что третий, только ищет в container
	 */
	function getElements (mSelectors, mElement, elemName) {
		var elements = this._elems || {parent: mElement};
		var oSelectors;
		/** @deprecated */
		elements.Parent = elements.parent;
		mElement = mElement || elements.parent;
		if (typeOf(mSelectors, 'string')) {
			if (typeOf(mElement, 'string')) {
				elemName = mElement;
				mElement = elements.parent;
			}
			return processElementGet(mSelectors, elemName, elements, mElement);
		} else {
			oSelectors = mSelectors;
			if (oSelectors) {
				for (var selName in oSelectors) {
					if (oSelectors.hasOwnProperty(selName)) {
						processElementGet(oSelectors[selName], selName, elements, mElement);
					}
				}
			}
		}
		return elements;
	}

	function isAllowedPlugin (pluginDef, pluginsOptions) {
		return pluginsOptions !== null && (
			!typeOf(pluginsOptions, 'object') || (
				pluginDef.name in pluginsOptions &&
				pluginsOptions[pluginDef.name] !== null
			)
		);
	}

	function processPlugins (pluginsList) {
		var pluginsOptions = this._opts._plugins;
		var pluginsHandlers = [];
		var pluginsInitializers = [];
		var pluginDef;

		if (Array.isArray(pluginsOptions)) {
			pluginsOptions = pluginsOptions.reduce(function (result, pluginName) {
				result[pluginName] = true;
				return result;
			}, {});
		}

		for (var pluginNo = 0; pluginNo < pluginsList.length; pluginNo++) {
			pluginDef = pluginsList[pluginNo];
			if (isAllowedPlugin(pluginDef, pluginsOptions)) {
				if (typeOf(pluginDef.methods)) {
					Object.keys(pluginDef.methods).forEach(function (methodName) {
						var pluginMethod = pluginDef.methods[methodName];
						var originalMethod = this[methodName];
						var resultMethod;
						if (typeOf(originalMethod, 'function')) {
							resultMethod = function () {
								var returnVal;
								var currentSuper = this._super;
								this._super = originalMethod;
								returnVal = pluginMethod.apply(this, arguments);
								if (currentSuper) {
									this._super = currentSuper;
								} else {
									delete this._super;
								}
								return returnVal;
							};
						} else {
							resultMethod = pluginMethod;
						}
						// resultMethod = pluginDef.name + '.' + methodName;
						this[methodName] = resultMethod;
					}.bind(this));
				}
				if (typeOf(pluginDef._Handlers, 'object')) {
					pluginsHandlers.push(pluginDef._Handlers);
				}
				if ('_Events' in pluginDef) {
					this._addEventTypes(pluginDef._Events);
				}
				if (typeOf(pluginDef._Init, 'function')) {
					pluginsInitializers.push(pluginDef._Init);
				}
			}
		}
		/** Обработчики назначаем после переопределения методов всеми плагинами */
		for (var handlersNo = 0; handlersNo < pluginsHandlers.length; handlersNo++) {
			bindHandlers.call(this, pluginsHandlers[handlersNo]);
		}
		return pluginsInitializers;
	}

	function getPluginsList () {
		var targetProto = this.constructor.prototype;
		var pluginsList = [];

		do {
			if (targetProto.hasOwnProperty('_Plugins')) {
				pluginsList = targetProto._Plugins.concat(pluginsList);
			}
		}

		while ((targetProto = targetProto._parent));
		return pluginsList;
	}

	/**
	 * Оборачивает метод _Init, функцией, выполняющей предварительную инициализацию модуля
	 * @param {boolean} bIsModel
	 * @param {object} oPrototype
	 * @param {object} [defaultOptions]
	 * @param {object|array} [mEventTypes]
	 * @param {object} [oHandlers]
	 * @param {function|object} mDefParentElement (jQuery-like set)
	 * @param {string} [sModuleName]
	 */
	function wrapInitFunction (bIsModel, oPrototype, defaultOptions,
		mEventTypes, oHandlers, mDefParentElement, sModuleName) {
		var fOriginalInit = oPrototype._Init;

		/**
		 * XXX: duck typing на время поддержки старого порядка аргументов
		 * @param oArgument
		 * @returns {boolean|*}
		 */
		function isElementsSet (oArgument) {
			return !isNaN(oArgument.length) && typeOf(oArgument.find, 'function');
		}

		oPrototype._Init = function () {
			var argumentsList = Array.prototype.slice.call(arguments);
			var pluginsList = this._Plugins !== null && getPluginsList.call(this);
			var hasPlugins = Array.isArray(pluginsList) && pluginsList.length > 0;
			var topInitialization = this._topChild !== true;
			var sHandlersOpt = '_Handlers';
			var externalOpts = {},
				pluginsOpts = {},
				options;
			var mParentElem, modelInstance, oSels, mainSels, mReturnVal,
				oOptsHandlers, oCurHandlers, pluginsConf, pluginsInitializers;
			this._Plugins = pluginsList || null;
			this._moduleName = sModuleName || '';

			/** @deprecated */
			if (sModuleName) {
				extend(true, externalOpts, initializationTools.get(sModuleName));
			}
			extend(true, externalOpts, argumentsList[0]);
			if (topInitialization) {
				this._topChild = true;
				if (hasPlugins) {
					pluginsConf = externalOpts._plugins;
					pluginsList.forEach(function (pluginDef) {
						if (typeOf(pluginDef._Opts, 'object') && isAllowedPlugin(pluginDef, pluginsConf)) {
							extend(true, pluginsOpts, pluginDef._Opts);
						}
					});
				}
				addEventTypes.call(this, ['beforeInit', 'init']);
			}
			// XXX опции инициализации - всегда первый аргумент
			argumentsList[0] = options = extend(true, {}, defaultOptions, pluginsOpts, externalOpts);
			if (mEventTypes) {
				addEventTypes.call(this, mEventTypes);
			}
			if (!bIsModel) {
				mParentElem = argumentsList[1];
				modelInstance = argumentsList[2];
				// проверяем и нормализуем порядок аргументов
				if (
					(typeOf(mParentElem, 'object') && !isElementsSet(mParentElem)) ||
					(typeOf(modelInstance, 'object') && isElementsSet(modelInstance))
				) {
					mParentElem = modelInstance;
					modelInstance = argumentsList[2] = argumentsList[1];
				}
				// если у потомка есть родительский елемент по-умолчанию - он должен быть передан в инициализацию предка
				mParentElem = argumentsList[1] = mParentElem || mDefParentElement;
				if (modelInstance && !typeOf(modelInstance.on, 'function')) {// не уверен, что эта проверка нужна
					throw new TypeError(
						'View instance must be linked with an instance of the model that has "on" method for add handlers'
					);
				}
				this._model = this._model || modelInstance || null;
				/** @deprecated */
				this._Model = this._model;
			}
			if (oPrototype._parent && '_Init' in oPrototype._parent) { // TODO разобраться с тем, что возвращает инициализация родителя
				oPrototype._parent._Init.apply(this, argumentsList);
			}
			hasPlugins = this._Plugins !== null;
			options = this._opts = this._opts || options;
			/** @deprecated */
			this._Opts = this._opts;
			// все опции, для которых критичен порядок раcширения доезжают до самой верхней инициализации
			if (sHandlersOpt in options && typeOf(oOptsHandlers = options[sHandlersOpt], 'object')) {
				delete options[sHandlersOpt];
				oCurHandlers = fMerge(true, {}, oHandlers || {}, oOptsHandlers);
			} else {
				oCurHandlers = oHandlers;
			}
			argumentsList.shift(); // В оригинальную инициализацию аргумент с опциями не приходит
			if (!bIsModel) {
				argumentsList.splice(0, 2); // Для вьюхи удаляем ссылку на модель и елемент-родитель
			}
			if (!(bIsModel || '_elems' in this)) {
				if (typeOf(mParentElem, 'function')) {
					mParentElem = mParentElem.apply(this, argumentsList);
				}
				oSels = options.cssSels;
				mainSels = oSels && (oSels.main || oSels.Main);
				this._elems = this._getElements(mainSels, mParentElem);
				/** @deprecated */
				this._Elems = this._elems;
			}
			if (hasPlugins) {
				pluginsInitializers = processPlugins.call(this, pluginsList);
				this._Plugins = null;
			}
			// назначение обработчиков после переопределения методов плагинами
			if (typeOf(oCurHandlers, 'object')) {
				bindHandlers.call(this, oCurHandlers);
			}
			if (topInitialization) {
				this._trigger('beforeInit');
			}
			if (typeOf(fOriginalInit, 'function')) {
				mReturnVal = fOriginalInit.apply(this, argumentsList);
			}
			if (hasPlugins && pluginsInitializers.length > 0) {
				for (var pluginNo = 0; pluginNo < pluginsInitializers.length; pluginNo++) {
					pluginsInitializers[pluginNo].apply(this, argumentsList);
				}
			}
			if (topInitialization) {
				this._trigger('init');
			}
			return mReturnVal;
		};
	}
	/**
	 * Создает конструктор модуля
	 * @param {boolean} bIsModel флаг, указывающий на то, что конструктор предназначается для модели
	 * @param {object} oPrototype объект прототипа (будет расширен стандартными методами),
	 * может содержать служебные свойства
	 * @property {function} [_Init] функция, вызываемая при конструировании экземпляра
	 * @property {object|Array} [_Events] конфиг для инициализации/дополнения событий модуля в формате tools.Callbacks.js
	 * @property {object} [_Handlers] конфиг обработчиков (только для модулей представления)
	 * @property {object} [_parentElement] ссылка на родительский элемент представления,
	 * либо функцию, его возвращающую (только для модулей представления)
	 * @param {object} [oDefOptions] набор опций по-умолчанию
	 * @param {function} [fParentConstructor] конструктор родителя
	 * @param {string} [moduleName] имя модуля
	 */
	function createModuleConstructor (bIsModel, oPrototype, oDefOptions, fParentConstructor, moduleName) {
		var handlers,
			mParentElement = null,
			moduleConstructor, mEventTypes;
		if (!typeOf(oPrototype, 'object')) {
			throw new TypeError('Prototype must be an object');
		}
		bIsModel = bIsModel !== false;
		// получаем значения служебных свойств до смешения прототипов и удаляем эти свойства
		handlers = oPrototype._Handlers;
		if (!bIsModel) {
			mParentElement = oPrototype._parentElement;
		}
		mEventTypes = oPrototype._Events;
		aServiceProps.forEach(function (propName) {
			delete oPrototype[propName];
		});
		oPrototype = processParent(fParentConstructor, oPrototype);
		oPrototype._getElements = getElements;
		wrapInitFunction(bIsModel, oPrototype, oDefOptions, mEventTypes, handlers, mParentElement, moduleName);
		moduleConstructor = fGetConstructor(oPrototype);
		if (moduleName) {
			initializationTools.registerModule(moduleName, moduleConstructor);
			modulesRepository.register(moduleName, moduleConstructor);
		}
		moduleConstructor.type = bIsModel ? 'model' : 'view';
		return moduleConstructor;
	}

	var modulesRepository = createModuleConstructor(true, {
		_Init: function () {
			this._modules = {};
		},
		register: function (moduleName, module) {
			if (!(moduleName in this._modules) && typeOf(module, 'function')) {
				this._modules[moduleName] = module;
			} else {
				throw new Error('Module \'' + moduleName + '\' exists or bad constructor type');
			}
		},
		get: function (moduleName) {
			return this._modules[moduleName];
		}
	})();

	oBasic.Constructors = {
		getModel: createModuleConstructor.bind(null, true),
		getView: createModuleConstructor.bind(null, false),
		_getServiceProps: function () {
			return aServiceProps.slice(0);
		},
		_repo: modulesRepository
	};
	/**
	 * @deprecated
	 */
	extend(oBasic, {
		getModel: oBasic.Constructors.getModel,
		getView: oBasic.Constructors.getView,
		/* deprecated */
		getElements: getElements
	});
}(this, this.ru.mail.cpf));
