/**
 * 交互逻辑模块
 * 处理照片交互、翻转、放大、手势滑动等功能
 */

class PhotoInteraction {
  constructor() {
    this.currentFlippedCard = null;
    this.modalPhotos = [];
    this.currentPhotoIndex = 0;
    this.touchStartX = 0;
    this.touchEndX = 0;
  }

  /**
   * 初始化交互
   */
  init(container, photos) {
    this.photoContainer = container;
    this.modalPhotos = photos;
    this.bindCardEvents();
    this.bindModalEvents();
    this.bindKeyboardEvents();
    this.bindTouchEvents();
  }

  /**
   * 绑定照片卡片事件
   */
  bindCardEvents() {
    const cards = this.photoContainer
      ? this.photoContainer.querySelectorAll('.polaroid-card')
      : document.querySelectorAll('.polaroid-card');

    cards.forEach((card, index) => {
      // 点击翻转
      card.addEventListener('click', (e) => {
        // 如果是翻转状态，再次点击翻回
        if (card.classList.contains('flipped')) {
          this.flipCard(card);
          return;
        }

        // 否则打开模态框
        this.openModal(index);
      });

      // 触摸开始（用于手势检测）
      card.addEventListener('touchstart', (e) => {
        this.touchStartX = e.changedTouches[0].screenX;
      }, { passive: true });

      // 触摸结束
      card.addEventListener('touchend', (e) => {
        this.touchEndX = e.changedTouches[0].screenX;
        this.handleSwipe(card, index);
      }, { passive: true });
    });
  }

  /**
   * 翻转卡片
   */
  flipCard(card) {
    card.classList.toggle('flipped');
    this.currentFlippedCard = card.classList.contains('flipped') ? card : null;
  }

  /**
   * 打开模态框
   */
  openModal(index) {
    this.currentPhotoIndex = index;
    const photo = this.modalPhotos[index];

    const modal = document.getElementById('photoModal');
    const modalImg = document.getElementById('modalImage');
    const modalDate = document.getElementById('modalDate');
    const modalText = document.getElementById('modalText');
    const prevBtn = document.getElementById('modalPrev');
    const nextBtn = document.getElementById('modalNext');

    if (!modal || !photo) return;

    // 设置内容
    modalImg.src = photo.src;
    modalImg.alt = photo.backText || photo.filename;
    modalDate.textContent = photo.date || '';
    modalText.textContent = photo.frontText || photo.backText || '';

    // 更新导航按钮状态
    prevBtn.classList.toggle('hidden', index === 0);
    nextBtn.classList.toggle('hidden', index === this.modalPhotos.length - 1);

    // 显示模态框
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  /**
   * 关闭模态框
   */
  closeModal() {
    const modal = document.getElementById('photoModal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  /**
   * 切换到上一张
   */
  prevPhoto() {
    if (this.currentPhotoIndex > 0) {
      this.openModal(this.currentPhotoIndex - 1);
    }
  }

  /**
   * 切换到下一张
   */
  nextPhoto() {
    if (this.currentPhotoIndex < this.modalPhotos.length - 1) {
      this.openModal(this.currentPhotoIndex + 1);
    }
  }

  /**
   * 绑定模态框事件
   */
  bindModalEvents() {
    const modal = document.getElementById('photoModal');
    const closeBtn = document.getElementById('modalClose');
    const prevBtn = document.getElementById('modalPrev');
    const nextBtn = document.getElementById('modalNext');

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeModal());
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.prevPhoto());
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.nextPhoto());
    }

    // 点击遮罩关闭
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeModal();
        }
      });
    }
  }

  /**
   * 绑定键盘事件
   */
  bindKeyboardEvents() {
    document.addEventListener('keydown', (e) => {
      const modal = document.getElementById('photoModal');
      if (!modal || !modal.classList.contains('active')) return;

      switch (e.key) {
        case 'Escape':
          this.closeModal();
          break;
        case 'ArrowLeft':
          this.prevPhoto();
          break;
        case 'ArrowRight':
          this.nextPhoto();
          break;
      }
    });
  }

  /**
   * 绑定触摸手势事件
   */
  bindTouchEvents() {
    const modal = document.getElementById('photoModal');

    if (modal) {
      modal.addEventListener('touchstart', (e) => {
        this.touchStartX = e.changedTouches[0].screenX;
      }, { passive: true });

      modal.addEventListener('touchend', (e) => {
        this.touchEndX = e.changedTouches[0].screenX;
        this.handleModalSwipe();
      }, { passive: true });
    }
  }

  /**
   * 处理照片卡片的滑动手势
   */
  handleSwipe(card, index) {
    const swipeThreshold = 50;
    const diff = this.touchStartX - this.touchEndX;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0 && index < this.modalPhotos.length - 1) {
        // 向左滑 - 下一张
        this.openModal(index + 1);
      } else if (diff < 0 && index > 0) {
        // 向右滑 - 上一张
        this.openModal(index - 1);
      }
    }
  }

  /**
   * 处理模态框的滑动手势
   */
  handleModalSwipe() {
    const swipeThreshold = 50;
    const diff = this.touchStartX - this.touchEndX;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        this.nextPhoto();
      } else {
        this.prevPhoto();
      }
    }
  }
}

// 全局实例
const photoInteraction = new PhotoInteraction();

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PhotoInteraction, photoInteraction };
}
