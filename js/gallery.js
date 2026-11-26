/* 图库：Pixiv 全量瀑布流（数据来自 /data/pixiv-images.json，分批渲染） */
(function () {
  var BATCH = 150
  var items = null
  var cursor = 0
  var root = null
  var more = null
  var loading = false
  var observer = null

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    })
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
    img.src = item.pages
    img.alt = item.title || ('pixiv-' + index)
    img.loading = 'lazy'
    img.decoding = 'async'
    if (item.w) img.width = item.w
    if (item.h) img.height = item.h
    if (item.author) fig.setAttribute('data-author', item.author)
    link.appendChild(img)
    fig.appendChild(link)
    return fig
  }

  function render() {
    if (!items || loading) return
    loading = true
    var frag = document.createDocumentFragment()
    var end = Math.min(cursor + BATCH, items.length)
    for (var i = cursor; i < end; i++) frag.appendChild(figure(items[i], i))
    root.appendChild(frag)
    cursor = end
    var count = document.getElementById('pixiv-count')
    if (count) count.textContent = '已加载 ' + cursor + ' / ' + items.length + ' 张'
    loading = false
    if (cursor >= items.length && more) more.hidden = true
  }

  function init() {
    root = document.getElementById('pixiv-gallery')
    if (!root || root.dataset.bound) return
    root.dataset.bound = '1'
    more = document.getElementById('pixiv-more')
    if (more) more.addEventListener('click', render)

    fetch('/data/pixiv-images.json')
      .then(function (res) { return res.ok ? res.json() : [] })
      .then(function (list) {
        if (!Array.isArray(list) || !list.length) return
        items = list
        cursor = 0
        root.innerHTML = ''
        var count = document.getElementById('pixiv-count')
        if (count) count.textContent = '共 ' + list.length + ' 张，向下滚动加载'
        render()

        if ('IntersectionObserver' in window) {
          observer = new IntersectionObserver(function (entries) {
            if (entries[0].isIntersecting) render()
          }, { rootMargin: '600px' })
          observer.observe(more)
        } else if (more) {
          more.hidden = false
        }
      })
      .catch(function () {})
  }

  document.addEventListener('DOMContentLoaded', init)
  document.addEventListener('pjax:complete', init)
})()
