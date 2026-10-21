#!/usr/bin/env node
// Builds the website's story library from lore/catalog.json and the Markdown texts.
//   site/data/library.js      every work and chapter, without the texts
//   site/data/text/<id>.js    one work's chapters as HTML, loaded by the reader
// Run from the repository root: node scripts/build-stories.mjs
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join, posix } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const catalog = JSON.parse(readFileSync(join(root, 'lore/catalog.json'), 'utf8'));
const outDir = join(root, 'site/data');
rmSync(join(outDir, 'text'), { recursive: true, force: true });
mkdirSync(join(outDir, 'text'), { recursive: true });

// Where each source file is read on the site, so links between chapters stay inside the reader.
const readerLinks = new Map();
for (const work of catalog.works) {
  for (const ch of [...work.chapters, ...(work.appendix || [])]) {
    readerLinks.set(posix.join(work.source_dir, ch.file), `read.html?work=${work.id}&chapter=${ch.id}`);
  }
  readerLinks.set(posix.join(work.source_dir, 'README.md'), `stories.html#${work.id}`);
}

const escapeHTML = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function inline(text, dir) {
  let s = escapeHTML(text);
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*])\*([^*\s][^*]*?)\*/g, '$1<em>$2</em>');
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => {
    if (/^https?:/.test(href)) return `<a href="${href}">${label}</a>`;
    const target = readerLinks.get(posix.normalize(posix.join(dir, href.split('#')[0])));
    return target ? `<a href="${target}">${label}</a>` : label;
  });
  return s;
}

// The texts use a small part of Markdown: headings, paragraphs, quotes, lists, rules and emphasis.
function toHTML(markdown, dir, { chapter }) {
  let lines = markdown.replace(/\r\n/g, '\n').split('\n');
  if (chapter) {
    // Page furniture: the book title, the version line and the chapter heading are drawn by the reader.
    const heading = lines.findIndex(l => l.startsWith('## '));
    lines = lines.slice(heading + 1);
  } else {
    lines = lines.filter((l, i) => !(i === 0 && l.startsWith('# ')));
  }
  // Navigation lines at the end of each file belong to GitHub, not to the reader.
  lines = lines.filter(l => !/^\[(返回目录|上一节|下一节|上一章|下一章)\]/.test(l.trim()));
  while (lines.length && /^(---|\s*)$/.test(lines[lines.length - 1])) lines.pop();

  const blocks = [];
  let buffer = [];
  const flush = () => { if (buffer.length) blocks.push(buffer); buffer = []; };
  for (const line of lines) (line.trim() === '' ? flush() : buffer.push(line));
  flush();

  return blocks.map(block => {
    const first = block[0];
    if (/^---+$/.test(first.trim())) return '<hr />';
    const h = first.match(/^(#{2,4})\s+(.*)$/);
    if (h) return `<h${h[1].length}>${inline(h[2], dir)}</h${h[1].length}>`;
    if (first.startsWith('>')) {
      const body = block.map(l => l.replace(/^>\s?/, '')).join('\n').split(/\n\s*\n/);
      return `<blockquote>${body.map(p => `<p>${p.split('\n').map(l => inline(l, dir)).join('<br />')}</p>`).join('')}</blockquote>`;
    }
    if (/^[-*]\s/.test(first)) return `<ul>${block.map(l => `<li>${inline(l.replace(/^[-*]\s+/, ''), dir)}</li>`).join('')}</ul>`;
    if (/^\*\*[^*]*完\*\*$/.test(first.trim())) return `<p class="end-mark">${inline(first.trim(), dir).replace(/<\/?strong>/g, '')}</p>`;
    return `<p>${block.map(l => inline(l.trim(), dir)).join('<br />')}</p>`;
  }).join('\n');
}

const cjk = s => (s.match(/[㐀-鿿]/g) || []).length;
const plain = html => html.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

const library = [];
for (const work of catalog.works) {
  const texts = {};
  const entries = [];
  for (const [kind, list] of [['chapter', work.chapters], ['appendix', work.appendix || []]]) {
    for (const ch of list) {
      const path = posix.join(work.source_dir, ch.file);
      const source = readFileSync(join(root, path), 'utf8');
      const html = toHTML(source, work.source_dir, { chapter: kind === 'chapter' });
      // Every Chinese character of the body must reach the page: nothing dropped by the converter.
      const body = kind === 'chapter' ? source.slice(source.indexOf('\n', source.indexOf('## ')) + 1) : source.slice(source.indexOf('\n') + 1);
      const expected = cjk(body.replace(/^\[(返回目录|上一节|下一节|上一章|下一章)\].*$/gm, ''));
      const got = cjk(plain(html));
      if (expected !== got) throw new Error(`${path}: ${expected} Chinese characters in the source, ${got} on the page`);
      const chars = got;
      texts[ch.id] = html;
      entries.push({ ...ch, kind, chars, minutes: Math.max(1, Math.round(chars / 450)), source: path, sha256: createHash('sha256').update(source).digest('hex') });
    }
  }
  const { chapters, appendix, source_dir, ...meta } = work;
  const chapterList = entries.filter(e => e.kind === 'chapter');
  library.push({ ...meta, chars: chapterList.reduce((n, e) => n + e.chars, 0), minutes: chapterList.reduce((n, e) => n + e.minutes, 0), chapters: entries });
  writeFileSync(join(outDir, 'text', `${work.id}.js`), `/* Generated by scripts/build-stories.mjs from ${source_dir}. Do not edit. */\n(window.MIRA_TEXT = window.MIRA_TEXT || {})[${JSON.stringify(work.id)}] = ${JSON.stringify(texts, null, 1)};\n`);
  console.log(`${work.id}: ${entries.length} parts, ${library.at(-1).chars} characters`);
}
writeFileSync(join(outDir, 'library.js'), `/* Generated by scripts/build-stories.mjs from lore/catalog.json. Do not edit. */\nwindow.MIRA_LIBRARY = ${JSON.stringify(library, null, 1)};\n`);

// ---------- Pages: the library, the reading order and the home page's newest story ----------
const attr = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const read = (work, chapter) => `read.html?work=${work}${chapter ? `&amp;chapter=${chapter}` : ''}`;
const partsLabel = work => {
  const chapters = work.chapters.filter(c => c.kind === 'chapter');
  const prologue = chapters.some(c => c.label_en === 'Prologue');
  return prologue ? `Prologue + ${chapters.length - 1} chapters` : `${chapters.length} parts`;
};
const arrow = '<svg aria-hidden="true"><use href="#i-arrow" /></svg>';

const libraryHTML = library.map(work => `
        <article class="work reveal" id="${work.id}" style="--work-bg: url(${work.bg})">
          <a class="work-cover frame" href="${read(work.id)}" tabindex="-1" aria-hidden="true"><span class="frame-inner halftone"${work.cover_bg ? ` style="background: url(${work.cover_bg}) center / cover"` : ''}><img src="${work.cover}" alt="" loading="lazy" /></span></a>
          <div class="work-body">
            <ul class="work-meta"><li>${attr(work.series)}</li><li>${attr(partsLabel(work))}</li><li>${work.minutes} min</li><li>${attr(work.version)} · ${work.date}</li></ul>
            <h2 class="work-title">${attr(work.title_en)}</h2>
            <p class="zh-title" lang="zh-Hans">${attr(work.title_zh)}</p>
            <p class="lede">${attr(work.summary_en)}</p>
            <ol class="chapters">${work.chapters.map(c => `
              <li${c.kind === 'appendix' ? ' class="is-appendix"' : ''}><a href="${read(work.id, c.id)}"><span class="ch-label">${attr(c.label_en)}</span><span class="ch-name"><span lang="zh-Hans">${attr(c.title)}</span><span class="ch-en">${attr(c.title_en)}</span></span><span class="ch-time">${c.minutes} min</span><svg class="ch-go" aria-hidden="true"><use href="#i-arrow" /></svg></a></li>`).join('')}
            </ol>
            <div class="btn-row"><a class="btn btn-gold" href="${read(work.id)}">Start reading ${arrow}</a></div>
          </div>
        </article>`).join('');

const orderHTML = `
        <ol class="reading-order reveal">${library.map(work => `
          <li><h3>${attr(work.title_en)}</h3><p>${attr(work.setting)}</p></li>`).join('')}
          <li class="is-open"><h3>${attr(catalog.unwritten.title_en)}</h3><p>${attr(catalog.unwritten.text_en)}</p></li>
        </ol>`;

const latest = [...library].reverse().reduce((best, w) => (!best || w.date > best.date ? w : best), null);
const latestHTML = `
    <section class="blade blade-dark feature" id="latest" aria-labelledby="feature-title">
      <div class="atmos" style="--atmos-img: url(${latest.bg}); --atmos-op: .8" aria-hidden="true"></div>${latest.light === 'beam' ? `
      <div class="beam" style="--beam-x: 6%; --beam-y: 12%" aria-hidden="true"></div>` : ''}
      <div class="blade-inner feature-grid">
        <a class="feature-cover frame" href="${read(latest.id)}" tabindex="-1" aria-hidden="true"><span class="frame-inner halftone"${latest.cover_bg ? ` style="background: url(${latest.cover_bg}) center / cover"` : ''}><img src="${latest.cover}" alt="" loading="lazy" /></span></a>
        <div class="feature-copy" data-stagger>
          <p class="supertitle reveal">Newest story · ${attr(latest.series)}</p>
          <h2 class="blade-title misreg" id="feature-title" data-text="${attr(latest.title_en)}">${attr(latest.title_en)}</h2>
          <p class="zh-title reveal" lang="zh-Hans">${attr(latest.title_zh)}</p>
          <p class="lede reveal">${attr(latest.summary_en)}</p>
          <blockquote class="pull-quote reveal"><p lang="zh-Hans">${attr(latest.quote_zh)}</p><footer>${attr(latest.quote_en)}</footer></blockquote>
          <div class="btn-row reveal">
            <a class="btn btn-gold" href="${read(latest.id)}">Read · ${latest.minutes} min ${arrow}</a>
            <a class="btn" href="stories.html">All stories</a>
          </div>
        </div>
      </div>
    </section>
    `;

function inject(file, marker, html) {
  const path = join(root, 'site', file);
  const page = readFileSync(path, 'utf8');
  const re = new RegExp(`(<!-- ${marker}:start -->)[\\s\\S]*?(\\s*<!-- ${marker}:end -->)`);
  if (!re.test(page)) throw new Error(`${file}: no ${marker} markers`);
  writeFileSync(path, page.replace(re, `$1${html}$2`));
}
inject('stories.html', 'library', libraryHTML);
inject('stories.html', 'order', orderHTML);
inject('index.html', 'latest', latestHTML);
console.log(`pages: stories.html, index.html (newest: ${latest.id})`);
