/**
 * 打脸消气小游戏核心逻辑
 * 状态管理 → 道具选择 → 击中动画 → 音效播放 → 结局触发
 */

const IMG_DIR = 'img/HitFace/';
const MUSIC_DIR = 'game/HitFace/music/';

// 状态机
const STATES = [
  { image: 'Start.png', hits: 0, desc: '来吧！放马过来！' },
  { image: 'Hit1.png',  hits: 1, desc: '哎哟！抱着小恐龙求饶中...' },
  { image: 'Hit2.png',  hits: 2, desc: '呜...贴了创可贴好痛痛...' },
  { image: 'Hit3.png',  hits: 3, desc: '哇啊啊啊哭给你看！！' }
];

// 结局文案池
const ENDINGS = [
  { type: 'sorry', image: 'Ending_beg.png', title: '消气成功~', sub: '对不起嘛宝宝 💕', audio: 'sorry.mp3' },
  { type: 'praise', image: 'Ending_flower.png', title: '宝宝最棒了！', sub: '送你花花❀', audio: 'praise.mp3' }
];

class HitFaceGame {
  constructor() {
    this.state = 0;       // 当前状态索引 (0=READY, 1..3=HIT)
    this.currentItem = 'pillow';
    this.isAnimating = false;
    this.particleTimer = null;
    this.particlesContainer = null;
    this.endingIdx = 0;  // 交替索引，保证两种结局轮换出现

    // DOM 缓存
    this.modal = document.getElementById('hitFaceModal');
    this.overlay = this.modal?.querySelector('.hf-overlay');
    this.stage = document.getElementById('hfStage');
    this.charImg = document.getElementById('hfCharImg');
    this.effectLayer = document.getElementById('hfEffectLayer');
    this.descEl = document.getElementById('hfDesc');
    this.counterEl = document.getElementById('hfCounter');
    this.toolbar = document.getElementById('hfToolbar');
    this.endingEl = document.getElementById('hfEnding');
    this.endingContent = document.getElementById('hfEndingContent');
    this.restartBtn = document.getElementById('hfRestartBtn');
    this.closeBtn = this.modal?.querySelector('.hf-close-btn');

    if (!this.modal) return;

    this.bindEvents();
  }

  bindEvents() {
    // 入口按钮
    document.getElementById('hitFaceStartBtn')?.addEventListener('click', () => this.open());

    // 关闭按钮
    this.closeBtn?.addEventListener('click', () => this.close());
    this.overlay?.addEventListener('click', () => this.close());

    // 道具选择
    this.toolbar?.querySelectorAll('.hf-item').forEach(item => {
      item.addEventListener('click', () => this.selectItem(item.dataset.item));
    });

    // 点击角色区域触发打击
    this.stage?.addEventListener('click', e => this.onHit(e));

    // 再打一次
    this.restartBtn?.addEventListener('click', () => this.reset());
  }

  /* ---- 打开/关闭 ---- */
  open() {
    if (!this.modal) return;
    this.modal.classList.add('active');
    this.reset();
  }

  close() {
    this.modal?.classList.remove('active');
    this.stopParticles();
  }

  reset() {
    this.state = 0;
    this.isAnimating = false;
    this.updateView();
    this.endingEl?.classList.add('hidden');
    this.stopParticles();
    this.effectLayer.innerHTML = '';
    // 重置道具选中态
    this.toolbar?.querySelectorAll('.hf-item').forEach(el =>
      el.classList.toggle('active', el.dataset.item === this.currentItem));
  }

  /* ---- 道具选择 ---- */
  selectItem(name) {
    this.currentItem = name;
    this.toolbar?.querySelectorAll('.hf-item').forEach(el => {
      el.classList.toggle('active', el.dataset.item === name);
    });
  }

  /* ---- 核心打击逻辑 ---- */
  onHit(e) {
    if (this.isAnimating || this.state >= STATES.length) return;

    const rect = this.charImg.getBoundingClientRect();
    const clickX = e.clientX || (rect.left + rect.width / 2);
    const clickY = e.clientY || (rect.top + rect.height / 2);
    const targetX = rect.left + rect.width * 0.45;
    const targetY = rect.top + rect.height * 0.35;

    this.isAnimating = true;

    // 1. 创建飞入道具并执行飞行动画
    const flyer = this.createFlyer(clickX, clickY);
    document.body.appendChild(flyer);

    requestAnimationFrame(() => {
      flyer.style.left = `${targetX}px`;
      flyer.style.top = `${targetY}px`;
      flyer.style.transform = `scale(0.5) rotate(${Math.random() * 360}deg)`;
      flyer.style.opacity = '0';
    });

    // 2. 击中瞬间效果序列（与飞行同步）
    setTimeout(() => {
      flyer.remove();
      this.playHitEffect(targetX - rect.left, targetY - rect.top);
    }, 280);

    // 3. 更新状态 & 切换图片
    setTimeout(() => {
      this.state++;
      this.updateView();

      // 检查是否到达最终态
      if (this.state >= STATES.length) {
        setTimeout(() => this.triggerEnding(), 500);
      } else {
        this.isAnimating = false;
      }
    }, 350);
  }

  /* ---- 创建飞行道具 DOM ---- */
  createFlyer(x, y) {
    const el = document.createElement('div');
    el.className = `hf-flying-item hf-${this.currentItem}-icon`;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    const styles = {
      pillow:  { bg: 'linear-gradient(135deg,#FFB6C1,#FFC0CB)', r: '10px' },
      slipper: { bg: 'linear-gradient(135deg,#87CEEB,#B0E0E6)', r: '50% 50% 46% 46%/60% 60% 40% 40%' },
      pan:     { bg: 'linear-gradient(135deg,#555,#777)', r: '50%' },
      balloon: { bg: 'linear-gradient(135deg,#FF6B81,#FF4757)', r: '50% 50% 48% 48%/55% 55% 45% 45%' },
      sock:    { bg: 'linear-gradient(180deg,#DDD,#BBB)', r: '' },
      egg:     { bg: 'linear-gradient(135deg,#FFE4B5,#F5DEB3)', r: '50% 50% 48% 48%/60% 60% 40% 40%' }
    };
    const s = styles[this.currentItem] || styles.pillow;
    el.style.background = s.bg;
    if (s.r) el.style.borderRadius = s.r;
    return el;
  }

  /* ---- 击中瞬间效果 ---- */
  playHitEffect(relX, relY) {
    // 角色震动回弹
    this.charImg?.classList.add('hf-hit-shake');
    setTimeout(() => this.charImg?.classList.remove('hf-hit-shake'), 400);

    // 显示击中印记
    const mark = document.createElement('div');
    mark.className = `hf-hit-mark hf-mark-${this.currentItem}`;
    mark.style.left = `${relX}px`;
    mark.style.top = `${relY}px`;
    this.effectLayer?.appendChild(mark);
    setTimeout(() => mark.remove(), 800);

    // 播放音效
    this.playAudio(`${MUSIC_DIR}hit.mp3`);
  }

  /* ---- 视图更新 ---- */
  updateView() {
    const s = STATES[this.state];
    if (s && s.image && this.charImg) {
      this.charImg.style.opacity = '0';
      setTimeout(() => {
        this.charImg.src = IMG_DIR + s.image;
        this.charImg.style.opacity = '1';
      }, 150);
    }
    if (this.descEl) this.descEl.textContent = s ? s.desc : '';
    if (this.counterEl) this.counterEl.textContent = `${s ? s.hits : 0} 击`;
  }

  /* ---- 结局彩蛋 ---- */
  triggerEnding() {
    // 轮换：本次取 endingIdx，下次切换到另一个
    const ending = ENDINGS[this.endingIdx];
    this.endingIdx = (this.endingIdx + 1) % ENDINGS.length;

    // 显示结局覆盖层（含图片）
    if (this.endingContent) {
      this.endingContent.innerHTML = `
        <img class="hf-ending-img" src="${IMG_DIR}${ending.image}" alt="${ending.title}">
        <p class="hf-ending-title">${ending.title}</p>
        <p class="hf-ending-sub">${ending.sub}</p>`;
    }
    this.endingEl?.classList.remove('hidden');

    // 播放结局音效
    this.playAudio(MUSIC_DIR + ending.audio);

    // 结局A：求饶模式 — 飘落爱心
    if (ending.type === 'sorry') {
      this.spawnParticles(['💕','❤️','💖','💗','🌸']);
    } else {
      // 结局B：献花模式 — 飘落花朵
      this.spawnParticles(['🌷','🌹','🌺','🌻','💐','✨']);
    }
  }

  /* ---- 飘落粒子效果 ---- */

  spawnParticle(chars) {
    if (!this.particlesContainer) {
      this.particlesContainer = document.createElement('div');
      this.particlesContainer.className = 'hf-particles';
      document.body.appendChild(this.particlesContainer);
    }
    for (let i = 0; i < 18; i++) {
      setTimeout(() => {
        const p = document.createElement('span');
        p.className = 'hf-particle';
        p.textContent = chars[Math.floor(Math.random() * chars.length)];
        p.style.left = `${Math.random() * 100}%`;
        p.style.fontSize = `${14 + Math.random() * 18}px`;
        p.style.animationDuration = `${2 + Math.random() * 2}s`;
        this.particlesContainer?.appendChild(p);
        setTimeout(() => p.remove(), 4000);
      }, i * 150);
    }
  }

  spawnParticles(chars) {
    this.spawnParticle(chars);
    this.particleTimer = setInterval(() => this.spawnParticle(chars), 3000);
  }

  stopParticles() {
    if (this.particleTimer) {
      clearInterval(this.particleTimer);
      this.particleTimer = null;
    }
    this.particlesContainer?.remove();
    this.particlesContainer = null;
  }

  /* ---- 音效播放 ---- */
  playAudio(src) {
    try {
      const audio = new Audio(src);
      audio.volume = 0.8;
      audio.play().catch(() => {}); // 静默处理自动播放限制
    } catch (_) {}
  }
}

// 初始化实例
let hitFaceGame;
document.addEventListener('DOMContentLoaded', () => {
  hitFaceGame = new HitFaceGame();
});
