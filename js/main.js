/**
 * 主入口脚本 v2.2
 * 封面页 → 主页面（home.png背景 + 心形照片飞入）
 */

let galleryPhotos = [];
let hasInteracted = false;
let timerInterval = null;
let currentTab = 'gallery';

/* ===========================
   入口
   =========================== */
document.addEventListener('DOMContentLoaded', init);

async function init() { initLanding(); }

/* ===========================
   封面页逻辑（不变）
   =========================== */

function initLanding() {
  loadCoverPhoto();
  startLoveTimer();

  requestAnimationFrame(() => {
    document.querySelector('.landing-photo-wrap')?.classList.add('show');
    document.querySelector('.landing-timer')?.classList.add('show');
    document.querySelector('.landing-subtitle')?.classList.add('show');
    document.getElementById('enterBtn')?.classList.add('show');
  });

  bindEnterButton();
}

function loadCoverPhoto() {
  const photos = CONFIG.landing.coverPhotos;
  if (!photos || photos.length === 0) return;
  const idx = Math.floor(Math.random() * photos.length);
  const el = document.getElementById('landingPhoto');
  if (el) el.src = `${CONFIG.landing.photoDir}${photos[idx]}`;
}

function startLoveTimer() {
  const startDate = new Date(CONFIG.landing.loveStartDate);

  function update() {
    const diff = Date.now() - startDate.getTime();
    if (diff < 0) return;

    setTimerValue('timer-days', Math.floor(diff / 86400000));
    setTimerValue('timer-hours', Math.floor((diff % 86400000) / 3600000));
    setTimerValue('timer-minutes', Math.floor((diff % 3600000) / 60000));
    setTimerValue('timer-seconds', Math.floor((diff % 60000) / 1000));
  }

  update();
  timerInterval = setInterval(update, 1000);
}

function setTimerValue(cls, val) {
  const el = document.querySelector(`.${cls}`);
  if (!el) return;
  const changed = el.textContent !== String(val);
  el.textContent = val;
  if (changed) { el.classList.add('tick'); setTimeout(() => el.classList.remove('tick'), 200); }
}

function bindEnterButton() {
  const btn = document.getElementById('enterBtn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    hasInteracted = true;
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }

    const landing = document.getElementById('landingPage');
    landing.classList.add('fade-out');

    setTimeout(() => {
      landing.style.display = 'none';
      showMainPage();
    }, 700);
  });
}

/* ===========================
   主页面逻辑 v2.2
   =========================== */

async function showMainPage() {
  const mainPage = document.getElementById('mainPage');
  mainPage.classList.remove('hidden');

  initTabBar();
  await initHeartFrame();
  initDecorations();
  startEntranceAnimation();
  startMusicPlayer();
  initMessageBoard();
}

/**
 * 初始化心形区域 + 照片（不再画SVG边框，home.png自带心形轮廓）
 */
/**
 * 根据当前视口宽度获取照片显示数量
 */
function getPhotoCount() {
  if (window.innerWidth <= 480) return CONFIG.heartFrame.photoCount.mobile;
  if (window.innerWidth <= 767) return CONFIG.heartFrame.photoCount.tablet;
  return CONFIG.heartFrame.photoCount.desktop;
}

async function initHeartFrame() {
  const wrapper = document.getElementById('heartFrameWrapper');
  const inner = document.getElementById('heartFrameInner');
  if (!wrapper || !inner) return;

  galleryPhotos = await loadPhotos();

  // 获取容器尺寸并设置
  const size = heartLayout.getContainerSize();
  wrapper.style.width = `${size.w}px`;
  wrapper.style.height = `${size.h}px`;

  if (galleryPhotos.length === 0) {
    inner.innerHTML = '<p style="color:#B8907E;font-family:var(--font-handwritten);padding:40px;text-align:center;">暂无照片</p>';
    return;
  }

  // 根据断点取数量
  const count = Math.min(getPhotoCount(), galleryPhotos.length);

  // 随机采样
  const selected = shuffleArray([...galleryPhotos]).slice(0, count);

  // 生成点位并渲染
  const points = heartLayout.generatePoints(count, size);
  renderPolaroids(inner, selected, points);
  photoInteraction.init(inner, selected);
}

/**
 * 渲染拍立得风格照片卡（带飞入动画CSS变量）
 */
function renderPolaroids(container, photos, points) {
  container.innerHTML = '';

  photos.forEach((photo, i) => {
    const pt = points[i];
    if (!pt) return;

    const card = document.createElement('div');
    card.className = 'polaroid-card';
    card.dataset.index = i;
    card.style.left = `${pt.x - pt.w / 2}px`;
    card.style.top = `${pt.y - pt.h / 2}px`;
    card.style.width = `${pt.w}px`;
    card.style.height = `${pt.h}px`;
    card.style.setProperty('--rot', `${pt.rot}deg`);
    card.style.setProperty('--fly-x', `${pt.flyStartX}px`);
    card.style.setProperty('--rot-start', `${pt.flyRotStart}deg`);
    card.style.setProperty('--rot-end', `${pt.rot}deg`);
    card.style.zIndex = Math.floor(Math.random() * 12) + 1;
    card.style.animationDelay = `${i * CONFIG.animation.staggerDelay}ms`;

    // 正面：图片
    const inner = document.createElement('div');
    inner.className = 'photo-inner';

    const front = document.createElement('div');
    front.className = 'photo-front';

    const imgWrap = document.createElement('div');
    imgWrap.className = 'polaroid-img-wrap';
    const img = document.createElement('img');
    img.src = photo.src;
    img.alt = photo.backText || photo.filename;
    img.loading = 'lazy';
    imgWrap.appendChild(img);
    front.appendChild(imgWrap);

    if (photo.date) {
      const dateLabel = document.createElement('div');
      dateLabel.className = 'polaroid-date-label';
      dateLabel.textContent = photo.date;
      front.appendChild(dateLabel);
    }

    // 背面
    const back = document.createElement('div');
    back.className = 'photo-back';
    if (photo.date) {
      const dEl = document.createElement('div'); dEl.className = 'date'; dEl.textContent = photo.date;
      back.appendChild(dEl);
    }
    const tEl = document.createElement('div'); tEl.className = 'text'; tEl.textContent = photo.backText || photo.filename;
    back.appendChild(tEl);

    inner.appendChild(front);
    inner.appendChild(back);
    card.appendChild(inner);
    container.appendChild(card);
  });
}

/**
 * 完整入场动画时序 v2.2
 *
 * 时序：
 * 1. 顶栏淡入 (0ms)
 * 2. 心形容器弹跳出现 (0ms)
 * 3. 情话文字渐显 (300ms)
 * 4. 照片逐张从上方飞入心形 (400ms起, stagger)
 * 5. 预览卡片滑入 (照片完成后 ~800ms)
 * 6. 散落装饰渐显 (900ms)
 * 7. 底部药丸栏弹入 (1100ms)
 * 8. 心形开始脉动 (1200ms)
 */
function startEntranceAnimation() {
  requestAnimationFrame(() => {
    // 1. 顶栏淡入
    document.getElementById('topBar')?.classList.add('show');

    // 2. 心形容器弹跳出现
    const wrapper = document.getElementById('heartFrameWrapper');
    wrapper.classList.add('show');

    // 3. 情话文字渐显
    setTimeout(() => {
      document.getElementById('heartQuote')?.classList.add('show');
    }, 350);

    // 4. 照片逐张飞入
    setTimeout(() => {
      const cards = wrapper.querySelectorAll('.polaroid-card');
      cards.forEach((card, i) => {
        setTimeout(() => card.classList.add('fly-in'), i * CONFIG.animation.staggerDelay);
      });
    }, 450);

    // 5. 预览卡片滑入
    const allCards = wrapper.querySelectorAll('.polaroid-card');
    setTimeout(() => {
      document.getElementById('previewMsg')?.classList.add('show');
      document.getElementById('previewVideo')?.classList.add('show');
    }, 800 + (allCards?.length || 0) * CONFIG.animation.staggerDelay);

    // 6. 散落装饰渐显
    setTimeout(() => {
      const decos = document.querySelectorAll('.decoration-layer .decoration');
      decos.forEach((d, i) => {
        d.style.setProperty('--deco-delay', `${i * 150}ms`);
        d.style.setProperty('--float-dur', `${3 + Math.random() * 2}s`);
      });
    }, 950);

    // 7. 底部药丸栏弹入
    setTimeout(() => {
      document.getElementById('tabBar')?.classList.add('show');
    }, 1050);

    // 8. 心形脉动
    setTimeout(() => {
      wrapper.classList.add('pulse');
    }, 1250);
  });
}

/* ===========================
   药丸标签栏切换
   =========================== */

function initTabBar() {
  document.querySelectorAll('.tab-pill').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  document.getElementById('previewMsg')?.addEventListener('click', () => {
    if (messageBoard) messageBoard.open();
  });
  document.getElementById('previewVideo')?.addEventListener('click', () => switchTab('video'));
}

function switchTab(tabId) {
  if (tabId === currentTab && currentTab === 'gallery') return;

  // 留言墙标签 → 打开模态框（不切换面板）
  if (tabId === 'messages') {
    if (messageBoard) messageBoard.open();
    return;
  }

  currentTab = tabId;

  document.querySelectorAll('.tab-pill').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
  });

  document.querySelectorAll('.tab-panel').forEach(panel => {
    panel.classList.toggle('active', panel.id === `tab-${tabId}`);
  });

  if (tabId === 'gallery') {
    const wrapper = document.getElementById('heartFrameWrapper');
    if (wrapper && !wrapper.classList.contains('pulse')) wrapper.classList.add('pulse');
  } else {
    document.getElementById('heartFrameWrapper')?.classList.remove('pulse');
  }
}

/* ===========================
   散落装饰元素
   =========================== */

function initDecorations() {
  if (!CONFIG.decorations.enabled) return;
  const layer = document.getElementById('decorationLayer');
  if (!layer) return;

  const { stars, hearts } = CONFIG.decorations;

  for (let i = 0; i < stars.count; i++) layer.appendChild(createDecoration('star', stars.colors, stars.sizeRange));
  for (let i = 0; i < hearts.count; i++) layer.appendChild(createDecoration('heart', hearts.colors, hearts.sizeRange));
}

function createDecoration(type, colors, [minSz, maxSz]) {
  const el = document.createElement('span');
  el.className = `decoration decoration-${type}`;
  el.textContent = type === 'star' ? '\u2B50' : '\uD83E\uDD70';

  const size = minSz + Math.random() * (maxSz - minSz);
  el.style.fontSize = `${size}px`;
  el.style.left = `${5 + Math.random() * 90}%`;
  el.style.top = `${5 + Math.random() * 85}%`;
  el.style.color = colors[Math.floor(Math.random() * colors.length)];
  el.style.setProperty('--float-dur', `${3 + Math.random() * 3}s`);
  el.style.setProperty('--deco-delay', `${Math.random() * 1200}ms`);

  return el;
}

/* ===========================
   照片加载 & 工具函数
   =========================== */

async function loadPhotos() {
  const imageFiles = [
    'Image_1707233550241.jpg','Image_1707299297500.jpg','Image_1707578878563.jpg',
    'Image_1707578903018.jpg','Image_1708849341892.jpg','Image_1709881845082.jpg',
    'Image_1714020066420.jpg','Image_1714312821191.jpg','Image_1723300916219.jpg',
    'Image_1726759202805.jpg','Image_1727281667635.jpg','Image_1727757549077.jpg',
    'Image_906273825643188.jpg','IMG_20240324_202446.jpg','IMG_20240501_165129.jpg',
    'IMG_20240501_204152.jpg','IMG_20250215_173501.jpg','IMG_20250531_214014.jpg',
    'IMG_20260329_202112.jpg','IMG_20260329_224551.jpg','mmexport1768664928997.jpg',
    'Screenshot_20240309_235741.jpg','wx_camera_1774662560561.jpg',
    'wx_camera_1774662582916.jpg','wx_camera_1774662630416.jpg','wx_camera_1775643049748.jpg'
  ];

  return imageFiles.map(f => ({
    filename: f,
    src: `./img/she/${f}`,
    date: '', frontText: '', backText: ''
  }));
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* ===========================
   音乐 / 响应式
   =========================== */

function startMusicPlayer() {
  if (!musicPlayer) musicPlayer = new MusicPlayer();
  musicPlayer.init();
  musicPlayer.play();

  // 照片循环刷新：每隔 N 秒重新随机采样并飞入新照片
  startPhotoRotation();
}

/* ===========================
   照片循环刷新
   =========================== */

let photoRotationTimer = null;

function startPhotoRotation() {
  const interval = (CONFIG.photoRotation && CONFIG.photoRotation.intervalSeconds) || 8;
  photoRotationTimer = setInterval(() => {
    if (currentTab !== 'gallery' || galleryPhotos.length === 0) return;
    rotatePhotos();
  }, interval * 1000);
}

async function rotatePhotos() {
  const inner = document.getElementById('heartFrameInner');
  if (!inner || !inner.children.length) return;

  // 1. 先让当前照片淡出
  const cards = inner.querySelectorAll('.polaroid-card');
  cards.forEach(card => {
    card.style.transition = 'opacity .5s ease';
    card.style.opacity = '0';
  });

  // 2. 等500ms后替换照片
  await delay(550);

  // 重新采样 + 渲染
  const size = heartLayout.getContainerSize();
  const count = Math.min(getPhotoCount(), galleryPhotos.length);

  const selected = shuffleArray([...galleryPhotos]).slice(0, count);
  const points = heartLayout.generatePoints(count, size);

  renderPolaroids(inner, selected, points);
  photoInteraction.init(inner, selected);

  // 新照片立即飞入
  requestAnimationFrame(() => {
    const newCards = inner.querySelectorAll('.polaroid-card');
    newCards.forEach((card, i) => {
      setTimeout(() => card.classList.add('fly-in'), i * 60);
    });
  });
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

// 响应式重排
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (currentTab === 'gallery' && galleryPhotos.length > 0) {
      initHeartFrame();
    }
  }, 300);
});
