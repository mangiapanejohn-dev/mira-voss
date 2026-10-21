/* Mira Voss — behaviour shared by every page. Each feature switches on from markup. */
(() => {
  'use strict';
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const store = {
    get(key) { try { return JSON.parse(localStorage.getItem(key)); } catch (_) { return null; } },
    set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) { /* reading still works without storage */ } },
  };
  window.MiraSite = { store };

  /* ---------- The tide between pages ---------- */
  if (root.classList.contains('tide-in')) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      root.classList.add('tide-out');
      root.classList.remove('tide-in');
      setTimeout(() => root.classList.remove('tide-out'), 950);
    }));
  }
  const isPageLink = a => {
    if (!a || a.target || a.hasAttribute('download')) return false;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return false;
    if (url.pathname === location.pathname && url.search === location.search) return false;
    return /\.html$|\/$/.test(url.pathname);
  };
  document.addEventListener('click', event => {
    const a = event.target.closest('a[href]');
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (!isPageLink(a) || reduced) return;
    event.preventDefault();
    root.classList.remove('menu-open');
    root.classList.add('tide-cover');
    try { sessionStorage.setItem('mira-tide', '1'); } catch (_) { /* the next page simply appears */ }
    setTimeout(() => { location.href = a.href; }, 640);
  });
  addEventListener('pageshow', event => { if (event.persisted) root.classList.remove('tide-cover', 'tide-in', 'tide-out'); });

  /* ---------- Top bar and menu ---------- */
  const bar = $('.topbar');
  if (bar) {
    const solid = () => bar.classList.toggle('is-solid', scrollY > 24 || !!bar.dataset.alwaysSolid);
    solid();
    addEventListener('scroll', solid, { passive: true });
  }
  const toggle = $('.menu-toggle');
  if (toggle) {
    const setMenu = open => {
      root.classList.toggle('menu-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      $('#menu').toggleAttribute('inert', !open);
      if (open) $('#menu a')?.focus({ preventScroll: true });
    };
    $('#menu').setAttribute('inert', '');
    toggle.addEventListener('click', () => setMenu(!root.classList.contains('menu-open')));
    addEventListener('keydown', e => { if (e.key === 'Escape' && root.classList.contains('menu-open')) { setMenu(false); toggle.focus(); } });
    $$('#menu a').forEach((a, i) => { a.style.setProperty('--i', i); a.addEventListener('click', () => setMenu(false)); });
  }

  /* ---------- Masthead entrance ---------- */
  $$('[data-letters]').forEach(el => {
    // Letters arrive one by one, but words stay whole so lines break where the outline's do.
    let i = 0;
    const words = el.textContent.split(' ');
    el.textContent = '';
    words.forEach((word, w) => {
      const group = document.createElement('span');
      group.className = 'word';
      [...word].forEach(ch => {
        const s = document.createElement('span');
        s.textContent = ch;
        s.style.setProperty('--i', i++);
        group.append(s);
      });
      el.append(group);
      if (w < words.length - 1) { el.append(' '); i++; }
    });
  });
  const masthead = $('[data-masthead]');
  if (masthead) {
    const img = $('img', masthead);
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const ready = Promise.all([img && img.decode ? img.decode().catch(() => {}) : null, document.fonts ? document.fonts.ready : null]);
    Promise.race([ready, wait(600)]).then(() => wait(root.classList.contains('tide-out') ? 260 : 0)).then(() => {
      const go = () => masthead.classList.add('is-ready');
      requestAnimationFrame(go);
      setTimeout(go, 120);
      $$('.misreg', masthead).forEach(el => setTimeout(() => el.classList.add('is-in'), 300));
    });
    const art = $('[data-parallax]', masthead);
    if (art && !reduced) {
      let ticking = false;
      addEventListener('scroll', () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          const y = Math.min(scrollY, innerHeight * 1.2);
          art.style.transform = `translate3d(0, ${y * 0.32}px, 0)`;
          ticking = false;
        });
      }, { passive: true });
    }
  }

  /* ---------- Scroll reveals ---------- */
  const seen = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      el.classList.add(el.matches('[data-isobaths]') ? 'is-drawn' : 'is-in');
      if (el.classList.contains('halftone')) {
        const done = () => el.classList.add('is-printed');
        el.addEventListener('transitionend', done, { once: true });
        setTimeout(done, 2200);
      }
      seen.unobserve(el);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: .12 });
  const watch = el => seen.observe(el);
  $$('[data-stagger]').forEach(group => $$('.reveal', group).forEach((el, i) => el.style.setProperty('--rd', `${i * 70}ms`)));
  $$('.reveal, .halftone, .misreg:not([data-masthead] .misreg)').forEach(watch);
  if (reduced || !('CSS' in window && CSS.registerProperty)) $$('.halftone').forEach(el => el.classList.add('is-in', 'is-printed'));

  /* ---------- Inline SVG art: sea-chart lines, the Rovelle chart, the MØBIUS loop ---------- */
  const inline = (el, url) => fetch(url).then(r => r.ok ? r.text() : Promise.reject(r.status)).then(svg => { el.innerHTML = svg; return el; });
  $$('[data-isobaths]').forEach(el => inline(el, el.dataset.isobaths).then(() => {
    $$('path', el).forEach((p, i) => {
      p.setAttribute('pathLength', '1');
      p.style.setProperty('--i', i);
      // Some lines stop short: the chart is unfinished.
      if (i % 4 === 1) p.style.setProperty('--stop', String(.35 + (i % 3) * .12));
    });
    if (reduced) el.classList.add('is-drawn'); else watch(el);
  }).catch(() => {}));
  $$('[data-inline-svg]').forEach(el => inline(el, el.dataset.inlineSvg).then(() => el.dispatchEvent(new CustomEvent('svg:ready', { bubbles: true }))).catch(() => {}));

  /* ---------- Tabs: abilities, art viewer, bells ---------- */
  $$('[data-tabs]').forEach(group => {
    const tabs = $$('[role="tab"]', group);
    const select = (tab, focus) => {
      if (tab.getAttribute('aria-selected') === 'true') return;
      tabs.forEach(t => { const on = t === tab; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; });
      if (focus) tab.focus();
      group.dispatchEvent(new CustomEvent('tab:select', { detail: tab }));
    };
    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => select(tab));
      tab.addEventListener('keydown', e => {
        const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        if (e.key === 'Home' || e.key === 'End') { e.preventDefault(); select(tabs[e.key === 'Home' ? 0 : tabs.length - 1], true); }
        if (!step) return;
        e.preventDefault();
        select(tabs[(i + step + tabs.length) % tabs.length], true);
      });
    });
  });
  const swap = (panel, update) => {
    if (reduced || !panel.animate) { update(); return; }
    panel.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(-14px)' }], { duration: 170, easing: 'ease-in', fill: 'forwards' }).finished.then(() => {
      update();
      panel.animate([{ opacity: 0, transform: 'translateX(18px)' }, { opacity: 1, transform: 'none' }], { duration: 520, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'forwards' });
    });
  };
  $$('[data-abilities]').forEach(group => {
    const panel = $('[data-ability-panel]', group);
    group.addEventListener('tab:select', ({ detail: tab }) => swap(panel, () => {
      $('[data-slot]', panel).textContent = tab.dataset.slot;
      $('[data-name]', panel).textContent = tab.dataset.name;
      $('[data-text]', panel).innerHTML = $(`template[data-for="${tab.dataset.key}"]`, group).innerHTML;
      $('[data-key]', panel).textContent = tab.dataset.key.toUpperCase();
      const glyph = $('[data-glyph]', panel);
      if (glyph && tab.dataset.glyph) {
        $('use', glyph).setAttribute('href', tab.dataset.glyph);
        glyph.classList.remove('is-drawing'); void glyph.getBoundingClientRect(); glyph.classList.add('is-drawing');
      }
      panel.setAttribute('aria-labelledby', tab.id);
    }));
  });
  $$('[data-art]').forEach(group => {
    const caption = $('[data-art-caption]', group);
    group.addEventListener('tab:select', ({ detail: tab }) => {
      $$('[data-slide]', group).forEach(s => s.classList.toggle('is-active', s.dataset.slide === tab.dataset.slide));
      swap(caption, () => { $('h3', caption).textContent = tab.dataset.name; $('p', caption).textContent = tab.dataset.text; });
    });
  });

  /* ---------- Copy the install command ---------- */
  $$('[data-copy]').forEach(button => button.addEventListener('click', async () => {
    const text = $(button.dataset.copy).textContent.trim();
    const label = $('[data-copy-label]', button);
    try { await navigator.clipboard.writeText(text); label.textContent = 'Copied'; }
    catch (_) {
      const range = document.createRange(); range.selectNodeContents($(button.dataset.copy));
      getSelection().removeAllRanges(); getSelection().addRange(range); label.textContent = 'Selected';
    }
    setTimeout(() => { label.textContent = 'Copy'; }, 1800);
  }));

  /* ---------- Continue reading (saved by the reader) ---------- */
  const saved = store.get('mira-reading-v3');
  const library = window.MIRA_LIBRARY || [];
  const savedWork = saved && library.find(w => w.id === saved.work);
  const savedChapter = savedWork && savedWork.chapters.find(c => c.id === saved.chapter);
  $$('[data-continue]').forEach(el => {
    if (!savedChapter || (saved.ratio < .02 && savedChapter === savedWork.chapters[0])) return;
    el.hidden = false;
    $$('a', el).concat(el.matches('a') ? [el] : []).forEach(a => { a.href = `read.html?work=${savedWork.id}&chapter=${savedChapter.id}&resume=1`; });
    $$('[data-continue-work]', el).forEach(n => { n.textContent = savedWork.short_zh; });
    $$('[data-continue-chapter]', el).forEach(n => { n.textContent = `${savedChapter.label} · ${savedChapter.title}`; });
    $$('[data-continue-progress]', el).forEach(n => n.style.setProperty('--p', saved.ratio));
  });

  /* ---------- The Rovelle chart: places on the map and in the list answer each other ---------- */
  const chartWrap = $('[data-chart]');
  if (chartWrap) {
    const detail = $('[data-place-detail]');
    const items = $$('[data-place-item]');
    const choose = (id, scroll) => {
      const item = items.find(i => i.dataset.placeItem === id);
      if (!item) return;
      items.forEach(i => i.setAttribute('aria-pressed', String(i === item)));
      $$('.place', chartWrap).forEach(p => p.classList.toggle('is-active', p.dataset.place === id));
      swap(detail, () => {
        detail.querySelector('h3').textContent = item.dataset.name;
        detail.querySelector('[data-zh]').textContent = item.dataset.zh;
        detail.querySelector('p').textContent = item.dataset.text;
        const link = detail.querySelector('a');
        link.href = item.dataset.href; link.querySelector('span').textContent = item.dataset.where;
      });
      if (scroll && innerWidth < 960) detail.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'nearest' });
    };
    const hover = (id, on) => {
      $$('.place', chartWrap).forEach(p => p.classList.toggle('is-hover', on && p.dataset.place === id));
      items.forEach(i => i.classList.toggle('is-hover', on && i.dataset.placeItem === id));
    };
    items.forEach(i => {
      i.addEventListener('click', () => choose(i.dataset.placeItem));
      i.addEventListener('mouseenter', () => hover(i.dataset.placeItem, true));
      i.addEventListener('mouseleave', () => hover(i.dataset.placeItem, false));
    });
    chartWrap.addEventListener('svg:ready', () => {
      $$('.place', chartWrap).forEach(p => {
        p.addEventListener('click', () => choose(p.dataset.place, true));
        p.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(p.dataset.place, true); } });
        p.addEventListener('mouseenter', () => hover(p.dataset.place, true));
        p.addEventListener('mouseleave', () => hover(p.dataset.place, false));
      });
      $$('.place', chartWrap).forEach((p, i) => p.style.setProperty('--i', i));
      chartWrap.classList.add('is-ready');
      choose(items[0].dataset.placeItem);
    });
  }

  /* ---------- The MØBIUS loop: a pen travels the tape, front and back, without lifting ---------- */
  $$('[data-mobius]').forEach(el => el.addEventListener('svg:ready', () => {
    const path = $('.mobius-centre', el);
    const svg = $('svg', el);
    if (!path || !svg) return;
    const pen = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    pen.setAttribute('r', '6'); pen.setAttribute('class', 'mobius-pen');
    const trail = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    trail.setAttribute('class', 'mobius-trail');
    svg.append(trail, pen);
    const length = path.getTotalLength();
    let visible = false;
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(el);
    const draw = t => {
      const at = (t / 16000 % 1) * length;
      const p = path.getPointAtLength(at);
      pen.setAttribute('cx', p.x); pen.setAttribute('cy', p.y);
      const pts = [];
      for (let k = 0; k < 40; k++) { const q = path.getPointAtLength((at - k * 6 + length) % length); pts.push(`${q.x.toFixed(1)} ${q.y.toFixed(1)}`); }
      trail.setAttribute('d', `M${pts.join(' L')}`);
    };
    if (reduced) { draw(4000); return; }
    const frame = t => { if (visible) draw(t); requestAnimationFrame(frame); };
    requestAnimationFrame(frame);
  }));

  /* ---------- Bells: each one rings when chosen ---------- */
  $$('[data-bells]').forEach(group => {
    const panel = $('[data-bell-panel]', group);
    group.addEventListener('tab:select', ({ detail: tab }) => {
      const bell = $('.bell-shape', tab);
      if (bell && !reduced && bell.animate) bell.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(14deg)' }, { transform: 'rotate(-10deg)' }, { transform: 'rotate(6deg)' }, { transform: 'rotate(-3deg)' }, { transform: 'rotate(0)' }], { duration: 1300, easing: 'ease-out' });
      swap(panel, () => {
        $('h3', panel).textContent = tab.dataset.name;
        $('p', panel).textContent = tab.dataset.text;
        $('[data-count]', panel).textContent = tab.dataset.count;
      });
    });
  });
  /* ---------- Universe sub-bar: a crumb, a track of the page's sections, back to top ---------- */
  const crumb = document.body.dataset.subbar;
  const sections = $$('main > section[data-nav]');
  if (crumb && sections.length > 1) {
    const sub = document.createElement('div');
    sub.className = 'subbar';
    sub.innerHTML = '<a class="subbar-crumb" href="index.html"><img src="assets/mira-logo-cutout.webp" alt="" /><span></span></a>'
      + '<a class="subbar-top" href="#main" aria-label="Back to top"><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M6 10V2M2.5 5.5L6 2l3.5 3.5" fill="none" stroke="currentColor" stroke-width="1.4"/></svg></a>'
      + '<div class="subbar-track"><span class="subbar-fill"></span></div>';
    $('span', sub).textContent = crumb;
    const track = $('.subbar-track', sub);
    const fill = $('.subbar-fill', sub);
    const dots = sections.map(section => {
      const a = document.createElement('a');
      a.className = 'subbar-dot';
      a.href = `#${section.id || (section.id = `s-${Math.random().toString(36).slice(2, 7)}`)}`;
      a.innerHTML = '<span></span>';
      a.firstChild.textContent = section.dataset.nav;
      a.setAttribute('aria-label', section.dataset.nav);
      track.append(a);
      return a;
    });
    $('.subbar-top', sub).addEventListener('click', e => { e.preventDefault(); scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }); });
    document.body.append(sub);
    const head = $('[data-masthead]');
    let queued = false;
    const place = () => {
      queued = false;
      const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      const tops = sections.map(sec => Math.min(1, sec.offsetTop / max));
      dots.forEach((d, i) => { d.style.left = `${4 + tops[i] * 92}%`; });
      const r = Math.min(1, scrollY / max);
      fill.style.transform = `scaleX(${(4 + r * 92) / 100})`;
      let current = -1;
      sections.forEach((sec, i) => { if (sec.getBoundingClientRect().top < innerHeight * .45) current = i; });
      dots.forEach((d, i) => { d.classList.toggle('is-past', i < current); d.classList.toggle('is-current', i === current); });
      sub.classList.toggle('is-shown', scrollY > (head ? head.offsetHeight - 120 : 200));
    };
    const queue = () => { if (!queued) { queued = true; requestAnimationFrame(place); } };
    addEventListener('scroll', queue, { passive: true });
    addEventListener('resize', queue, { passive: true });
    addEventListener('load', queue);
    place();
  }

  /* ---------- Abilities play through on their own, as on a champion page ---------- */
  $$('[data-abilities][data-autoplay]').forEach(group => {
    const tabs = $$('[role="tab"]', group);
    let stopped = reduced;
    const arm = () => {
      tabs.forEach(t => t.classList.remove('is-timing'));
      if (stopped) return;
      const current = tabs.find(t => t.getAttribute('aria-selected') === 'true');
      void current.offsetWidth;
      current.classList.add('is-timing');
    };
    tabs.forEach((tab, i) => {
      const meter = document.createElement('i');
      meter.className = 'tab-meter';
      meter.setAttribute('aria-hidden', 'true');
      meter.addEventListener('animationend', () => { if (!stopped) tabs[(i + 1) % tabs.length].click(); });
      tab.append(meter);
      tab.addEventListener('pointerdown', () => { stopped = true; });
      tab.addEventListener('keydown', () => { stopped = true; });
    });
    group.addEventListener('tab:select', () => requestAnimationFrame(arm));
    group.addEventListener('mouseenter', () => group.classList.add('is-paused'));
    group.addEventListener('mouseleave', () => group.classList.remove('is-paused'));
    new IntersectionObserver(([e]) => group.classList.toggle('is-offscreen', !e.isIntersecting)).observe(group);
    arm();
  });

  /* ---------- Art viewer arrows ---------- */
  $$('[data-art]').forEach(group => {
    const tabs = $$('[role="tab"]', group);
    const step = d => {
      const i = tabs.findIndex(t => t.getAttribute('aria-selected') === 'true');
      tabs[(i + d + tabs.length) % tabs.length].click();
    };
    $$('[data-art-prev]', group).forEach(b => b.addEventListener('click', () => step(-1)));
    $$('[data-art-next]', group).forEach(b => b.addEventListener('click', () => step(1)));
  });
  /* ---------- A soft light follows the pointer across gold buttons ---------- */
  if (!reduced) document.addEventListener('pointermove', e => {
    const b = e.target.closest && e.target.closest('.btn-gold');
    if (!b) return;
    const r = b.getBoundingClientRect();
    b.style.setProperty('--mx', `${e.clientX - r.left}px`);
    b.style.setProperty('--my', `${e.clientY - r.top}px`);
  }, { passive: true });
})();
