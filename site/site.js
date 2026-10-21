/* Mira Voss — behaviour shared by every page. Each feature switches on from markup. */
(() => {
  'use strict';
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const raw = key => { try { return JSON.parse(localStorage.getItem(key)); } catch (_) { return null; } };
  const store = {
    get: raw,
    // After "Don't remember", only that choice itself is kept.
    set(key, value) {
      if (raw('mira-consent') === 'essential' && key !== 'mira-consent') return;
      try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) { /* everything still works without storage */ }
    },
  };

  /* ---------- Language: English and Chinese on every page ---------- */
  const lang = () => (root.dataset.lang === 'zh' ? 'zh' : 'en');
  const cap = s => s[0].toUpperCase() + s.slice(1);
  // A component's text for the current language: data-zh-<key> in Chinese, data-<key> otherwise.
  const t = (el, key) => (lang() === 'zh' && el.dataset[`zh${cap(key)}`] !== undefined ? el.dataset[`zh${cap(key)}`] : el.dataset[key]);
  const UI = {
    en: { copy: 'Copy', copied: 'Copied', selected: 'Selected', top: 'Back to top' },
    zh: { copy: '复制', copied: '已复制', selected: '已选中', top: '回到顶部' },
  };
  const ui = key => UI[lang()][key];
  const ATTRS = { zhAria: 'aria-label', zhAlt: 'alt', zhMisreg: 'data-text', zhContent: 'content' };
  const applyLang = l => {
    $$('[data-zh]').forEach(el => {
      if (el.dataset.en === undefined) el.dataset.en = el.innerHTML;
      el.innerHTML = l === 'zh' ? el.dataset.zh : el.dataset.en;
    });
    Object.entries(ATTRS).forEach(([key, attr]) => {
      const sel = `[data-${key.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`)}]`;
      $$(sel).forEach(el => {
        const keep = `en${key.slice(2)}`;
        if (el.dataset[keep] === undefined) el.dataset[keep] = el.getAttribute(attr) || '';
        el.setAttribute(attr, l === 'zh' ? el.dataset[key] : el.dataset[keep]);
      });
    });
    root.dataset.lang = l;
    root.lang = l === 'zh' ? 'zh-Hans' : 'en';
    $$('[data-set-lang]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.setLang === l)));
    document.dispatchEvent(new CustomEvent('lang:change', { detail: l }));
  };
  applyLang(lang());
  root.classList.remove('i18n-pending');
  $$('[data-set-lang]').forEach(button => button.addEventListener('click', () => {
    const l = button.dataset.setLang;
    if (l === lang()) return;
    store.set('mira-lang', l);
    const url = new URL(location.href);
    if (url.searchParams.has('lang')) { url.searchParams.set('lang', l); history.replaceState(null, '', url); }
    if (reduced) { applyLang(l); return; }
    // Words blur out, change, and settle back in.
    root.classList.add('lang-out');
    setTimeout(() => {
      applyLang(l);
      root.classList.remove('lang-out');
      root.classList.add('lang-in');
      setTimeout(() => root.classList.remove('lang-in'), 700);
    }, 230);
  }));

  /* ---------- Cookie and storage notice ---------- */
  const notice = $('[data-consent]');
  if (notice && !raw('mira-consent')) {
    setTimeout(() => { notice.hidden = false; requestAnimationFrame(() => notice.classList.add('is-shown')); setTimeout(() => notice.classList.add('is-shown'), 60); }, 1200);
    const close = value => {
      try { localStorage.setItem('mira-consent', JSON.stringify(value)); } catch (_) { /* nothing to keep */ }
      notice.classList.remove('is-shown');
      setTimeout(() => { notice.hidden = true; }, 500);
    };
    $('[data-consent-ok]', notice).addEventListener('click', () => close('ok'));
    $('[data-consent-forget]', notice).addEventListener('click', () => {
      try { Object.keys(localStorage).filter(k => k.startsWith('mira-')).forEach(k => localStorage.removeItem(k)); } catch (_) { /* nothing stored */ }
      close('essential');
    });
  }
  window.MiraSite = { store, lang, t };

  /* ---------- The tide between pages ---------- */
  if (root.classList.contains('tide-in')) {
    const drain = () => {
      if (!root.classList.contains('tide-in')) return;
      root.classList.add('tide-out');
      root.classList.remove('tide-in');
      setTimeout(() => root.classList.remove('tide-out'), 950);
    };
    requestAnimationFrame(() => requestAnimationFrame(drain));
    setTimeout(drain, 120);
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
    if (!isPageLink(a)) return;
    const url = new URL(a.href, location.href);
    // Without stored preferences, the language travels in the address.
    if (raw('mira-consent') === 'essential' && lang() === 'zh') url.searchParams.set('lang', 'zh');
    if (reduced) { if (url.href !== a.href) { event.preventDefault(); location.href = url.href; } return; }
    event.preventDefault();
    root.classList.remove('menu-open');
    root.classList.add('tide-cover');
    try { sessionStorage.setItem('mira-tide', '1'); } catch (_) { /* the next page simply appears */ }
    setTimeout(() => { location.href = url.href; }, 640);
  });
  addEventListener('pageshow', event => { if (event.persisted) root.classList.remove('tide-cover', 'tide-in', 'tide-out'); });

  /* ---------- Menu on small screens ---------- */
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
  const splitLetters = el => {
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
  };
  $$('[data-letters]').forEach(splitLetters);
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
  }

  /* ---------- Depth: the opening art and each section's atmosphere move at their own pace ---------- */
  if (!reduced) {
    const layers = [];
    const art = masthead && $('[data-parallax]', masthead);
    if (art) layers.push({ el: art, speed: .32, from: 'top' });
    $$('.atmos').forEach(el => layers.push({ el, speed: -.12, from: 'centre' }));
    let ticking = false;
    const move = () => {
      ticking = false;
      layers.forEach(({ el, speed, from }) => {
        if (from === 'top') { el.style.transform = `translate3d(0, ${Math.min(scrollY, innerHeight * 1.2) * speed}px, 0)`; return; }
        const r = el.parentElement.getBoundingClientRect();
        if (r.bottom < -200 || r.top > innerHeight + 200) return;
        el.style.transform = `translate3d(0, ${(r.top + r.height / 2 - innerHeight / 2) * speed}px, 0)`;
      });
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(move); } }, { passive: true });
    move();
  }

  /* ---------- Scroll reveals: several kinds, chosen per section ---------- */
  // ink: a line of text arrives character by character, as if written
  $$('[data-ink]').forEach(el => {
    const prepare = () => {
      const nodes = [...el.childNodes];
      el.textContent = '';
      let i = 0;
      const letter = ch => {
        const s = document.createElement('span');
        s.className = 'ink';
        s.textContent = ch;
        s.style.setProperty('--i', i++);
        return s;
      };
      nodes.forEach(node => {
        if (node.nodeType === 1 && node.tagName === 'BR') { el.append(document.createElement('br')); return; }
        // A Latin word stays whole on its line; Chinese may break between any two characters.
        (node.textContent.match(/\s+|[\u2e80-\u9fff\u3000-\u303f\uff00-\uffef]|[^\s\u2e80-\u9fff\u3000-\u303f\uff00-\uffef]+/g) || []).forEach(token => {
          if (!token.trim()) { el.append(' '); return; }
          if (token.length === 1) { el.append(letter(token)); return; }
          const word = document.createElement('span');
          word.className = 'ink-word';
          [...token].forEach(ch => word.append(letter(ch)));
          el.append(word);
        });
      });
    };
    prepare();
    document.addEventListener('lang:change', prepare);
  });
  // cascade: children of a list arrive one after another
  $$('[data-cascade]').forEach(list => [...list.children].forEach((child, i) => child.style.setProperty('--ci', i)));
  // Chrome measures a target through its own clip-path, so an element that starts clipped to
  // nothing never counts as seen: those are watched through their parent, which is never clipped.
  const clipped = '[data-reveal="mask"], [data-reveal="wipe"], [data-reveal="unfold"]';
  const direct = new Set();
  const proxied = new Map();
  const arrive = el => {
    el.classList.add(el.matches('[data-isobaths]') ? 'is-drawn' : 'is-in');
    if (el.matches('[data-tilt]')) setTimeout(() => el.classList.add('is-settled'), 1600);
    if (el.classList.contains('halftone')) {
      const done = () => el.classList.add('is-printed');
      el.addEventListener('transitionend', done, { once: true });
      setTimeout(done, 2200);
    }
  };
  const seen = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const target = entry.target;
      if (direct.has(target)) arrive(target);
      (proxied.get(target) || []).forEach(arrive);
      seen.unobserve(target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: .12 });
  const watch = el => {
    const parent = el.parentElement;
    if (!el.matches(clipped) || !parent) direct.add(el);
    else proxied.set(parent, [...(proxied.get(parent) || []), el]);
    seen.observe(el.matches(clipped) && parent ? parent : el);
  };
  $$('[data-stagger]').forEach(group => $$('.reveal, [data-reveal]', group).forEach((el, i) => el.style.setProperty('--rd', `${i * 80}ms`)));
  $$('.reveal, .halftone, [data-reveal], [data-ink], [data-cascade], .misreg:not([data-masthead] .misreg)').forEach(watch);
  if (reduced || !('CSS' in window && CSS.registerProperty)) $$('.halftone').forEach(el => el.classList.add('is-in', 'is-printed'));

  /* ---------- Cards lean toward the pointer ---------- */
  if (finePointer && !reduced) {
    $$('[data-tilt]').forEach(card => {
      const max = Number(card.dataset.tilt) || 6;
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5;
        const y = (e.clientY - r.top) / r.height - .5;
        card.style.setProperty('--rx', `${(-y * max).toFixed(2)}deg`);
        card.style.setProperty('--ry', `${(x * max).toFixed(2)}deg`);
        card.style.setProperty('--px', `${((x + .5) * 100).toFixed(1)}%`);
        card.style.setProperty('--py', `${((y + .5) * 100).toFixed(1)}%`);
        card.style.setProperty('--tx', `${(-x * 14).toFixed(1)}px`);
        card.style.setProperty('--ty', `${(-y * 14).toFixed(1)}px`);
      });
      card.addEventListener('pointerleave', () => { ['--rx', '--ry'].forEach(v => card.style.setProperty(v, '0deg')); ['--tx', '--ty'].forEach(v => card.style.setProperty(v, '0px')); });
    });
  }

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
      const from = tabs.findIndex(x => x.getAttribute('aria-selected') === 'true');
      tabs.forEach(x => { const on = x === tab; x.setAttribute('aria-selected', String(on)); x.tabIndex = on ? 0 : -1; });
      if (focus) tab.focus();
      group.dataset.dir = tabs.indexOf(tab) > from ? 'next' : 'prev';
      group.dispatchEvent(new CustomEvent('tab:select', { detail: tab, bubbles: false }));
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
  const current = group => $$('[role="tab"]', group).find(x => x.getAttribute('aria-selected') === 'true');
  const swap = (panel, update, style = 'slide') => {
    if (reduced || !panel.animate) { update(); return; }
    const out = style === 'rise' ? [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-10px)' }] : [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(-14px)' }];
    const into = style === 'rise' ? [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }] : [{ opacity: 0, transform: 'translateX(18px)' }, { opacity: 1, transform: 'none' }];
    panel.animate(out, { duration: 170, easing: 'ease-in', fill: 'forwards' }).finished.then(() => {
      update();
      panel.animate(into, { duration: 520, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'forwards' });
    });
  };

  $$('[data-abilities]').forEach(group => {
    const panel = $('[data-ability-panel]', group);
    const fill = tab => {
      const tpl = $(`template[data-for="${tab.dataset.key}"]`, group);
      $('[data-slot]', panel).textContent = t(tab, 'slot');
      $('[data-name]', panel).textContent = t(tab, 'name');
      $('[data-text]', panel).innerHTML = lang() === 'zh' && tpl.dataset.zh ? tpl.dataset.zh : tpl.innerHTML;
      $('[data-key]', panel).textContent = tab.dataset.key.toUpperCase();
      panel.setAttribute('aria-labelledby', tab.id);
    };
    group.addEventListener('tab:select', ({ detail: tab }) => swap(panel, () => {
      fill(tab);
      const glyph = $('[data-glyph]', panel);
      if (glyph && tab.dataset.glyph) {
        $('use', glyph).setAttribute('href', tab.dataset.glyph);
        glyph.classList.remove('is-drawing'); void glyph.getBoundingClientRect(); glyph.classList.add('is-drawing');
      }
    }, 'rise'));
    document.addEventListener('lang:change', () => fill(current(group)));
  });

  $$('[data-art]').forEach(group => {
    const caption = $('[data-art-caption]', group);
    const fill = tab => { $('h3', caption).textContent = t(tab, 'name'); $('p', caption).textContent = t(tab, 'body'); };
    group.addEventListener('tab:select', ({ detail: tab }) => {
      // Slides travel the way the viewer moved.
      const dir = group.dataset.dir === 'prev' ? -1 : 1;
      $$('[data-slide]', group).forEach(s => {
        const on = s.dataset.slide === tab.dataset.slide;
        if (on && s.animate && !reduced) s.animate([{ transform: `translateX(${dir * 6}%) scale(1.04)`, opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 900, easing: 'cubic-bezier(.16,1,.3,1)' });
        s.classList.toggle('is-active', on);
      });
      swap(caption, () => fill(tab), 'rise');
    });
    const step = d => {
      const tabs = $$('[role="tab"]', group);
      const i = tabs.indexOf(current(group));
      tabs[(i + d + tabs.length) % tabs.length].click();
    };
    $$('[data-art-prev]', group).forEach(b => b.addEventListener('click', () => step(-1)));
    $$('[data-art-next]', group).forEach(b => b.addEventListener('click', () => step(1)));
    document.addEventListener('lang:change', () => fill(current(group)));
  });

  /* ---------- Abilities play through on their own, as on a champion page ---------- */
  $$('[data-abilities][data-autoplay]').forEach(group => {
    const tabs = $$('[role="tab"]', group);
    let stopped = reduced;
    const arm = () => {
      tabs.forEach(x => x.classList.remove('is-timing'));
      if (stopped) return;
      const now = current(group);
      void now.offsetWidth;
      now.classList.add('is-timing');
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

  /* ---------- Bells: the chosen one swings and its sound spreads in rings ---------- */
  $$('[data-bells]').forEach(group => {
    const panel = $('[data-bell-panel]', group);
    const fill = tab => {
      $('h3', panel).textContent = t(tab, 'name');
      $('p', panel).textContent = t(tab, 'body');
      $('[data-count]', panel).textContent = t(tab, 'count');
    };
    group.addEventListener('tab:select', ({ detail: tab }) => {
      const bell = $('.bell-shape', tab);
      if (bell && !reduced && bell.animate) {
        bell.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(16deg)' }, { transform: 'rotate(-12deg)' }, { transform: 'rotate(7deg)' }, { transform: 'rotate(-3deg)' }, { transform: 'rotate(0)' }], { duration: 1400, easing: 'ease-out' });
        const rings = Number(tab.dataset.rings) || 1;
        for (let k = 0; k < rings * 2; k++) {
          const ring = document.createElement('span');
          ring.className = 'bell-ring';
          ring.style.animationDelay = `${k * 220}ms`;
          tab.append(ring);
          setTimeout(() => ring.remove(), 1800 + k * 220);
        }
      }
      swap(panel, () => fill(tab), 'rise');
    });
    document.addEventListener('lang:change', () => fill(current(group)));
  });

  /* ---------- Questions open and close smoothly ---------- */
  $$('.faq details').forEach(d => {
    const summary = $('summary', d);
    const body = $('.answer', d);
    summary.addEventListener('click', e => {
      if (reduced || !body.animate) return;
      e.preventDefault();
      if (d.open) {
        const h = body.offsetHeight;
        body.animate([{ height: `${h}px`, opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 380, easing: 'cubic-bezier(.65,0,.35,1)' }).finished.then(() => { d.open = false; });
      } else {
        d.open = true;
        const h = body.offsetHeight;
        body.animate([{ height: '0px', opacity: 0, transform: 'translateY(-6px)' }, { height: `${h}px`, opacity: 1, transform: 'none' }], { duration: 520, easing: 'cubic-bezier(.16,1,.3,1)' });
      }
    });
  });

  /* ---------- Copy the install command ---------- */
  $$('[data-copy]').forEach(button => {
    const label = $('[data-copy-label]', button);
    const reset = () => { label.textContent = ui('copy'); };
    reset();
    document.addEventListener('lang:change', reset);
    button.addEventListener('click', async () => {
      const text = $(button.dataset.copy).textContent.trim();
      try { await navigator.clipboard.writeText(text); label.textContent = ui('copied'); }
      catch (_) {
        const range = document.createRange(); range.selectNodeContents($(button.dataset.copy));
        getSelection().removeAllRanges(); getSelection().addRange(range); label.textContent = ui('selected');
      }
      setTimeout(reset, 1800);
    });
  });

  /* ---------- Continue reading (saved by the reader) ---------- */
  const saved = store.get('mira-reading-v3');
  const library = window.MIRA_LIBRARY || [];
  const savedWork = saved && library.find(w => w.id === saved.work);
  const savedChapter = savedWork && savedWork.chapters.find(c => c.id === saved.chapter);
  $$('[data-continue]').forEach(el => {
    if (!savedChapter || (saved.ratio < .02 && savedChapter === savedWork.chapters[0])) return;
    el.hidden = false;
    $$('a', el).concat(el.matches('a') ? [el] : []).forEach(a => { a.href = `read.html?work=${savedWork.id}&chapter=${savedChapter.id}&resume=1`; });
    const paint = () => {
      const zh = lang() === 'zh';
      $$('[data-continue-work]', el).forEach(n => { n.textContent = zh ? savedWork.short_zh : savedWork.title_en; });
      $$('[data-continue-chapter]', el).forEach(n => { n.textContent = zh ? `${savedChapter.label} · ${savedChapter.title}` : `${savedChapter.label_en} · ${savedChapter.title_en}`; });
    };
    paint();
    document.addEventListener('lang:change', paint);
    $$('[data-continue-progress]', el).forEach(n => n.style.setProperty('--p', saved.ratio));
  });

  /* ---------- The Rovelle chart: choosing a place pans the chart to it ---------- */
  const chartWrap = $('[data-chart]');
  if (chartWrap) {
    const detail = $('[data-place-detail]');
    const items = $$('[data-place-item]');
    let chosen = null;
    const fill = item => {
      detail.querySelector('h3').textContent = lang() === 'zh' ? item.dataset.cn : item.dataset.name;
      detail.querySelector('[data-place-alt]').textContent = lang() === 'zh' ? item.dataset.name : item.dataset.cn;
      detail.querySelector('p').textContent = t(item, 'body');
      const link = detail.querySelector('a');
      link.href = item.dataset.href; link.querySelector('span').textContent = t(item, 'where');
    };
    const focusOn = id => {
      const svg = $('svg', chartWrap);
      const mark = svg && $(`.place[data-place="${id}"] .place-mark`, svg);
      if (!mark || reduced) return;
      const b = mark.getBBox();
      const cx = (b.x + b.width / 2) / 1000;
      const cy = (b.y + b.height / 2) / 700;
      // Lean in a little toward the place, never so far that the rest of the city is lost.
      svg.style.setProperty('--zx', `${(.5 - cx) * 18}%`);
      svg.style.setProperty('--zy', `${(.5 - cy) * 18}%`);
      svg.classList.add('is-focused');
    };
    const choose = (id, scroll) => {
      const item = items.find(i => i.dataset.placeItem === id);
      if (!item) return;
      chosen = item;
      items.forEach(i => i.setAttribute('aria-pressed', String(i === item)));
      $$('.place', chartWrap).forEach(p => p.classList.toggle('is-active', p.dataset.place === id));
      focusOn(id);
      swap(detail, () => fill(item), 'rise');
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
    const paintChart = () => $$('text[data-cn]', chartWrap).forEach(label => {
      if (label.dataset.en === undefined) label.dataset.en = label.textContent;
      label.textContent = lang() === 'zh' ? label.dataset.cn : label.dataset.en;
    });
    document.addEventListener('lang:change', paintChart);
    chartWrap.addEventListener('svg:ready', () => {
      paintChart();
      $$('.place', chartWrap).forEach((p, i) => {
        p.style.setProperty('--i', i);
        p.addEventListener('click', () => choose(p.dataset.place, true));
        p.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(p.dataset.place, true); } });
        p.addEventListener('mouseenter', () => hover(p.dataset.place, true));
        p.addEventListener('mouseleave', () => hover(p.dataset.place, false));
      });
      chartWrap.classList.add('is-ready');
      chosen = items[0];
      items[0].setAttribute('aria-pressed', 'true');
      $$('.place', chartWrap).forEach(p => p.classList.toggle('is-active', p.dataset.place === items[0].dataset.placeItem));
      fill(items[0]);
    });
    document.addEventListener('lang:change', () => { if (chosen) fill(chosen); });
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
    const draw = time => {
      const at = (time / 16000 % 1) * length;
      const p = path.getPointAtLength(at);
      pen.setAttribute('cx', p.x); pen.setAttribute('cy', p.y);
      const pts = [];
      for (let k = 0; k < 40; k++) { const q = path.getPointAtLength((at - k * 6 + length) % length); pts.push(`${q.x.toFixed(1)} ${q.y.toFixed(1)}`); }
      trail.setAttribute('d', `M${pts.join(' L')}`);
      // The loop turns a little as the page passes it.
      const r = el.getBoundingClientRect();
      svg.style.transform = `rotate(${((r.top + r.height / 2 - innerHeight / 2) / innerHeight * -8).toFixed(2)}deg)`;
    };
    if (reduced) { draw(4000); return; }
    const frame = time => { if (visible) draw(time); requestAnimationFrame(frame); };
    requestAnimationFrame(frame);
  }));

  /* ---------- Universe sub-bar: a crumb, a track of the page's sections, back to top ---------- */
  const sections = $$('main > section[data-nav]');
  if (document.body.dataset.subbar && sections.length > 1) {
    const sub = document.createElement('div');
    sub.className = 'subbar';
    sub.innerHTML = '<a class="subbar-crumb" href="index.html"><img src="assets/mira-logo-cutout.webp" alt="" /><span></span></a>'
      + '<a class="subbar-top" href="#main"><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M6 10V2M2.5 5.5L6 2l3.5 3.5" fill="none" stroke="currentColor" stroke-width="1.4"/></svg></a>'
      + '<div class="subbar-track"><span class="subbar-fill"></span></div>';
    const track = $('.subbar-track', sub);
    const fill = $('.subbar-fill', sub);
    const dots = sections.map(section => {
      const a = document.createElement('a');
      a.className = 'subbar-dot';
      a.href = `#${section.id || (section.id = `s-${Math.random().toString(36).slice(2, 7)}`)}`;
      a.innerHTML = '<span></span>';
      track.append(a);
      return a;
    });
    const label = () => {
      $('.subbar-crumb span', sub).textContent = t(document.body, 'subbar');
      $('.subbar-top', sub).setAttribute('aria-label', ui('top'));
      dots.forEach((a, i) => { const name = t(sections[i], 'nav'); a.firstChild.textContent = name; a.setAttribute('aria-label', name); });
    };
    label();
    document.addEventListener('lang:change', label);
    $('.subbar-top', sub).addEventListener('click', e => { e.preventDefault(); scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }); });
    document.body.append(sub);
    let queued = false;
    const place = () => {
      queued = false;
      const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      dots.forEach((d, i) => { d.style.left = `${4 + Math.min(1, sections[i].offsetTop / max) * 92}%`; });
      fill.style.transform = `scaleX(${(4 + Math.min(1, scrollY / max) * 92) / 100})`;
      let now = -1;
      sections.forEach((sec, i) => { if (sec.getBoundingClientRect().top < innerHeight * .45) now = i; });
      dots.forEach((d, i) => { d.classList.toggle('is-past', i < now); d.classList.toggle('is-current', i === now); });
      sub.classList.toggle('is-shown', scrollY > (masthead ? masthead.offsetHeight - 120 : 200));
    };
    const queue = () => { if (!queued) { queued = true; requestAnimationFrame(place); setTimeout(() => { if (queued) place(); }, 120); } };
    addEventListener('scroll', queue, { passive: true });
    addEventListener('resize', queue, { passive: true });
    addEventListener('load', queue);
    place();
  }

})();
