/* 图库：Pixiv 全量瀑布流；首屏 30 张已内联，其余分批加载 */
(function () {
  var BATCH = 150
  var items = null
  var cursor = 0
  var total = 0
  var root = null
  var more = null
  var loading = false
  var observer = null

  function markLoaded(img) {
    if (img.complete && img.naturalWidth) img.classList.add('is-loaded')
    else img.addEventListener('load', function () { img.classList.add('is-loaded') }, { once: true })
    img.addEventListener('error', function () {
      img.classList.add('is-broken')
      img.removeAttribute('src')
    }, { once: true })
  }

  function figure(item, index) {
    var fig = document.createElement('figure')
    fig.className = 'waterfall-item'
    var link = document.createElement('a')
    link.href = item.pages
    link.target = '_blank'
    link.rel = 'noopener'
    link.title = item.title || ''
    var img = document.createElement('img')
    img.alt = item.title || ('pixiv-' + index)
    img.loading = 'lazy'
    img.decoding = 'async'
    if (item.w) img.width = item.w
    if (item.h) img.height = item.h
    markLoaded(img)
    img.src = item.pages
    link.appendChild(img)
    fig.appendChild(link)
    return fig
  }

  function updateCount() {
    var count = document.getElementById('pixiv-count')
    if (count) count.textContent = '已加载 ' + cursor + ' / ' + total + ' 张'
  }

  function render() {
    if (!items || loading) return
    loading = true
    var frag = document.createDocumentFragment()
    var end = Math.min(cursor + BATCH, items.length)
    for (var i = cursor; i < end; i++) frag.appendChild(figure(items[i], i))
    root.appendChild(frag)
    cursor = end
    updateCount()
    loading = false
    if (cursor >= items.length && more) more.hidden = true
  }

  function init() {
    root = document.getElementById('pixiv-gallery')
    if (!root || root.dataset.bound) return
    root.dataset.bound = '1'
    root.querySelectorAll('img').forEach(markLoaded)

    more = document.getElementById('pixiv-more')
    if (more) more.addEventListener('click', render)

    fetch('/data/pixiv-images.json')
      .then(function (res) { return res.ok ? res.json() : [] })
      .then(function (list) {
        if (!Array.isArray(list) || !list.length) return
        items = list
        total = list.length
        var offset = parseInt(root.getAttribute('data-offset') || '0', 10) || 0
        cursor = Math.min(offset, total)
        updateCount()

        if ('IntersectionObserver' in window && more) {
          observer = new IntersectionObserver(function (entries) {
            if (entries[0].isIntersecting) render()
          }, { rootMargin: '800px' })
          observer.observe(more)
        }
      })
      .catch(function () {})
  }

  document.addEventListener('DOMContentLoaded', init)
  document.addEventListener('pjax:complete', init)
})()
