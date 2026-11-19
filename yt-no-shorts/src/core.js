/* YT No Shorts — вырезает Shorts с youtube.com и m.youtube.com */
(function () {
  'use strict';
  if (window.__ytNoShorts) return;
  window.__ytNoShorts = true;

  // ---- 1. CSS: мгновенно прячем всё, что узнаётся по разметке ----
  var CSS = [
    // Мобильная версия (m.youtube.com)
    'ytm-reel-shelf-renderer',
    'ytm-shorts-lockup-view-model',
    'ytm-shorts-lockup-view-model-v2',
    'ytm-rich-section-renderer:has(ytm-shorts-lockup-view-model, ytm-shorts-lockup-view-model-v2, ytm-reel-shelf-renderer)',
    'ytm-rich-item-renderer:has(a[href^="/shorts/"])',
    'ytm-video-with-context-renderer:has(a[href^="/shorts/"])',
    'ytm-compact-video-renderer:has(a[href^="/shorts/"])',
    'ytm-item-section-renderer:has(> lazy-list > ytm-reel-shelf-renderer:only-child)',
    'ytm-pivot-bar-item-renderer:has(.pivot-shorts)',
    'ytm-pivot-bar-item-renderer:has(a[href^="/shorts"])',
    'grid-shelf-view-model:has(ytm-shorts-lockup-view-model, ytm-shorts-lockup-view-model-v2, a[href^="/shorts/"])',
    // Десктоп / «версия для ПК» (www.youtube.com)
    'ytd-reel-shelf-renderer',
    'ytd-rich-shelf-renderer[is-shorts]',
    'ytd-rich-section-renderer:has(ytd-rich-shelf-renderer[is-shorts])',
    'ytd-rich-item-renderer:has(a[href^="/shorts/"])',
    'ytd-rich-item-renderer:has(ytm-shorts-lockup-view-model, ytm-shorts-lockup-view-model-v2)',
    'ytd-video-renderer:has(a[href^="/shorts/"])',
    'ytd-grid-video-renderer:has(a[href^="/shorts/"])',
    'ytd-compact-video-renderer:has(a[href^="/shorts/"])',
    'ytd-guide-entry-renderer:has(a[title="Shorts"])',
    'ytd-mini-guide-entry-renderer[aria-label="Shorts"]',
    'yt-tab-shape[tab-title="Shorts"]',
    'tp-yt-paper-tab:has(> .tab-content[title="Shorts"])',
    'ytd-reel-video-renderer'
  ].join(',\n') + ' { display: none !important; }';

  function injectCss() {
    if (document.getElementById('yt-no-shorts-css')) return;
    var s = document.createElement('style');
    s.id = 'yt-no-shorts-css';
    s.textContent = CSS;
    var root = document.head || document.documentElement;
    if (root) root.appendChild(s);
  }

  // ---- 2. Открытие /shorts/ID → обычный плеер /watch?v=ID ----
  function redirectIfShorts() {
    var m = location.pathname.match(/^\/shorts\/([\w-]{6,})/);
    if (m) location.replace('/watch?v=' + m[1] + location.search.replace(/^\?/, '&'));
  }
  redirectIfShorts();

  // Перехватываем клики по ссылкам на шортсы (YouTube — SPA, обычной навигации нет)
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest && e.target.closest('a[href*="/shorts/"]');
    if (!a) return;
    var m = a.getAttribute('href').match(/\/shorts\/([\w-]{6,})/);
    if (!m) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    location.assign('/watch?v=' + m[1]);
  }, true);

  // ---- 3. То, что CSS не ловит: элементы с текстом «Shorts» ----
  var TEXT_TARGETS = [
    'ytm-pivot-bar-item-renderer',      // нижняя панель (мобайл)
    'ytm-chip-cloud-chip-renderer',     // чипсы-фильтры в поиске/на главной
    'yt-chip-cloud-chip-renderer',
    'ytm-tab-renderer',
    'yt-tab-shape',
    'ytd-guide-entry-renderer',
    'ytd-mini-guide-entry-renderer'
  ].join(',');
  var SHORTS_RE = /^\s*(shorts|шортс[ыи]?)\s*$/i;

  function sweep() {
    var els = document.querySelectorAll(TEXT_TARGETS);
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el.__ytnsChecked === el.textContent) continue;
      el.__ytnsChecked = el.textContent;
      if (SHORTS_RE.test(el.textContent)) el.style.setProperty('display', 'none', 'important');
    }
    redirectIfShorts();
  }

  var scheduled = false;
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    setTimeout(function () {
      scheduled = false;
      injectCss();
      sweep();
    }, 150);
  }

  function start() {
    injectCss();
    new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });
    sweep();
  }
  if (document.documentElement) start();
  else {
    // На самом раннем этапе загрузки <html> ещё нет — ждём его появления
    var wait = new MutationObserver(function () {
      if (document.documentElement) { wait.disconnect(); start(); }
    });
    wait.observe(document, { childList: true });
  }

  // SPA-навигация
  ['yt-navigate-finish', 'state-navigateend', 'popstate'].forEach(function (ev) {
    window.addEventListener(ev, function () { redirectIfShorts(); schedule(); });
  });
})();
