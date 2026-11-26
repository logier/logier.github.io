/* 图库：Pixiv 图库，随机排序 + 分批加载 + 随机背景 */
(function () {
  var BATCH = 150
  var items = null
  var cursor = 0
  var root = null
  var more = null
  var loading = false

  function showToast(message) {
    var el = document.createElement('div')
    el.className = 'pixiv-toast'
    el.textContent = message
    document.body.appendChild(el)
    requestAnimationFrame(function () { el.classList.add('show') })
    setTimeout(function () {
      el.classList.remove('show')
      setTimeout(function () { el.remove() }, 300)
    }, 1600)
  }

  function copy(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { showToast('已复制 ' + text) }, function () { showToast(text) })
    } else {
      showToast(text)
    }
  }

  function applyRandomBackground() {
    if (!document.getElementById('pixiv-gallery')) return
    fetch('/data/pixiv-bg.json')
      .then(function (res) { return res.ok ? res.json() : [] })
      .then(function (list) {
        if (!Array.isArray(list) || !list.length) return
        var pick = list[Math.floor(Math.random() * list.length)]
        var bg = document.getElementById('web_bg')
        if (!bg) return
        bg.style.backgroundImage = 'url("' + pick + '")'
        bg.classList.add('pixiv-random-bg')
      })
      .catch(function () {})
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

  function render() {
    if (!items || loading) return
    loading = true
    var frag = document.createDocumentFragment()
    var end = Math.min(cursor + BATCH, items.length)
    for (var i = cursor; i < end; i++) frag.appendChild(figure(items[i], i))
    root.appendChild(frag)
    cursor = end
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
    if (!root) return
    if (root.dataset.bound) return
    root.dataset.bound = '1'

    more = document.getElementById('pixiv-more')
    if (more) more.addEventListener('click', render)

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
        render()

        if ('IntersectionObserver' in window && more) {
          var observer = new IntersectionObserver(function (entries) {
            if (entries[0].isIntersecting) render()
          }, { rootMargin: '800px' })
          observer.observe(more)
        }
      })
      .catch(function () {})
  }

  document.addEventListener('DOMContentLoaded', function () {
    applyRandomBackground()
    init()
  })
  document.addEventListener('pjax:complete', function () {
    applyRandomBackground()
    init()
  })
})()
