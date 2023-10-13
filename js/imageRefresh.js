function addRefreshFunctionality(className) {
  var images = document.getElementsByClassName(className);
  for (var i = 0; i < images.length; i++) {
      images[i].addEventListener('click', function() {
          fetch(this.src)
          .then(response => response.blob())
          .then(images => {
              var outside = URL.createObjectURL(images);
              this.src = outside;
          });
      });
  }
}

window.onload = function() {
  addRefreshFunctionality('your-class-name');
};




