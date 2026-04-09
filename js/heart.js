/**
 * 心形布局算法 v2.3
 * 照片按心形轮廓内随机散布（非网格排列）
 */

class HeartLayout {
  constructor() {}

  /**
   * 心形隐式方程判断点是否在心形内部
   * 基于标准心形曲线：(x² + y² - 1)³ - x²y³ ≤ 0 为内部
   */
  _isInsideHeart(nx, ny) {
    // 标准化到 [-2, 2] × [-2, 1.5] 的心形坐标
    const x = nx;
    const y = ny + 0.3; // 稍微下移，使心形更居中
    return Math.pow(x*x + y*y - 1, 3) - x*x * y*y * y <= 0;
  }

  getContainerSize() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    if (vw <= 480) return { w: vw * 0.85, h: vh * 0.55 };
    if (vw <= 767) return { w: vw * 0.72, h: vh * 0.58 };
    if (vw <= 1199) return { w: vw * 0.65, h: vh * 0.62 };
    return { w: Math.min(vw * 0.55, 650), h: Math.min(vh * 0.68, 700) };
  }

  /**
   * 在心形区域内随机生成点位（拒绝采样法）
   * 确保照片分布跟随背景心形的自然形状
   */
  generatePoints(count, containerSize) {
    const points = [];
    const { w: cw, h: ch } = containerSize;

    // 拍立得尺寸
    let photoW, photoH;
    if (cw >= 600) { photoW = 80; photoH = 100; }
    else if (cw >= 450) { photoW = 66; photoH = 84; }
    else { photoW = 52; photoH = 68; }

    // 心形区域参数（标准化坐标系 → 容器像素映射）
    // 扩大采样范围使照片更分散
    const scaleX = cw / 3.4;   // 原来cw/4.0 → 更宽
    const scaleY = ch / 2.9;   // 原来ch/3.5 → 更高
    const cx = cw / 2;         // 心形中心X
    const cy = ch * 0.55;      // 原来ch*0.45 → 整体下移

    const maxAttempts = count * 200;
    let attempts = 0;

    while (points.length < count && attempts < maxAttempts) {
      attempts++;

      // 在心形包围盒内随机采样
      const nx = (Math.random() * 2 - 1) * 1.85; // 归一化 x ∈ [-1.85, 1.85] 更分散
      const ny = (Math.random() * 2 - 1) * 1.4;  // 归一化 y ∈ [-1.4, 1.4] 更分散

      // 判断是否在心形内部
      if (!this._isInsideHeart(nx, ny)) continue;

      // 转换为容器像素坐标
      const px = cx + nx * scaleX;
      const py = cy + ny * scaleY;

      // 边界检查
      if (px < photoW || px > cw - photoW || py < photoH || py > ch - photoH) continue;

      // 与已有点位的最小间距检查（放宽让分布更散）
      const minDist = photoW * 1.05;
      let tooClose = false;
      for (const p of points) {
        const dx = p.x - px;
        const dy = p.y - py;
        if (Math.sqrt(dx*dx + dy*dy) < minDist) { tooClose = true; break; }
      }
      if (tooClose) continue;

      points.push({
        x: px,
        y: py,
        w: photoW,
        h: photoH,
        rot: (Math.random() * 12 - 6).toFixed(1),  // -6° ~ +6° 更大旋转范围
        flyStartX: (Math.random() - 0.5) * cw,
        flyRotStart: (Math.random() * 40 - 20).toFixed(1)
      });
    }

    // 如果拒绝采样不够（心形边缘区域难命中），补充一些靠近中心的点
    if (points.length < count) {
      const remaining = count - points.length;
      for (let i = 0; i < remaining; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = Math.random() * 0.7; // 只取内部70%半径
        const nx = r * Math.cos(angle);
        const ny = r * Math.sin(angle) * 0.75; // Y方向稍扁
        points.push({
          x: cx + nx * scaleX * 0.85,
          y: cy + ny * scaleY * 0.85,
          w: photoW,
          h: photoH,
          rot: (Math.random() * 12 - 6).toFixed(1),
          flyStartX: (Math.random() - 0.5) * cw,
          flyRotStart: (Math.random() * 40 - 20).toFixed(1)
        });
      }
    }

    return points;
  }
}

const heartLayout = new HeartLayout();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { HeartLayout, heartLayout };
}
