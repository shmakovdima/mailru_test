(function (window) {
  dropdowns.forEach(function(value) {
    console.log(value);
    value.on('itemClick', function(event) {
      alert('ok')
    });
  });
})(window)
