// URL fragments never reach the Worker. Carry ordinary application anchors to
// the fixed access entrypoint; its destination validator remains authoritative.
(() => {
  'use strict';
  function refresh() {
    const hash = /^#\/?[A-Za-z0-9][A-Za-z0-9/_-]{0,127}$/.test(location.hash) ? location.hash : '';
    for (const link of document.querySelectorAll('[data-access-start]')) {
      const start = new URL(link.href), target = new URL(start.searchParams.get('return'));
      if (start.origin !== location.origin || target.origin !== location.origin) continue;
      target.hash = hash;
      start.searchParams.set('return', target.href);
      link.href = start.href;
    }
  }
  refresh();
  window.addEventListener('hashchange', refresh);
})();
