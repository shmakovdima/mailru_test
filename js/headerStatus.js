// Выводим текст самого последнего выбранного элемента
(function (window) {
  dropdowns.forEach(function(value) {
    value.on('itemClick', function(event) {
      $('.header__status-result').text(value.getState().statusText);
    });
  });
})(window)
