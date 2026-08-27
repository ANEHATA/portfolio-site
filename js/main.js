/* ========================================
   グローバル状態
   ======================================== */
var worksData = [];

/* ========================================
   初期化
   ======================================== */
document.addEventListener('DOMContentLoaded', async () => {
  initHamburgerMenu();
  initScrollAnimation();

  if (document.getElementById('worksFlow')) {
    await loadWorks();
    initHeroSlideshow();
    renderWorks('all');
    initFilter();
  }

  if (document.getElementById('workDetailContent')) {
    await loadWorks();
    renderWorkDetail();
  }
});

/* ========================================
   ハンバーガーメニュー
   ======================================== */
function initHamburgerMenu() {
  const btn = document.getElementById('hamburgerBtn');
  const nav = document.getElementById('globalNav');
  if (!btn || !nav) return;

  btn.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('header__nav--open');
    btn.classList.toggle('header__hamburger--open');
    btn.setAttribute('aria-expanded', isOpen);
    btn.setAttribute('aria-label', isOpen ? 'メニューを閉じる' : 'メニューを開く');
  });
}

/* ========================================
   ヒーロー背景スライドショー
   ======================================== */
function initHeroSlideshow() {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  const images = worksData
    .filter(w => w.thumbnail)
    .map(w => w.thumbnail);
  if (images.length === 0) return;

  const bgContainer = document.createElement('div');
  bgContainer.className = 'hero__bg';

  const imgA = document.createElement('img');
  const imgB = document.createElement('img');
  imgA.className = 'hero__bg-img hero__bg-img--active';
  imgB.className = 'hero__bg-img';
  imgA.alt = '';
  imgB.alt = '';
  imgA.src = images[0];

  bgContainer.appendChild(imgA);
  bgContainer.appendChild(imgB);
  hero.insertBefore(bgContainer, hero.firstChild);

  let current = 0;
  let useA = true;

  setInterval(() => {
    current = (current + 1) % images.length;
    if (useA) {
      imgB.src = images[current];
      imgB.classList.add('hero__bg-img--active');
      imgA.classList.remove('hero__bg-img--active');
    } else {
      imgA.src = images[current];
      imgA.classList.add('hero__bg-img--active');
      imgB.classList.remove('hero__bg-img--active');
    }
    useA = !useA;
  }, 5000);
}

/* ========================================
   作品データ読み込み
   ======================================== */
async function loadWorks() {
  const res = await fetch('data/works.json');
  worksData = await res.json();
}

/* ========================================
   エディトリアルレイアウトの定義
   ======================================== */
const layoutPattern = [
  { type: 'full', count: 1 },
  { type: 'right', count: 2 },
  { type: 'left', count: 1 },
  { type: 'full', count: 1 },
  { type: 'pair', count: 2 },
  { type: 'right', count: 1 },
  { type: 'left', count: 1 },
  { type: 'offset-r', count: 2 },
  { type: 'left', count: 1 },
  { type: 'full', count: 1 },
];

/* ========================================
   作品一覧描画
   ======================================== */
function renderWorks(category) {
  const container = document.getElementById('worksFlow');
  const countEl = document.getElementById('worksCount');
  if (!container) return;

  const filtered = category === 'all'
    ? worksData
    : worksData.filter(w => w.category === category);

  if (countEl) {
    countEl.textContent = filtered.length;
  }

  container.innerHTML = '';
  let index = 0;
  let patternIndex = 0;

  while (index < filtered.length) {
    const pattern = layoutPattern[patternIndex % layoutPattern.length];
    const items = filtered.slice(index, index + pattern.count);
    if (items.length === 0) break;

    const row = createRow(pattern.type, items);
    row.classList.add('fade-in');
    container.appendChild(row);

    index += items.length;
    patternIndex++;
  }

  observeFadeIn();
}

function createRow(type, items) {
  const row = document.createElement('div');
  row.className = `works__row works__row--${type}`;

  switch (type) {
    case 'full':
      row.appendChild(createCard(items[0]));
      break;

    case 'right':
      row.appendChild(createSpacer());
      if (items.length === 2) {
        const col = document.createElement('div');
        col.className = 'works__column';
        items.forEach(item => col.appendChild(createCard(item)));
        row.appendChild(col);
      } else {
        row.appendChild(createCard(items[0]));
      }
      break;

    case 'left':
      row.appendChild(createCard(items[0]));
      row.appendChild(createSpacer());
      break;

    case 'pair':
      items.forEach(item => row.appendChild(createCard(item)));
      if (items.length === 1) row.appendChild(createSpacer());
      break;

    case 'offset-r':
    case 'offset-l':
      items.forEach(item => row.appendChild(createCard(item)));
      if (items.length === 1) row.appendChild(createSpacer());
      break;
  }

  return row;
}

function createCard(work) {
  const a = document.createElement('a');
  const orientation = work.thumbOrientation || 'landscape';
  a.className = `work-card work-card--${orientation}`;
  a.href = `work.html?id=${work.id}`;

  const visual = work.thumbnail
    ? `<img class="work-card__thumb" src="${work.thumbnail}" alt="${work.title}" loading="lazy">`
    : `<div class="work-card__placeholder">[${work.title}]</div>`;

  a.innerHTML = `
    <span class="work-card__num">${work.num}</span>
    ${visual}
    <div class="work-card__info">
      <p class="work-card__title">${work.title}</p>
      <p class="work-card__cat">${work.category}</p>
    </div>
  `;

  return a;
}

function createSpacer() {
  const div = document.createElement('div');
  div.className = 'works__spacer';
  return div;
}

/* ========================================
   カテゴリフィルタ
   ======================================== */
function initFilter() {
  const container = document.getElementById('categoryFilter');
  if (!container) return;

  container.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter__btn');
    if (!btn) return;

    container.querySelectorAll('.filter__btn').forEach(b => b.classList.remove('filter__btn--active'));
    btn.classList.add('filter__btn--active');

    const category = btn.dataset.category;
    renderWorks(category);
  });
}

/* ========================================
   作品詳細ページ描画
   ======================================== */
function renderWorkDetail() {
  const params = new URLSearchParams(window.location.search);
  const workId = params.get('id');
  const work = worksData.find(w => w.id === workId);

  if (!work) {
    document.getElementById('workDetailContent').innerHTML = '<p style="padding:40px;">作品が見つかりません。</p>';
    return;
  }

  document.title = `${work.title} — Shimon Fukiura`;

  const workIndex = worksData.findIndex(w => w.id === workId);
  const prevWork = workIndex > 0 ? worksData[workIndex - 1] : null;
  const nextWork = workIndex < worksData.length - 1 ? worksData[workIndex + 1] : null;

  const relatedWorks = work.relatedIds
    .map(id => worksData.find(w => w.id === id))
    .filter(Boolean);

  const container = document.getElementById('workDetailContent');
  container.innerHTML = `
    <a href="index.html" class="work-detail__back">← 作品一覧に戻る</a>

    <div class="work-detail__header fade-in">
      <span class="work-detail__category">${work.category}</span>
      <h1 class="work-detail__title">${work.title}</h1>
    </div>

    ${work.galleryType === 'stack' && work.gallery.length > 0 ? `
    <div class="stack-gallery fade-in">
      ${work.gallery.map((img, i) => `
        <img class="stack-gallery__img" src="${img}" alt="${work.title} - ${i + 1}" loading="${i === 0 ? 'eager' : 'lazy'}">
      `).join('')}
    </div>
    ` : work.galleryType === 'book' && work.gallery.length > 0 ? `
    <div class="book-viewer fade-in">
      <div class="book-viewer__stage">
        <button class="book-viewer__arrow book-viewer__arrow--prev" aria-label="前のページ">‹</button>
        <img class="book-viewer__page" src="${work.gallery[0]}" alt="${work.title}">
        <button class="book-viewer__arrow book-viewer__arrow--next" aria-label="次のページ">›</button>
      </div>
      <p class="book-viewer__counter">
        <span class="book-viewer__current">1</span> / ${work.gallery.length}
      </p>
    </div>
    ` : work.gallery && work.gallery.length > 0 ? `
    <div class="gallery fade-in">
      <div class="gallery__main">
        <img class="gallery__main-img" src="${work.gallery[0]}" alt="${work.title}">
      </div>
      <div class="gallery__thumbs">
        ${work.gallery.map((img, i) => `
          <button class="gallery__thumb${i === 0 ? ' gallery__thumb--active' : ''}" data-src="${img}">
            <img src="${img}" alt="${work.title} - ${i + 1}" loading="lazy">
          </button>
        `).join('')}
      </div>
    </div>
    ` : `
    <div class="work-detail__hero-image fade-in">
      ${work.heroImage
        ? `<img src="${work.heroImage}" alt="${work.title}">`
        : '<div class="placeholder">[メイン作品画像]</div>'}
    </div>
    `}

    <div class="work-detail__content fade-in">
      <div class="work-detail__overview">
        ${work.overview ? `<h2>概要</h2><p>${work.overview}</p>` : ''}
        ${work.concept ? `<h2>コンセプト</h2><p>${work.concept}</p>` : ''}
        ${work.designDetails ? work.designDetails.map(d => `
          <h3>${d.label}</h3><p>${d.text}</p>
        `).join('') : ''}
        ${work.result ? `<h2>結果・振り返り</h2><p>${work.result}</p>` : ''}
      </div>
      <div class="work-detail__meta">
        ${work.period ? `<div class="work-detail__meta-item"><p class="work-detail__meta-label">制作期間</p><p class="work-detail__meta-value">${work.period}</p></div>` : ''}
        ${work.tools ? `<div class="work-detail__meta-item"><p class="work-detail__meta-label">使用ツール</p><p class="work-detail__meta-value">${work.tools}</p></div>` : ''}
        <div class="work-detail__meta-item">
          <p class="work-detail__meta-label">カテゴリ</p>
          <p class="work-detail__meta-value">${work.category}</p>
        </div>
      </div>
    </div>

    ${work.process.length > 0 ? `
    <div class="work-detail__process fade-in">
      <h2>制作プロセス</h2>
      <div class="work-detail__steps">
        ${work.process.map(p => `
          <div class="work-detail__step">
            <p class="work-detail__step-num">${p.step}</p>
            <p class="work-detail__step-title">${p.title}</p>
            <p class="work-detail__step-desc">${p.description}</p>
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}

    ${work.externalUrl ? `
    <div class="work-detail__external fade-in">
      <a href="${work.externalUrl}" class="work-detail__external-link" target="_blank" rel="noopener noreferrer">${work.externalUrl}</a>
    </div>
    ` : ''}

    ${relatedWorks.length > 0 ? `
    <div class="work-detail__related fade-in">
      <h2>関連する作品</h2>
      <div class="work-detail__related-grid">
        ${relatedWorks.map(rw => `
          <a href="work.html?id=${rw.id}" class="work-detail__related-card">
            ${rw.thumbnail
              ? `<img src="${rw.thumbnail}" alt="${rw.title}" style="width:100%;height:120px;object-fit:cover;">`
              : `<div class="placeholder">[${rw.title}]</div>`}
            <p>${rw.title}</p>
          </a>
        `).join('')}
      </div>
    </div>
    ` : ''}

    <nav class="work-detail__nav fade-in">
      ${prevWork ? `
        <a href="work.html?id=${prevWork.id}" class="work-detail__nav-link">
          <span class="work-detail__nav-label">← Prev</span>
          <span class="work-detail__nav-title">${prevWork.title}</span>
        </a>
      ` : '<span></span>'}
      ${nextWork ? `
        <a href="work.html?id=${nextWork.id}" class="work-detail__nav-link work-detail__nav-link--next">
          <span class="work-detail__nav-label">Next →</span>
          <span class="work-detail__nav-title">${nextWork.title}</span>
        </a>
      ` : '<span></span>'}
    </nav>
  `;

  observeFadeIn();
  initGallery();
  initBookViewer();
}

/* ========================================
   イメージギャラリー
   ======================================== */
function initGallery() {
  const thumbsContainer = document.querySelector('.gallery__thumbs');
  if (!thumbsContainer) return;

  const mainImg = document.querySelector('.gallery__main-img');
  const thumbs = Array.from(thumbsContainer.querySelectorAll('.gallery__thumb'));

  function selectThumb(thumb) {
    thumbs.forEach(t => t.classList.remove('gallery__thumb--active'));
    thumb.classList.add('gallery__thumb--active');
    mainImg.src = thumb.dataset.src;
    thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }

  thumbsContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('.gallery__thumb');
    if (!btn) return;
    selectThumb(btn);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();

    const current = thumbs.findIndex(t => t.classList.contains('gallery__thumb--active'));
    let next;
    if (e.key === 'ArrowRight') {
      next = current < thumbs.length - 1 ? current + 1 : 0;
    } else {
      next = current > 0 ? current - 1 : thumbs.length - 1;
    }
    selectThumb(thumbs[next]);
  });
}

/* ========================================
   ブックビューワー
   ======================================== */
function initBookViewer() {
  const viewer = document.querySelector('.book-viewer');
  if (!viewer) return;

  const pageImg = viewer.querySelector('.book-viewer__page');
  const prevBtn = viewer.querySelector('.book-viewer__arrow--prev');
  const nextBtn = viewer.querySelector('.book-viewer__arrow--next');
  const counterEl = viewer.querySelector('.book-viewer__current');

  const params = new URLSearchParams(window.location.search);
  const work = worksData.find(w => w.id === params.get('id'));
  if (!work || !work.gallery) return;

  const pages = work.gallery;
  let current = 0;

  function showPage(index) {
    current = index;
    pageImg.src = pages[current];
    counterEl.textContent = current + 1;
    prevBtn.disabled = current === 0;
    nextBtn.disabled = current === pages.length - 1;
  }

  prevBtn.addEventListener('click', () => {
    if (current > 0) showPage(current - 1);
  });

  nextBtn.addEventListener('click', () => {
    if (current < pages.length - 1) showPage(current + 1);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' && current > 0) {
      e.preventDefault();
      showPage(current - 1);
    } else if (e.key === 'ArrowRight' && current < pages.length - 1) {
      e.preventDefault();
      showPage(current + 1);
    }
  });

  showPage(0);
}

/* ========================================
   スクロールアニメーション
   ======================================== */
function initScrollAnimation() {
  observeFadeIn();
}

function observeFadeIn() {
  const targets = document.querySelectorAll('.fade-in:not(.fade-in--visible)');
  if (!targets.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('fade-in--visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.05,
    rootMargin: '0px 0px 100px 0px'
  });

  requestAnimationFrame(() => {
    targets.forEach(el => observer.observe(el));
  });
}
