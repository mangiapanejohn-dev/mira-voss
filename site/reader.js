/* Mira Voss — the story reader: one chapter per page, progress remembered.
   The interface and the text follow the site's language. A chapter not yet translated
   is shown in the Chinese original, and says so. */
(() => {
  'use strict';
  const library = window.MIRA_LIBRARY || [];
  if (!library.length) return;
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const { store, lang } = window.MiraSite;
  const $ = s => document.querySelector(s);
  const params = new URLSearchParams(location.search);
  const saved = store.get('mira-reading-v3');
  const url = (w, c) => `read.html?work=${w}&chapter=${c}`;
  const HERO = {
    'unfinished-chart': { src: 'assets/art/rovelle-harbor.webp', focus: '42% 62%' },
    'only-one-side': { src: 'assets/art/mobius-loop.svg', art: 'mobius' },
    'character-profile': { src: 'assets/art/mira-portrait.webp', focus: '50% 30%' },
  };
  const T = {
    en: {
      minutes: n => `About ${n} min`, min: n => `${n} min`,
      next: kind => (kind === 'Short story' ? 'Next part' : 'Next chapter'), nextStory: 'Next story',
      spoilers: c => c.title_en, original: 'Not yet translated · this is the Chinese original',
      failed: 'This chapter could not be loaded. Reload the page, or read the original on GitHub.',
    },
    zh: {
      minutes: n => `约 ${n} 分钟`, min: n => `${n} 分钟`,
      next: kind => (kind === 'Short story' ? '下一节' : '下一章'), nextStory: '下一个故事',
      spoilers: c => `${c.label}（含完整剧透）`, original: '',
      failed: '这一章暂时无法载入。请刷新页面，或在 GitHub 上阅读原文。',
    },
  };
  const tr = () => T[lang()];

  let work = library.find(w => w.id === params.get('work'));
  let chapterId = params.get('chapter');
  if (!work) {
    work = (saved && library.find(w => w.id === saved.work)) || library[0];
    if (!chapterId && saved && saved.work === work.id) chapterId = saved.chapter;
  }
  const chapters = work.chapters;
  const chapter = chapters.find(c => c.id === chapterId) || chapters[0];
  const story = chapters.filter(c => c.kind === 'chapter');
  const next = chapter.kind === 'chapter' ? story[story.indexOf(chapter) + 1] : null;
  const nextWork = library[library.indexOf(work) + 1];
  const showNextWork = !next && nextWork && (chapter.kind === 'appendix' || chapter === story[story.length - 1]);
  const prev = chapter.kind === 'chapter' ? story[story.indexOf(chapter) - 1] : story[story.length - 1];
  const appendix = chapters.find(c => c.kind === 'appendix' && c !== chapter);
  const label = c => (lang() === 'zh' ? c.label : c.label_en);
  const title = c => (lang() === 'zh' ? c.title : c.title_en);
  const minutes = c => (lang() === 'zh' ? c.minutes : c.minutes_en ?? c.minutes);
  const english = () => (window.MIRA_TEXT_EN || {})[work.id]?.[chapter.id];
  // The text shown: the translation on the English page, when this chapter has one.
  const showsEnglish = () => lang() === 'en' && !!english();
  let loaded = false;

  /* ---------- Opening ---------- */
  if (work.theme) root.dataset.theme = work.theme;
  if (work.bg) $('.reader-atmos').style.setProperty('--reader-bg', `url(${work.bg})`);
  const hero = $('[data-hero]');
  const art = HERO[chapter.id] || HERO[work.id] || { src: work.cover };
  const heroImg = $('[data-hero-img]');
  if (art.art) hero.dataset.art = art.art;
  if (art.focus) hero.style.setProperty('--focus', art.focus);
  heroImg.src = art.src;
  $('[data-version]').textContent = `${work.version} · ${work.date}`;
  const showHero = () => { requestAnimationFrame(() => hero.classList.add('is-ready')); setTimeout(() => hero.classList.add('is-ready'), 120); };
  (heroImg.decode ? heroImg.decode() : Promise.resolve()).catch(() => {}).then(() => setTimeout(showHero, root.classList.contains('tide-out') ? 240 : 0));

  /* ---------- Contents drawer ---------- */
  const contents = $('[data-contents]');
  const tocLinks = [];
  library.forEach(w => {
    const block = document.createElement('section');
    block.className = 'toc-work';
    block.innerHTML = '<h2></h2><span class="zh"></span><ol></ol>';
    block.dataset.work = w.id;
    w.chapters.forEach(c => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = url(w.id, c.id);
      a.innerHTML = '<span class="n"></span><span class="t"></span><span class="m"></span>';
      if (w === work && c === chapter) a.setAttribute('aria-current', 'page');
      tocLinks.push({ a, c });
      li.append(a);
      block.querySelector('ol').append(li);
    });
    contents.append(block);
  });
  const drawer = $('#contents');
  const toggle = $('.contents-toggle');
  const setDrawer = open => {
    root.classList.toggle('contents-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    drawer.toggleAttribute('inert', !open);
    if (open) (drawer.querySelector('[aria-current]') || drawer.querySelector('a')).focus({ preventScroll: false });
  };
  toggle.addEventListener('click', () => setDrawer(!root.classList.contains('contents-open')));
  $('[data-close-contents]').addEventListener('click', () => setDrawer(false));

  /* ---------- Type size and light reading ---------- */
  const sizes = [...document.querySelectorAll('.size-switch button')];
  const setSize = size => {
    root.dataset.size = size;
    sizes.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.size === size)));
    store.set('mira-reader-size', size);
  };
  sizes.forEach(b => b.addEventListener('click', () => setSize(b.dataset.size)));
  sizes.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.size === (root.dataset.size || 'm'))));
  const light = $('.light-toggle');
  light.setAttribute('aria-pressed', String(root.dataset.reading === 'light'));
  light.addEventListener('click', () => {
    const on = root.dataset.reading !== 'light';
    if (on) root.dataset.reading = 'light'; else delete root.dataset.reading;
    light.setAttribute('aria-pressed', String(on));
    store.set('mira-reader-light', on);
  });

  /* ---------- After the chapter ---------- */
  const nextLink = $('[data-next]');
  const prevLink = $('[data-prev]');
  if (next) nextLink.href = url(work.id, next.id);
  else if (showNextWork) nextLink.href = url(nextWork.id, nextWork.chapters[0].id);
  nextLink.hidden = !(next || showNextWork);
  if (prev) { prevLink.hidden = false; prevLink.href = url(work.id, prev.id); }
  let appendixLink = null;
  if (appendix && chapter === story[story.length - 1]) {
    appendixLink = document.createElement('a');
    appendixLink.className = 'text-link';
    appendixLink.href = url(work.id, appendix.id);
    $('.end-links').insertBefore(appendixLink, $('[data-source]'));
  }

  /* ---------- Every piece of interface text, in the current language ---------- */
  const paintContents = () => {
    const zh = lang() === 'zh';
    contents.querySelectorAll('.toc-work').forEach(block => {
      const w = library.find(x => x.id === block.dataset.work);
      block.querySelector('h2').textContent = zh ? w.title_zh : w.title_en;
      block.querySelector('.zh').textContent = zh ? w.title_en : '';
      block.querySelector('.zh').hidden = !zh;
    });
    tocLinks.forEach(({ a, c }) => {
      a.querySelector('.n').textContent = label(c);
      a.querySelector('.t').textContent = c.kind === 'appendix' ? tr().spoilers(c) : title(c);
      a.querySelector('.t').lang = zh ? 'zh-Hans' : 'en';
      a.querySelector('.m').textContent = tr().min(minutes(c));
    });
  };
  const paint = () => {
    const zh = lang() === 'zh';
    document.title = zh ? `${chapter.title} · ${work.short_zh} · Mira Voss` : `${chapter.title_en} · ${work.title_en} · Mira Voss`;
    $('[data-bar-work]').textContent = zh ? work.short_zh : work.title_en;
    $('[data-bar-chapter]').textContent = chapter.kind === 'appendix' ? label(chapter) : `${label(chapter)} · ${title(chapter)}`;
    $('[data-series]').textContent = zh ? `${work.series_zh} · ${work.title_zh}` : `${work.series} · ${work.title_en}`;
    $('[data-label]').textContent = label(chapter);
    $('[data-label-en]').textContent = zh ? chapter.label_en : '';
    $('[data-label-en]').hidden = !zh;
    const h1 = $('[data-title]');
    h1.textContent = title(chapter);
    h1.lang = zh ? 'zh-Hans' : 'en';
    $('[data-title-en]').textContent = zh ? chapter.title_en : '';
    $('[data-title-en]').hidden = !zh;
    $('[data-minutes]').textContent = tr().minutes(minutes(chapter));
    $('[data-hero-note]').textContent = tr().original;
    $('[data-hero-note]').hidden = zh || !loaded || !!english();
    $('[data-source]').href = `https://github.com/mangiapanejohn-dev/mira-voss/blob/main/${showsEnglish() ? chapter.source_en : chapter.source}`;
    paintContents();
    if (next) {
      $('[data-next-label]').textContent = `${tr().next(work.kind)} · ${label(next)}`;
      $('[data-next-title]').textContent = title(next);
      $('[data-next-en]').textContent = zh ? next.title_en : '';
    } else if (showNextWork) {
      $('[data-next-label]').textContent = `${tr().nextStory} · ${zh ? nextWork.series_zh : nextWork.series}`;
      $('[data-next-title]').textContent = zh ? nextWork.title_zh : nextWork.title_en;
      $('[data-next-en]').textContent = zh ? nextWork.title_en : '';
    }
    $('[data-next-en]').hidden = !zh;
    if (prev) $('[data-prev-title]').textContent = `${label(prev)} · ${title(prev)}`;
    if (appendixLink) appendixLink.textContent = tr().spoilers(appendix);
  };
  paint();
  document.addEventListener('lang:change', paint);

  addEventListener('keydown', e => {
    if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey || /input|textarea|select/i.test(e.target.tagName)) return;
    if (e.key === 'Escape' && root.classList.contains('contents-open')) { setDrawer(false); toggle.focus(); }
    const target = e.key === 'ArrowRight' ? nextLink : e.key === 'ArrowLeft' ? prevLink : null;
    if (target && !target.hidden) target.click();
  });

  /* ---------- The text ---------- */
  const prose = $('[data-prose]');
  const progress = $('.reading-progress span');
  const bounds = () => {
    const top = prose.getBoundingClientRect().top + scrollY;
    return { top, distance: Math.max(1, prose.offsetHeight - innerHeight * .6) };
  };
  const ratio = () => { const b = bounds(); return Math.min(1, Math.max(0, (scrollY + innerHeight * .25 - b.top) / b.distance)); };
  let frame = 0;
  let saveTimer = 0;
  let restoring = false;
  const onScroll = () => {
    frame = 0;
    const r = ratio();
    progress.style.transform = `scaleX(${r})`;
    document.body.classList.toggle('is-reading', scrollY > hero.offsetHeight - 80);
    if (restoring) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => store.set('mira-reading-v3', { work: work.id, chapter: chapter.id, ratio: r, at: Date.now() }), 300);
  };
  const io = 'IntersectionObserver' in window && !reduced
    ? new IntersectionObserver(entries => entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } }), { rootMargin: '0px 0px -6% 0px' })
    : null;
  // Fills the page with the chapter in the current language; arrive: false shows every block at once.
  const fill = (arrive = true) => {
    const html = showsEnglish() ? english() : (window.MIRA_TEXT || {})[work.id]?.[chapter.id];
    if (!html) { prose.textContent = tr().failed; return []; }
    prose.innerHTML = html;
    prose.lang = showsEnglish() ? 'en' : 'zh-Hans';
    const blocks = [...prose.children];
    // A drop cap suits a Chinese character or a Latin capital, not the M of a Latin name in a Chinese text.
    const first = prose.textContent.trim()[0] || '';
    prose.classList.toggle('no-drop', prose.lang === 'en' ? !/[A-Z]/.test(first) : !/[㐀-鿿]/.test(first));
    if (!io || !arrive) blocks.forEach(b => b.classList.add('is-in'));
    else blocks.forEach(b => io.observe(b));
    return blocks;
  };
  const render = () => {
    const blocks = fill();
    if (!blocks.length) return;
    // Switching language keeps the reader at the same point of the chapter.
    document.addEventListener('lang:change', () => {
      const at = ratio();
      fill(false);
      const b = bounds();
      scrollTo({ top: Math.max(0, b.top + b.distance * at - innerHeight * .25), behavior: 'instant' });
      onScroll();
    });
    addEventListener('scroll', () => { if (!frame) frame = requestAnimationFrame(onScroll); }, { passive: true });
    addEventListener('resize', () => { if (!frame) frame = requestAnimationFrame(onScroll); }, { passive: true });
    if (params.has('resume') && saved && saved.work === work.id && saved.chapter === chapter.id && saved.ratio > 0) {
      restoring = true;
      (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
        blocks.forEach(b => b.classList.add('is-in'));
        const b = bounds();
        scrollTo({ top: Math.max(0, b.top + b.distance * saved.ratio - innerHeight * .25), behavior: 'instant' });
        restoring = false;
        onScroll();
      });
    } else onScroll();
  };
  const load = src => new Promise(done => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = script.onerror = done;
    document.head.append(script);
  });
  const translated = work.chapters.some(c => c.source_en);
  Promise.all([load(`data/text/${work.id}.js`), translated ? load(`data/text/${work.id}.en.js`) : null]).then(() => { loaded = true; paint(); render(); });
})();
