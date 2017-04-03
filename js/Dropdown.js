(function (window) {
	'use strict';

  var $ = window.jQuery;


  // Дефолтные опции
  var defaultOptions = {
    main: {
      dropdownContainer: 'dropdown',
      dropdownExpanded: 'dropdown__expanded'
    },
    cssSels: {
      modificators: {
        activeClass: 'dropdown__item-active', // класс активного элемента
        disabledClass: 'dropdown__item-disabled' // класс disabled элемента
      },
      dropdownButton: '.dropdown__button',
      dropdownItem: '.dropdown__item'
    },

  }


  var Dropdown = window.ru.mail.cpf.Basic.getView({
    _Handlers: {
      dom: {
        'click:dropdownButton' (event) {
          this.toogleDropdown();
        },
        'click:dropdownItem' (event) {
          var element = event.currentTarget

          var id = element.getAttribute('data-id');

          if ((!element.hasAttribute('disabled')) && (id != this.statusId)) this.clickItem(element);
        }
      }
    },

    /**
     * Инициализация View
     */

    _Init () {
      // Открыт ли дропдаун
      this.isOpen = false;

      // Текст активного элемента
      this.statusText = null;

      // Номер активного элемента
      this.statusId = null;

      // Был ли элемент уже выбран
      this.haveSelected = [];

      var linkObject = this._elems.parent;

			// Блокируем min-width, чтобы кнопка при изменении текста не прыгала
			linkObject.find('button').css('min-width', linkObject.find('button').css('width'));

      // Сохраним контекст
      var self = this
      // Перебираем все элементы + метим класс disabled
      linkObject.find('li').each(function(key){
        this.setAttribute('data-id', key);
        this.classList.add(self._opts.cssSels.dropdownItem.replace(/[.]/gi, ''))
        if (this.hasAttribute('disabled')) this.classList.add(self._opts.cssSels.modificators.disabledClass);
      });

      // Проверка клик вне элемента
      this.clickOutside();

      // Регистрация события
      this._addEventTypes(['itemClick']);
    },

    /**
     * Смена состояния дропдауна
     */

    changeStatus() {
      this.isOpen = !this.isOpen
    },

    /**
     * Возвращает состояние дропдауна
     * @returns {object}
     */

    getState() {
      return {
        "isOpen": this.isOpen,
        "statusId": this.statusId,
        "statusText": this.statusText
      }
    },

    /**
     * Открытие/Закрытие дропдауна
     * @param {boolean} Открыть/закрыть
     */

   toogleDropdown(status) {
     this.changeStatus(status);
     var elementClass = this._elems.parent[0].classList;

     if (this.isOpen) {
       elementClass.add(this._opts.main.dropdownExpanded);
     } else {
       elementClass.remove(this._opts.main.dropdownExpanded);
     }
   },

   /**
		 * Клик по элементу
		 * @param {external:Node} element ссылка на элемент
		 */

    clickItem(element) {
      var id = element.getAttribute('data-id');
      this.statusId = id;
      this.statusText = element.innerText;

      var activeClass = this._opts.cssSels.modificators.activeClass;

      // Удаляем все активные, если не по нему
      this._elems.parent.find('li').removeClass(activeClass);


      // Если не было в активных, то вешаем класс и добавляем id в массив
      if (this.haveSelected.indexOf(id) === -1) {
        this.haveSelected.push(id)
        element.classList.add(activeClass)
      }

      this._elems.parent.find('button').text(this.statusText);

      this.toogleDropdown();
    },

    /*
     Проверка на клик вне элемента
     */

    clickOutside() {
      // Передаем ссылку на this
      var self = this;
      document.addEventListener('click', function(event){
        var contains = self._elems.parent.get(0).contains(event.target);

        console.log(self);

        if (!contains) {
          self.toogleDropdown(false);
        }
      });
    }

  }, defaultOptions, null, 'Dropdown');


	// Публикуем ссылку на конструктор
	window.getNameSpace('ru.mail.cpf.modules').Dropdown = Dropdown;

})(window);
