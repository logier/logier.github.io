/* 首页：插入“最新视频”卡片（数据由 scripts/build-video-page.mjs 生成） */
(function () {
  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function card(v) {
    var img = v.cover
      ? '<img src="' + esc(v.cover) + '" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentNode.classList.add(\'is-broken\');this.remove()">'
      : '';
    var meta = [v.upper, v.duration].filter(Boolean).join(' · ');
    return '<a class="video-card" href="' + esc(v.url) + '" target="_blank" rel="noopener" title="' + esc(v.title) + '">' +
      '<div class="video-cover" data-initial="' + esc(String(v.title || '?').slice(0, 1)) + '">' + img + '</div>' +
      '<div class="video-info"><p class="video-title">' + esc(v.title) + '</p><p class="video-meta">' + esc(meta) + '</p></div></a>';
  }

  async function init() {
    var path = location.pathname;
    if (path !== '/' && path !== '/index.html') return;
    var host = document.getElementById('recent-posts') || document.getElementById('content-inner');
    if (!host || document.getElementById('latest-videos')) return;
    try {
      var res = await fetch('/video-data.json', { cache: 'no-cache' });
      if (!res.ok) return;
      var list = await res.json();
      if (!Array.isArray(list) || !list.length) return;
      var section = document.createElement('section');
      section.id = 'latest-videos';
      section.className = 'latest-videos';
      section.innerHTML = '<h2>最新视频</h2><div class="video-grid">' + list.slice(0, 8).map(card).join('') + '</div>';
      host.parentNode.insertBefore(section, host);
    } catch (error) {
      /* 静态数据缺失时静默跳过，不影响首页 */
    }
  }

  document.addEventListener('DOMContentLoaded', init);
  document.addEventListener('pjax:complete', init);
})();
