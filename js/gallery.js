/* 图库：Pixiv 图库，随机排序 + 分批加载 + 文件名索引 */
(function () {
  var BATCH = 150
  var items = null
  var cursor = 0
  var root = null
  var more = null
  var loading = false
  var observer = null

  function esc(value) {
    return String(value == null ? '' : value)
  }

  function toast(message) {
    var el = document.getElementById('pixiv-toast')
    if (!el) return
    el.textContent = message
    el.classList.add('show')
    clearTimeout(el._timer)
    el._timer = setTimeout(function () { el.classList.remove('show') }, 1600)
  }

  function copy(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { toast('已复制 ' + text) }, function () { toast(text) })
    } else {
      toast(text)
    }
  }

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
    fig.setAttribute('data-file', item.file)

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

    var file = document.createElement('span')
    file.className = 'pixiv-file'
    file.textContent = item.file
    file.title = '点击复制文件名'
    file.addEventListener('click', function (event) {
      event.preventDefault()
      event.stopPropagation()
      copy(item.file)
    })

    link.appendChild(img)
    fig.appendChild(link)
    fig.appendChild(file)
    return fig
  }

  function updateCount() {
    var count = document.getElementById('pixiv-count')
    if (!count || !items) return
    count.textContent = '已加载 ' + cursor + ' / ' + items.length + ' 张（随机顺序）'
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

  function shuffle(list) {
    for (var i = list.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1))
      var tmp = list[i]
      list[i] = list[j]
      list[j] = tmp
    }
    return list
  }

  function init() {
    root = document.getElementById('pixiv-gallery')
    if (!root || root.dataset.bound) return
    root.dataset.bound = '1'

    more = document.getElementById('pixiv-more')
    if (more) more.addEventListener('click', render)

    var toggle = document.getElementById('pixiv-file-toggle')
    if (toggle) {
      toggle.addEventListener('click', function () {
        var on = root.classList.toggle('show-files')
        toggle.textContent = on ? '隐藏文件名' : '显示文件名'
      })
    }

    fetch('/data/pixiv-images.json')
      .then(function (res) { return res.ok ? res.json() : [] })
      .then(function (list) {
        if (!Array.isArray(list) || !list.length) return
        var hiddenNode = document.getElementById('pixiv-hidden')
        var hidden = []
        try { hidden = JSON.parse(hiddenNode ? hiddenNode.textContent : '[]') } catch (e) { hidden = [] }
        var hiddenSet = {}
        hidden.forEach(function (name) { hiddenSet[name] = 1 })
        list = list.filter(function (item) { return !hiddenSet[item.file] })
        if (!list.length) return
        items = shuffle(list.slice())
        root.innerHTML = ''
        cursor = 0
        if (more) more.hidden = false
        updateCount()
        render()

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
