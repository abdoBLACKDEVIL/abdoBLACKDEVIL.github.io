'use strict';
(() => {
  const validViews = ['walls', 'custom', 'shop', 'gallery'];
  const params = new URLSearchParams(location.search);
  const tabs = [...document.querySelectorAll('[data-view-tab]')];
  const views = [...document.querySelectorAll('[data-explore-view]')];
  const typeCards = [...document.querySelectorAll('[data-type-card]')];
  const tr = window.BLVK_I18N?.t || (value => value);

  function setTypeCard(card, expanded) {
    card.classList.toggle('is-expanded', expanded);
    const trigger = card.querySelector('.type-card-trigger');
    const details = card.querySelector('.type-card-details');
    trigger.setAttribute('aria-expanded', String(expanded));
    details.setAttribute('aria-hidden', String(!expanded));
    details.toggleAttribute('inert', !expanded);
  }

  function reflowTypeGrid(grid, update) {
    const cards = [...grid.querySelectorAll('[data-type-card]')];
    const before = new Map(cards.map(card => [card, card.getBoundingClientRect()]));
    update();
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !Element.prototype.animate) return;
    cards.forEach(card => {
      const from = before.get(card);
      const to = card.getBoundingClientRect();
      const x = from.left - to.left;
      const y = from.top - to.top;
      if (Math.abs(x) < 1 && Math.abs(y) < 1) return;
      card.animate([{ transform: `translate(${x}px, ${y}px)` }, { transform: 'translate(0, 0)' }], {
        duration: 480,
        easing: 'cubic-bezier(.22,1,.36,1)'
      });
    });
  }

  typeCards.forEach(card => card.querySelector('.type-card-trigger').addEventListener('click', () => {
    const expand = !card.classList.contains('is-expanded');
    const grid = card.closest('.type-grid');
    reflowTypeGrid(grid, () => grid.querySelectorAll('[data-type-card]').forEach(item => setTypeCard(item, item === card && expand)));
    if (expand) requestAnimationFrame(() => card.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }));
  }));
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    const expanded = document.querySelector('[data-type-card].is-expanded');
    if (!expanded) return;
    reflowTypeGrid(expanded.closest('.type-grid'), () => setTypeCard(expanded, false));
    expanded.querySelector('.type-card-trigger').focus();
  });

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
    typeCards.forEach(card => {
      if (card.closest('[data-explore-view]').dataset.exploreView !== selected) setTypeCard(card, false);
    });
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
