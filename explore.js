'use strict';
(() => {
  const validViews = ['walls', 'custom', 'shop', 'gallery'];
  const params = new URLSearchParams(location.search);
  const tabs = [...document.querySelectorAll('[data-view-tab]')];
  const views = [...document.querySelectorAll('[data-explore-view]')];
  const tr = window.BLVK_I18N?.t || (value => value);

  function viewUrl(view) {
    const url = new URL(location.href);
    url.searchParams.set('view', view);
    url.searchParams.delete('filter');
    return url;
  }
  function activate(view, historyMode) {
    const selected = validViews.includes(view) ? view : 'walls';
    tabs.forEach(tab => {
      const active = tab.dataset.viewTab === selected;
      if (active) tab.setAttribute('aria-current', 'page'); else tab.removeAttribute('aria-current');
      tab.href = viewUrl(tab.dataset.viewTab).href;
    });
    views.forEach(panel => { panel.hidden = panel.dataset.exploreView !== selected; });
    document.body.dataset.exploreView = selected;
    document.title = `${tr(tabs.find(tab => tab.dataset.viewTab === selected)?.textContent.trim() || 'Explore')} — Blvk Ink`;
    if (historyMode) history[historyMode]({ view: selected }, '', viewUrl(selected));
  }
  tabs.forEach(tab => tab.addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    activate(tab.dataset.viewTab, 'pushState');
    document.querySelector('.explore-tabs').scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }));
  addEventListener('popstate', () => activate(new URLSearchParams(location.search).get('view')));
  activate(params.get('view'));

  document.querySelectorAll('[data-collection]').forEach(collection => {
    const kind = collection.dataset.collection;
    const cards = [...collection.querySelectorAll('[data-explore-category]')];
    const filters = [...collection.querySelectorAll('[data-explore-filter]')];
    const search = collection.querySelector('[data-explore-search]');
    const grid = collection.querySelector('.explore-collection-grid');
    const status = collection.querySelector('.explore-status');
    let category = params.get('view') === kind && params.get('filter') ? params.get('filter') : 'all';
    let query = '';
    function render() {
      let shown = 0;
      cards.forEach(card => {
        const categoryMatch = category === 'all' || card.dataset.exploreCategory === category;
        const searchableText = `${card.dataset.exploreTitle} ${card.textContent}`.toLowerCase();
        const textMatch = !query || searchableText.includes(query);
        card.hidden = !(categoryMatch && textMatch);
        if (!card.hidden) shown++;
      });
      filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.exploreFilter === category)));
      status.textContent = tr(`${shown} pieces shown.`);
    }
    filters.forEach(button => button.addEventListener('click', () => { category = button.dataset.exploreFilter; render(); }));
    search.addEventListener('input', () => { query = search.value.trim().toLowerCase(); render(); });
    collection.querySelectorAll('[data-density]').forEach(button => button.addEventListener('click', () => {
      const list = button.dataset.density === 'list';
      grid.classList.toggle('is-list', list);
      collection.querySelectorAll('[data-density]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    }));
    if (!filters.some(button => button.dataset.exploreFilter === category)) category = 'all';
    render();
  });
})();
