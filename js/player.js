/**
 * 音乐播放器模块
 * 控制背景音乐的播放、暂停、进度等
 */

class MusicPlayer {
  constructor() {
    this.audio = null;
    this.playlist = [];
    this.currentIndex = 0;
    this.isPlaying = false;
    this.isPanelOpen = false;
    this.initialized = false;
  }

  /**
   * 初始化播放器
   */
  init() {
    if (this.initialized) return;

    // 创建 audio 元素
    this.audio = new Audio();
    this.audio.volume = 0.5;
    this.audio.loop = false; // 我们自己控制循环播放

    // 绑定事件
    this.bindEvents();

    // 加载音乐列表
    this.loadPlaylist();

    this.initialized = true;
  }

  /**
   * 加载音乐列表
   */
  async loadPlaylist() {
    // 音乐目录下的实际文件（已重命名去掉#）
    const musicFiles = [
      { 
        src: './music/暖暖-梁静茹.mp3', 
        title: '暖暖', 
        artist: '梁静茹' 
      },
      { 
        src: './music/岁月里的花-莫文蔚.mp3', 
        title: '岁月里的花', 
        artist: '莫文蔚' 
      }
    ];

    this.playlist = musicFiles;

    // 如果有音乐文件，设置第一个
    if (this.playlist.length > 0) {
      this.audio.src = this.playlist[0].src;
      this.updateUI();
    }
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    // 播放/暂停事件
    this.audio.addEventListener('play', () => {
      this.isPlaying = true;
      this.updatePlayButton();
    });

    this.audio.addEventListener('pause', () => {
      this.isPlaying = false;
      this.updatePlayButton();
    });

    // 播放结束，切换下一首（循环播放）
    this.audio.addEventListener('ended', () => {
      this.currentIndex = (this.currentIndex + 1) % this.playlist.length;
      const track = this.playlist[this.currentIndex];
      this.audio.src = track.src;
      this.audio.load();
      this.updateUI();
      // 自动播放下一首
      setTimeout(() => {
        this.audio.play().catch(() => {});
      }, 100);
    });

    // 更新进度
    this.audio.addEventListener('timeupdate', () => {
      this.updateProgress();
    });

    // 加载元数据
    this.audio.addEventListener('loadedmetadata', () => {
      this.updateDuration();
    });

    // 加载错误处理
    this.audio.addEventListener('error', () => {
      console.warn('[MusicPlayer] audio error');
    });

    // 绑定 UI 按钮事件
    this.bindUIEvents();
  }

  /**
   * 绑定 UI 事件
   */
  bindUIEvents() {
    const playPauseBtn = document.getElementById('playPauseBtn');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const progressBar = document.getElementById('progressBar');

    if (playPauseBtn) {
      playPauseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.togglePlay();
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.prev();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.next();
      });
    }

    if (progressBar) {
      progressBar.addEventListener('click', (e) => {
        e.stopPropagation();
        this.seek(e);
      });
    }
  }

  /**
   * 切换播放/暂停
   */
  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  /**
   * 播放
   */
  play() {
    if (this.audio.src) {
      this.audio.play().catch(() => {});
    }
  }

  /**
   * 暂停
   */
  pause() {
    this.audio.pause();
  }

  /**
   * 上一首
   */
  prev() {
    this.currentIndex = (this.currentIndex - 1 + this.playlist.length) % this.playlist.length;
    this.loadCurrentTrack();
    if (this.isPlaying) this.play();
  }

  /**
   * 下一首
   */
  next() {
    this.currentIndex = (this.currentIndex + 1) % this.playlist.length;
    this.loadCurrentTrack();
    if (this.isPlaying) this.play();
  }

  /**
   * 加载当前曲目
   */
  loadCurrentTrack() {
    if (this.playlist.length > 0) {
      const track = this.playlist[this.currentIndex];
      this.audio.src = track.src;
      this.audio.load();
      this.updateUI();
    }
  }

  /**
   * 跳转播放位置
   */
  seek(e) {
    const progressBar = document.getElementById('progressBar');
    if (!progressBar || !this.audio.duration) return;

    const rect = progressBar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    this.audio.currentTime = percent * this.audio.duration;
  }

  /**
   * 设置音量
   */
  setVolume(value) {
    this.audio.volume = Math.max(0, Math.min(1, value));
  }

  /**
   * 更新播放按钮状态（使用 SVG 图标确保显示）
   */
  updatePlayButton() {
    const playPauseBtn = document.getElementById('playPauseBtn');

    if (playPauseBtn) {
      if (this.isPlaying) {
        // 暂停图标
        playPauseBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
      } else {
        // 播放图标
        playPauseBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
      }
    }
  }

  /**
   * 更新进度条（带蝴蝶结指示器）
   */
  updateProgress() {
    const progressBar = document.getElementById('progressBar');
    const progressFill = document.getElementById('progressFill');
    const progressBow = document.getElementById('progressBow');
    const currentTimeEl = document.getElementById('currentTime');

    if (!this.audio.duration) return;

    const percent = this.audio.currentTime / this.audio.duration;

    if (progressFill) {
      progressFill.style.width = (percent * 100) + '%';
    }

    // 更新蝴蝶结位置
    if (progressBar && progressBow) {
      const rect = progressBar.getBoundingClientRect();
      const bowPosition = percent * rect.width;
      progressBow.style.left = bowPosition + 'px';
      progressBow.style.display = 'block';
    }

    if (currentTimeEl) {
      currentTimeEl.textContent = this.formatTime(this.audio.currentTime);
    }
  }

  /**
   * 更新总时长
   */
  updateDuration() {
    const durationEl = document.getElementById('duration');

    if (durationEl && this.audio.duration) {
      durationEl.textContent = this.formatTime(this.audio.duration);
    }
  }

  /**
   * 更新 UI 信息
   */
  updateUI() {
    const titleEl = document.getElementById('songTitle');
    const artistEl = document.getElementById('songArtist');

    if (this.playlist.length > 0) {
      const track = this.playlist[this.currentIndex];

      if (titleEl) {
        titleEl.textContent = track.title || '未知曲目';
      }

      if (artistEl) {
        artistEl.textContent = track.artist || '未知艺术家';
      }
    }
  }

  /**
   * 格式化时间
   */
  formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}

// 全局实例
let musicPlayer = null;

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MusicPlayer };
}
