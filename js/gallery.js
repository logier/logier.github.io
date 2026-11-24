/* 图库：筛选 + API 图片多级回退 */
(function () {
  window.galleryFallback = function (img) {
    var list = (img.getAttribute('data-fallbacks') || '').split('|').filter(Boolean);
    if (list.length) {
      var next = list.shift();
      img.setAttribute('data-fallbacks', list.join('|'));
      img.src = next;
      return;
    }
    img.onerror = null;
    img.src = '/img/gallery-placeholder.svg';
  };

  function init() {
    var filter = document.querySelector('.gallery-filter');
    if (!filter || filter.dataset.bound) return;
    filter.dataset.bound = '1';
    filter.addEventListener('click', function (event) {
      var btn = event.target.closest('button[data-kind]');
      if (!btn) return;
      var kind = btn.getAttribute('data-kind');
      filter.querySelectorAll('button').forEach(function (item) {
        item.classList.toggle('active', item === btn);
      });
      document.querySelectorAll('#gallery-waterfall .waterfall-item').forEach(function (item) {
        var show = kind === 'all' || item.getAttribute('data-kind') === kind;
        if (show) item.removeAttribute('hidden');
        else item.setAttribute('hidden', '');
      });
    });
  }

  document.addEventListener('DOMContentLoaded', init);
  document.addEventListener('pjax:complete', init);
})();
