/* 首页：把最新视频插入文章列表顶部，复用 Butterfly 的文章行样式（数据由 scripts/build-video-page.mjs 生成） */
(function () {
  var MAX = 8

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    })
  }

  function formatDate(ts) {
    if (!ts) return ''
    var d = new Date(ts * 1000 + 8 * 3600 * 1000)
    return d.toISOString().slice(0, 10)
  }

  function formatDuration(sec) {
    if (!sec) return ''
    var m = Math.floor(sec / 60)
    var s = sec % 60
    return (m >= 60 ? Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0') : m) + ':' + String(s).padStart(2, '0')
  }

  function row(v) {
    var date = formatDate(v.fav_time)
    var meta = ''
    if (date) {
      meta += '<span class="post-meta-date"><i class="far fa-calendar-alt"></i><span class="article-meta-label">收藏于</span><time datetime="' + esc(date) + '">' + esc(date) + '</time></span>'
    }
    if (v.upper) {
      meta += '<span class="article-meta"><span class="article-meta-separator">|</span><i class="fas fa-user"></i>' + esc(v.upper) + '</span>'
    }
    if (v.duration) {
      meta += '<span class="article-meta"><span class="article-meta-separator">|</span><i class="far fa-clock"></i>' + esc(formatDuration(v.duration)) + '</span>'
    }
    var div = document.createElement('div')
    div.className = 'recent-post-item is-video-row'
    div.innerHTML = '<div class="recent-post-info no-cover">' +
      '<a class="article-title" href="' + esc(v.url) + '" target="_blank" rel="noopener" title="' + esc(v.title) + '">' + esc(v.title) + '</a>' +
      '<div class="article-meta-wrap">' + meta + '</div></div>'
    return div
  }

  async function init() {
    var path = location.pathname
    if (path !== '/' && path !== '/index.html') return
    var list = document.querySelector('#recent-posts .recent-post-items')
    if (!list) return

    // pjax 返回首页时先清理上一次插入的内容，避免重复
    document.querySelectorAll('#recent-posts .latest-videos-title, #recent-posts .is-video-row').forEach(function (n) { n.remove() })

    try {
      var res = await fetch('/video-data.json', { cache: 'no-cache' })
      if (!res.ok) return
      var items = await res.json()
      if (!Array.isArray(items) || !items.length) return
      var container = document.querySelector('#recent-posts .recent-post-items')
      if (!container) return

      var head = document.createElement('h2')
      head.className = 'latest-videos-title'
      head.innerHTML = '最新视频<a href="/video/">查看全部 →</a>'
      container.parentNode.insertBefore(head, container)

      var frag = document.createDocumentFragment()
      items.slice(0, MAX).forEach(function (v) { frag.appendChild(row(v)) })
      container.insertBefore(frag, container.firstChild)
    } catch (error) {
      /* 静态数据缺失时静默跳过，不影响首页 */
    }
  }

  document.addEventListener('DOMContentLoaded', init)
  document.addEventListener('pjax:complete', init)
})()
