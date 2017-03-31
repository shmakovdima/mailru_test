(function (global) {
	'use strict';
	if (!('DEBUG' in global)) {
		global.DEBUG = false;
	}
	var __idCounter = 0; // глобальный счётчик id

	var oObjectPrototype = Object.prototype;
	var fHasOwnProperty = oObjectPrototype.hasOwnProperty;
	var oArrayProto = Array.prototype;
	var typeOf = (function () {
		var aClsNames = ['Object', 'Array', 'Boolean', 'Date', 'Function', 'Number', 'Null', 'RegExp', 'String',
			'Undefined', 'Arguments', 'Error', 'Math', 'JSON'];
		var toStr = oObjectPrototype.toString;
		var oStrToType = {};
		var sObject = aClsNames[0].toLowerCase();
		var className;

		for (var classNo = aClsNames.length; classNo--;) {
			className = aClsNames[classNo];
			oStrToType['[' + sObject + ' ' + className + ']'] = className.toLowerCase();
		}
		return function typeOf (mObj, sType) {
			var sObjType = typeof mObj;
			if (sObjType === sObject || sObjType === 'function') {
				sObjType = mObj === null ? 'null' : oStrToType[toStr.call(mObj)] || sObject;
			}
			return sType ? sType === sObjType : sObjType;
		};
	})();
	var isArray = (function () {
		var fIsArray = Array.isArray;
		if (!typeOf(fIsArray, 'function')) {
			fIsArray = Array.isArray = function isArray (array) {
				return typeOf(array, 'array');
			};
		}
		return function (array) {
			return fIsArray(array);
		};
	})();
	function getNameSpace (mName, oPrnt, bCreate) {
		var aName = !Array.isArray(mName) ? mName.split('.') : mName;
		var oCurLevel = oPrnt || global;
		var sCurName, mNextLevel;
		bCreate = bCreate !== false;

		for (var lvlNo = 0; lvlNo < aName.length; lvlNo += 1) {
			sCurName = aName[lvlNo];
			mNextLevel = oCurLevel[sCurName];
			if (!typeOf(mNextLevel, 'object')) {
				if (bCreate) {
					oCurLevel[sCurName] = mNextLevel = {};
				}
			}
			oCurLevel = mNextLevel;
			if (oCurLevel === null || typeOf(oCurLevel, 'undefined')) {
				break;
			}
		}
		return oCurLevel;
	}

	/**
	 * Получение данных из объекта по "цепочке" ключей
	 * @param {Array|String} mName
	 * @param {object} oParent
	 * @returns {*}
	 */
	function getByPath (mName, oParent) {
		var aName = Array.isArray(mName) ? mName : mName.split('.');
		var oTarget = getNameSpace(aName.slice(0, aName.length - 1), oParent, false);
		var mResult;
		if (!(oTarget === null || typeOf(oTarget, 'undefined'))) { // если не null или undef - можно получить свойство
			mResult = oTarget[aName.pop()];
		}
		return mResult;
	}
	function isPlainObject (mObject) {
		var bIsObject = mObject && typeOf(mObject, 'object') && !(mObject.nodeType ||  mObject === mObject.window);
		var sKeyName;

		try {
			bIsObject = bIsObject && !(
				mObject.constructor &&
				!fHasOwnProperty.call(mObject, 'constructor') &&
				!fHasOwnProperty.call(mObject.constructor.prototype, 'isPrototypeOf')
			);
		} catch (ex) {
			bIsObject = false;
		}
		if (bIsObject) {
			for (sKeyName in mObject) {
				continue;
			} // находит последний ключ объекта
			bIsObject = typeOf(sKeyName, 'undefined') || fHasOwnProperty.call(mObject, sKeyName);
		}
		return bIsObject;
	}
	function extend () {
		var target, aModifiers, isDeep, oProps, targetVal, modfVal, recCont, mdfrIsArr, trgtType;
		if (typeOf(arguments[0], 'boolean')) {
			isDeep = oArrayProto.shift.apply(arguments);
		}
		if (arguments.length < 2) {
			return arguments[0];
		}
		target = oArrayProto.shift.apply(arguments);
		trgtType = typeOf(target);
		if (!(trgtType == 'object' || trgtType == 'function' || trgtType == 'array')) {
			target = {};
		}
		aModifiers = arguments;

		for (var mdfNo = 0; mdfNo < aModifiers.length; mdfNo += 1) {
			oProps = aModifiers[mdfNo];
			if (oProps != null) {
				for (var propName in oProps) {
					if (!(fHasOwnProperty.call(oProps, propName) && oProps[propName] !== target)) {
						continue;
					}
					targetVal = target[propName];
					modfVal = oProps[propName];
					if (((mdfrIsArr = Array.isArray(modfVal)) || isPlainObject(modfVal)) && isDeep) {
						if (mdfrIsArr) {
							recCont = Array.isArray(targetVal) ? targetVal : [];
						} else {
							recCont = typeOf(targetVal, 'object') ? targetVal : {};
						}
						target[propName] = extend(true, recCont, modfVal); // TODO первый аргумент - {}
					} else if (!typeOf(modfVal, 'undefined')) {
						target[propName] = modfVal;
					}
				}
			}
		}
		return target;
	}
	function merge () {
		var mergeList = [],
			isDeep = false;
		var mCurProp, mTrgtProp, currentVal, target, curPropType, trgtPropType, arrayArgs, arrayProps;
		if (typeOf(arguments[0], 'boolean')) {
			isDeep = oArrayProto.shift.call(arguments);
		}
		mergeList = oArrayProto.reduce.call(arguments, function (list, argument) {
			var argType = typeOf(argument);
			var targetType = list.length > 0 && typeOf(list[0]);
			if (targetType ? argType === targetType : (argType === 'array' || argType === 'object')) {
				list.push(argument);
			}
			return list;
		}, mergeList);
		target = mergeList.shift();
		arrayArgs = Array.isArray(target);
		if (mergeList.length) {
			for (var argNo = 0; argNo < mergeList.length; argNo++) {
				currentVal = mergeList[argNo];

				for (var propName in currentVal) {
					if (fHasOwnProperty.call(currentVal, propName)) {
						curPropType = typeOf(mCurProp = currentVal[propName]);
						trgtPropType = typeOf(mTrgtProp = target[propName]);
						if (
							curPropType === trgtPropType &&
							(curPropType === 'object' || (arrayProps = curPropType === 'array')) &&
							mCurProp !== mTrgtProp &&
							isDeep
						) {
							target[propName] = merge(true, arrayProps ? [] : {}, mTrgtProp, mCurProp);
						} else if (trgtPropType != 'undefined') {
							if (arrayArgs) {
								target.push(mCurProp);
							} else {
								target[propName] = [].concat(mTrgtProp, mCurProp);
							}
						} else {
							target[propName] = mCurProp;
						}
					}
				}
			}
		}
		return target;
	}

	/**
	 * Создает функцию, игнорирующую вызовы происходящие чаще заданого интервала
	 * @param originalFn функция, частоту выполнения которой необходимо ограничить
	 * @param [timeout = 100] интервал
	 * @param [callImmediately = false] флаг, указывающий что функция должна выполняться в начале группы вызовов
	 * @returns {Function}
	 */
	function debounce (originalFn, timeout, callImmediately) {
		var timer = null;
		timeout = timeout || 100;
		return function debounced () {
			var context = this,
				args = arguments;

			function delayed () {
				if (!callImmediately) {
					originalFn.apply(context, args);
				}
				timer = null;
			}

			if (timer !== null) {
				clearTimeout(timer);
			} else if (callImmediately) {
				originalFn.apply(context, args);
			}
			timer = setTimeout(delayed, timeout);
		};
	}

	/**
	 * Создает функцию, которая выполняется не чаще чем 1 раз за заданный интервал времени
	 * @param originalFn функция, частоту выполнения которой необходимо ограничить
	 * @param [timeout = 100] интервал
	 * @param [scope] контекст вызова функции
	 * @returns {Function}
	 */
	function throttle (originalFn, timeout, scope) {
		timeout = timeout || 100;
		var lastCallTime, timer = null;

		return function () {
			var context = scope || this;
			var now = +(new Date());
			var args = Array.prototype.slice.call(arguments);

			if (lastCallTime && now < lastCallTime + timeout) {
				// если вызов больше не произойдет - последнее изменение будет обработано по таймауту
				clearTimeout(timer);
				timer = setTimeout(function () {
					lastCallTime = now;
					originalFn.apply(context, args);
				}, timeout);
			} else {
				clearTimeout(timer);
				lastCallTime = now;
				originalFn.apply(context, arguments);
			}
		};
	}

	function getCollisions (mixin, target) {
		if (typeof mixin !== 'object') {
			throw new TypeError('invalid mixin');
		}
		if (typeof target !== 'object') {
			throw new TypeError('invalid target');
		}

		var targetNames = Object.keys(target),
				mixinNames = Object.keys(mixin);

		return targetNames.reduce(function (prev, curr) {
			if (mixinNames.indexOf(curr) !== -1) {
				prev = prev.concat([curr]);
			}
			return prev;
		}, []);
	}

	function addMixin (target, mixin) {
		var collisions = getCollisions(mixin, target),
				alreadyExists = collisions.length > 0;

		if (alreadyExists) {
			throw new Error('methods \'' + collisions.join('\',\'') + '\' exists in target');
		}

		// Именно к целевому прототипу присобачиваем миксин - чтобы не сломать наследование
		return extend(true, target, mixin);
	}

	/**
	 * Создает конструктор обрабатывающий вызов без оператора new
	 * @param {object} [prototype] прототип, ассоциируемый с создаваемым конструктором
	 * @returns {function} Конструктор
	 */
	function getConstructor (prototype) {
		var Constructor = function () {
			var oInstance = this;
			var mInitResult;
			// XXX: Запрет вызова без new
			if (!(oInstance instanceof Constructor)) {
				oInstance = new Constructor(Constructor);
			}
			if (!('__id' in oInstance)) {
				oInstance.__id = ++__idCounter;
			}
			// XXX: Если в качестве аргумента передан сам конструктор значит требуется только инициализация объекта (new)
			if (!(arguments[0] === Constructor && arguments.length === 1)) {
				mInitResult = oInstance._Init.apply(oInstance, arguments);

				if (typeOf(mInitResult, 'object')) {
					oInstance = mInitResult;
				} else {
					oInstance._Init = null;
				}
			}
			return oInstance;
		};

		if ('_mixins' in prototype) {
			prototype._mixins.forEach(function (mixin) {
				prototype = addMixin(prototype, mixin);
			});
		}

		if (!(prototype === null || typeOf(prototype, 'undefined'))) {
			Constructor.prototype = prototype;
			Constructor.prototype.constructor = Constructor;
		}
		return Constructor;
	}

	/**
	 * Возвращает функцию, которая выполнит указанный шаблон
	 * @param {string|Array} templateName  Имя шаблона
	 * @returns {function}
	 */
	var getTemplate = (function () {
		var renderTemplate = function (templateName, dataToRender) {
			var template = getByPath(['fest'].concat(templateName), global);
			if (typeOf(template, 'function')) {
				return template(dataToRender);
			} else if (global.DEBUG) {
				throw new Error('Шаблон ' + templateName + ' отсутствует.');
			}
		};

		/** @see getTemplate */
		return function getTemplate (templateName) {
			if (templateName) {
				return renderTemplate.bind(null, templateName);
			} else if (global.DEBUG) {
				throw new Error('Не указано имя шаблона');
			}
		};
	})();

	var getOptions = (function () {
		var sTargetPropName = 'onclick';
		var sStorePropName = '_options';
		return function getElementOptions (elNode) {
			var mStored = elNode[sStorePropName];
			var mOnclck, retVal;
			if (mStored != null) {
				retVal = mStored;
			} else {
				try {
					mOnclck = elNode[sTargetPropName];
					if (mOnclck != null) {
						retVal = mOnclck();
					}
				} catch (ex) {
					if (DEBUG) {
						console.error('Broken onclick val:', elNode);
					}
				}
				elNode.removeAttribute(sTargetPropName);
				/*delete */
				elNode[sTargetPropName] = null;
				elNode[sStorePropName] = retVal;
			}
			return retVal;
		};
	})();

	// Централизованное хранение опций
	var oModuleOpts = (function () {
		var oOptions;
		function getProjectNs (sProjectName) {
			if (!sProjectName) {
				sProjectName = 'location' in global && global.location.hostname.split('.').slice(0, -2).join('.') || '';
			}
			oOptions = oOptions || {};
			return getNameSpace(sProjectName, oOptions);
		}

		/**
		 * Записывает набор параметров модуля в хранилище
		 * @param {string} moduleName имя модуля
		 * @param {object} oParams набор параметров для записи
		 * @param {boolean} [bRewrite] флаг, указывающий что опции нужно заменить, а не расширить
		 * @param {string} [projectName] @deprecated
		 * @returns {object}
		 */
		function setParams (moduleName, oParams, bRewrite, projectName) {
			var oPrjctNs = getProjectNs(projectName);
			var oModuleNs = oPrjctNs[moduleName];
			if (!oModuleNs || bRewrite) {
				oModuleNs = oPrjctNs[moduleName] = extend(true, {}, oParams);
			} else {
				extend(true, oModuleNs, oParams);
			}
			return oModuleNs;
		}

		/**
		 * Получаен набор параметров модуля из хранилища
		 * @param {string} moduleName имя модуля
		 * @param {string} [projectName] @deprecated
		 * @returns {object}
		 */
		function getParams (moduleName, projectName) {
			return getProjectNs(projectName)[moduleName];
		}
		return {
			get: function (moduleName, projectName) {
				var oModuleNS = getParams(moduleName, projectName);
				return oModuleNS && oModuleNS.options;
			},
			/**
			 * Записывает в хранилище набор опций для модуля
			 * @param {string} moduleName имя модуля
			 * @param {string} [projectName] @deprecated
			 * @param {object} oOpts объект с регистрируемыми опциями модуля
			 * @param {boolean} [bRewrite] флаг, указывающий что опции нужно заменить, а не расширить
			 * @returns {object} объект с текущими опциями модуля
			 */
			set: function (moduleName, oOpts, bRewrite) {
				var projectName = null;
				// поддержка старого порядка аргументов
				if (typeOf(arguments[1], 'string') || typeOf(arguments[2], 'object') || arguments.length === 4) {
					projectName = arguments[1];
					oOpts = arguments[2];
					bRewrite = arguments[3];
				}
				var oParams = {options: oOpts};
				return setParams(moduleName, oParams, bRewrite, projectName).options;
			},
			/**
			 * @see setParams
			 */
			setParams: function () {
				return setParams.apply(null, oArrayProto.slice.call(arguments, 0, 3));
			},
			/**
			 * @see getParams
			 */
			getParams: function () {
				return getParams.apply(null, oArrayProto.slice.call(arguments, 0, 1));
			},
			/**
			 * Регистрирует функцию-инициализатор модуля
			 * @param {string} moduleName
			 * @param {function} fInitializer
			 */
			registerModule: function (moduleName, fInitializer) {
				setParams(moduleName, {
					initializer: fInitializer
				});
			}
		};
	})();
	var oCpf = getNameSpace('ru.mail.cpf');
	extend(oCpf, {
		Basic: {
			Extend: extend,
			Merge: merge,
			getOptions: getOptions,
			moduleOpts: oModuleOpts,
			typeOf: typeOf,
			getConstructor: getConstructor,
			getByPath: getByPath,
			debounce: debounce,
			throttle: throttle
		},
		Tools: {
			getTemplate: getTemplate
		}
	});

	/**
	 * @deprecated
	 */
	extend(oCpf, {
		Types: {
			Array: {
				isArray: isArray
			}
		}
	});
	global.getNameSpace = getNameSpace;
}(new Function('return this')()));
