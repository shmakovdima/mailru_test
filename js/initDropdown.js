(function (window) {
  'use strict'

  // Используем синтаксис ES5, так как в constructors.js есть ссылки на полифилы es5

  var dropdownParams = {
    cssSels: {
      modificators: {
        activeClass: 'dropdown__item-active', // класс активного элемента
        disabledClass: 'dropdown__item-disabled' // класс disabled элемента
      }
    }
  }

  // Выбираем все дропдауны на страницы
  var dropdowns = $('.dropdown')

  // Перебираем все результаты и объявляем view
  dropdowns.each(function(key, value) {
    var view = window.ru.mail.cpf.modules.Dropdown(dropdownParams, null, $(value));
  });

})(window);
