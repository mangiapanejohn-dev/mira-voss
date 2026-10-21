/* Mira Voss — the story reader: one chapter per page, progress remembered. */
(() => {
  'use strict';
  const library = window.MIRA_LIBRARY || [];
  if (!library.length) return;
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = window.MiraSite.store;
  const $ = s => document.querySelector(s);
  const params = new URLSearchParams(location.search);
  const saved = store.get('mira-reading-v3');
  const url = (w, c) => `read.html?work=${w}&chapter=${c}`;
  const HERO = {
    'unfinished-chart': { src: 'assets/art/rovelle-harbor.webp', focus: '42% 62%' },
    'only-one-side': { src: 'assets/art/mobius-loop.svg', art: 'mobius' },
    'character-profile': { src: 'assets/art/mira-portrait.webp', focus: '50% 30%' },
  };

  let work = library.find(w => w.id === params.get('work'));
  let chapterId = params.get('chapter');
  if (!work) {
    work = (saved && library.find(w => w.id === saved.work)) || library[0];
    if (!chapterId && saved && saved.work === work.id) chapterId = saved.chapter;
  }
  const chapters = work.chapters;
  const chapter = chapters.find(c => c.id === chapterId) || chapters[0];
  const nextWork = library[library.indexOf(work) + 1];

  /* ---------- Opening ---------- */
  if (work.theme) root.dataset.theme = work.theme;
  if (work.bg) document.querySelector('.reader-atmos').style.setProperty('--reader-bg', `url(${work.bg})`);
  document.title = `${chapter.title} · ${work.short_zh} · Mira Voss`;
  $('[data-bar-work]').textContent = work.short_zh;
  $('[data-bar-chapter]').textContent = chapter.kind === 'appendix' ? chapter.label : `${chapter.label} · ${chapter.title}`;
  const hero = $('[data-hero]');
  const art = HERO[chapter.id] || HERO[work.id] || { src: work.cover };
  const heroImg = $('[data-hero-img]');
  if (art.art) hero.dataset.art = art.art;
  if (work.light === 'beam') {
    const beam = document.createElement('div');
    beam.className = 'beam';
    beam.style.cssText = '--beam-x: 50%; --beam-y: 6%';
    beam.setAttribute('aria-hidden', 'true');
    hero.prepend(beam);
  }
  if (art.focus) hero.style.setProperty('--focus', art.focus);
  heroImg.src = art.src;
  $('[data-series]').textContent = `${work.series} · ${work.title_en}`;
  $('[data-label]').textContent = chapter.label;
  $('[data-label-en]').textContent = chapter.label_en;
  $('[data-title]').textContent = chapter.title;
  $('[data-title-en]').textContent = chapter.title_en;
  $('[data-minutes]').textContent = `约 ${chapter.minutes} 分钟`;
  $('[data-version]').textContent = `${work.version} · ${work.date}`;
  const showHero = () => requestAnimationFrame(() => hero.classList.add('is-ready'));
  (heroImg.decode ? heroImg.decode() : Promise.resolve()).catch(() => {}).then(() => setTimeout(showHero, root.classList.contains('tide-out') ? 240 : 0));

  /* ---------- Contents ---------- */
  const contents = $('[data-contents]');
  library.forEach(w => {
    const block = document.createElement('section');
    block.className = 'toc-work';
    block.innerHTML = `<h2></h2><span class="zh" lang="zh-Hans"></span><ol></ol>`;
    block.querySelector('h2').textContent = w.title_en;
    block.querySelector('.zh').textContent = w.title_zh;
    w.chapters.forEach(c => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = url(w.id, c.id);
      a.innerHTML = '<span class="n"></span><span class="t"></span><span class="m"></span>';
      a.querySelector('.n').textContent = c.label_en;
      a.querySelector('.t').textContent = c.kind === 'appendix' ? `${c.label}（含剧透）` : c.title;
      a.querySelector('.m').textContent = `${c.minutes} min`;
      if (w === work && c === chapter) a.setAttribute('aria-current', 'page');
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

  /* ---------- Type size ---------- */
  const sizes = [...document.querySelectorAll('.size-switch button')];
  const setSize = size => {
    root.dataset.size = size;
    sizes.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.size === size)));
    store.set('mira-reader-size', size);
  };
  sizes.forEach(b => b.addEventListener('click', () => setSize(b.dataset.size)));
  sizes.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.size === (root.dataset.size || 'm'))));

  /* ---------- After the chapter ---------- */
  // The next card follows the story; appendices (the spoiler profile) are offered below it instead.
  const story = chapters.filter(c => c.kind === 'chapter');
  const next = chapter.kind === 'chapter' ? story[story.indexOf(chapter) + 1] : null;
  const nextLink = $('[data-next]');
  if (next || (nextWork && (chapter.kind === 'appendix' || chapter === story[story.length - 1]))) {
    nextLink.hidden = false;
    if (next) {
      nextLink.href = url(work.id, next.id);
      $('[data-next-label]').textContent = `下一${work.kind === 'Short story' ? '节' : '章'} · ${next.label}`;
      $('[data-next-title]').textContent = next.title;
      $('[data-next-en]').textContent = next.title_en;
    } else {
      nextLink.href = url(nextWork.id, nextWork.chapters[0].id);
      $('[data-next-label]').textContent = `下一个故事 · ${nextWork.series}`;
      $('[data-next-title]').textContent = nextWork.title_zh;
      $('[data-next-en]').textContent = nextWork.title_en;
    }
  }
  const appendix = chapters.find(c => c.kind === 'appendix' && c !== chapter);
  if (appendix && chapter === story[story.length - 1]) {
    const a = document.createElement('a');
    a.className = 'text-link';
    a.href = url(work.id, appendix.id);
    a.textContent = `${appendix.label}（含完整剧透）`;
    $('.end-links').insertBefore(a, $('[data-source]'));
  }
  const prev = chapter.kind === 'chapter' ? story[story.indexOf(chapter) - 1] : story[story.length - 1];
  if (prev) {
    const prevLink = $('[data-prev]');
    prevLink.hidden = false;
    prevLink.href = url(work.id, prev.id);
    $('[data-prev-title]').textContent = `${prev.label} · ${prev.title}`;
  }
  $('[data-source]').href = `https://github.com/mangiapanejohn-dev/mira-voss/blob/main/${chapter.source}`;
  addEventListener('keydown', e => {
    if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey || /input|textarea|select/i.test(e.target.tagName)) return;
    if (e.key === 'Escape' && root.classList.contains('contents-open')) { setDrawer(false); toggle.focus(); }
    const target = e.key === 'ArrowRight' ? nextLink : e.key === 'ArrowLeft' ? $('[data-prev]') : null;
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
  const render = () => {
    const html = (window.MIRA_TEXT || {})[work.id]?.[chapter.id];
    if (!html) { prose.innerHTML = '<p>这一章暂时无法载入。请刷新页面，或在 GitHub 上阅读原文。</p>'; return; }
    prose.innerHTML = html;
    const blocks = [...prose.children];
    // A drop cap suits a Chinese character, not the M of a Latin name.
    if (!/^[\u3400-\u9fff]/.test(prose.textContent.trim())) prose.classList.add('no-drop');
    if (reduced || !('IntersectionObserver' in window)) blocks.forEach(b => b.classList.add('is-in'));
    else {
      const io = new IntersectionObserver(entries => entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } }), { rootMargin: '0px 0px -6% 0px' });
      blocks.forEach(b => io.observe(b));
    }
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
  const script = document.createElement('script');
  script.src = `data/text/${work.id}.js`;
  script.onload = render;
  script.onerror = render;
  document.head.append(script);
})();
