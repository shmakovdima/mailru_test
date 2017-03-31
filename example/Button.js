(function(window) {
  'use strict';

  var $ = window.jQuery;

  var defaultOptions = {
    cssSels: {
      Main: {
        textContainer: '.some-selector'
      },
      button: '.change-text'
    },
    buttonNames: ['foo', 'bar', 'zoo', 'loo', 'o-lo-lo', 'pew-pew']
  };

  // получаем конструктор вьюшки кнопки
  var Button = window.ru.mail.cpf.Basic.getView({
    _Handlers: {
      dom: {
        'click:button': function() {
          var names = this._opts.buttonNames,
            randomIndex = Math.floor(Math.random() * names.length);
          this._elems.textContainer.text(names[randomIndex]);
          console.log('Button\'s name is ' + this.getButtonName());
        }
      }
    },
    _Init: function() {
      console.log('_Init вызывается первым');
    },
    getButtonName: function() {
      return this._elems.textContainer.text();
    }
  }, defaultOptions, null, 'Button');

  // Публикуем ссылку на конструктор
  window.getNameSpace('ru.mail.cpf.modules').Button = Button;

})(window);
