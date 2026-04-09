/**
 * MessageBoard — 留言板
 * 功能：添加/编辑/删除留言、点赞、表情反应，localStorage 持久化
 * 交互：点击左下角便签或底部「留言墙」标签打开模态弹窗
 */

class MessageBoard {
  constructor() {
    this.modal = null;
    this.panel = null;
    this.wall = null;
    this.overlay = null;
    this.messages = [];
    this.STORAGE_KEY = 'doNotAngry_messages';

    // 6种便签颜色
    this.colors = [
      'color-0', // 米黄
      'color-1', // 浅粉
      'color-2', // 浅蓝
      'color-3', // 浅绿
      'color-4', // 淡紫
      'color-5', // 浅橙
    ];

    // 预置初始留言
    this.defaultMessages = [
      {
        id: 'msg_default_001',
        content: 'NNN宇宙无敌超级机智',
        nickname: '匿名',
        timestamp: Date.now(),
        likes: 999,
        reactions: {},
        isLiked: false,
        colorIndex: 0,
        rotation: -1,
      },
    ];

    // 可用表情
    this.emojis = ['❤️', '⭐', '😊', '🎉'];
  }

  init() {
    this.modal = document.getElementById('messageBoardModal');
    if (!this.modal) return;

    this.panel = this.modal.querySelector('.msg-panel');
    this.wall = this.modal.querySelector('.msg-wall');
    this.overlay = this.modal.querySelector('.msg-overlay');
    const closeBtn = this.modal.querySelector('.msg-close-btn');

    // 关闭按钮
    if (closeBtn) closeBtn.addEventListener('click', () => this.close());
    if (this.overlay) this.overlay.addEventListener('click', () => this.close());

    // 发送按钮
    const sendBtn = this.modal.querySelector('.msg-send-btn');
    if (sendBtn) sendBtn.addEventListener('click', () => this.handleSend());

    // 回车发送 (Ctrl+Enter)
    const textarea = this.modal.querySelector('.msg-textarea');
    if (textarea) {
      textarea.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') this.handleSend();
      });
    }

    // 加载数据并渲染
    this.loadFromStorage();
    this.renderMessages();
    // 首页左下角随机展示一条留言
    this.showRandomPreview();

    console.log('[MessageBoard] initialized with', this.messages.length, 'messages');
  }

  // ============================
  // 首页预览卡片：随机展示一条留言
  // ============================

  showRandomPreview() {
    const container = document.getElementById('previewMsgContent');
    if (!container || this.messages.length === 0) return;

    const randomMsg = this.messages[Math.floor(Math.random() * this.messages.length)];
    const textEl = container.querySelector('.preview-msg-text');
    const authorEl = container.querySelector('.preview-msg-author');

    if (textEl) textEl.textContent = randomMsg.content;
    if (authorEl) authorEl.textContent = `— ${randomMsg.nickname || '匿名'}`;
  }

  open() {
    if (this.modal) this.modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  close() {
    if (this.modal) this.modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  // ============================
  // localStorage 持久化
  // ============================

  loadFromStorage() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        this.messages = Array.isArray(data.messages) ? data.messages : [];
        if (this.messages.length === 0) {
          this._seedDefaults();
        }
      } else {
        this._seedDefaults();
      }
    } catch (e) {
      console.warn('[MessageBoard] load error:', e);
      this._seedDefaults();
    }
  }

  _seedDefaults() {
    this.messages = this.defaultMessages.map((m) => ({ ...m }));
    this.saveToStorage();
  }

  saveToStorage() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify({ messages: this.messages }));
    } catch (e) {
      console.warn('[MessageBoard] save error:', e);
    }
  }

  // ============================
  // 渲染
  // ============================

  renderMessages() {
    if (!this.wall) return;

    // 清空
    this.wall.innerHTML = '';

    if (this.messages.length === 0) {
      this.wall.innerHTML = '<p class="msg-empty">还没有留言，来写第一条吧~ 💌</p>';
      return;
    }

    // 按时间倒序排列（最新的在前）
    const sorted = [...this.messages].sort((a, b) => b.timestamp - a.timestamp);

    sorted.forEach((msg, i) => {
      const el = this.createNoteElement(msg);
      el.style.animationDelay = `${i * 60}ms`;
      this.wall.appendChild(el);
    });
  }

  createNoteElement(msg) {
    const div = document.createElement('div');
    const colorClass = this.colors[msg.colorIndex % this.colors.length];
    const rot = msg.rotation || (Math.random() * 6 - 3).toFixed(1);
    div.className = `msg-note ${colorClass}`;
    div.style.setProperty('--note-rot', `${rot}deg`);
    div.dataset.id = msg.id;

    // 内容区
    let html = `<div class="msg-text">${this.escapeHtml(msg.content)}</div>`;

    // 编辑模式下替换为输入框
    // （编辑时由 editMessage 方法处理）

    // 元信息 + 操作栏
    html += `
      <div class="msg-meta">
        <span>
          <span class="msg-author">${this.escapeHtml(msg.nickname || '匿名')}</span>
          <span class="msg-time">${this.formatTime(msg.timestamp)}</span>
        </span>
        <div class="msg-actions">
          <button class="msg-action-btn like-btn ${msg.isLiked ? 'liked' : ''}" title="点赞">
            ❤️<span class="count">${(msg.likes || 0) >= 999 ? '999+' : (msg.likes || 0)}</span>
          </button>
          <button class="msg-action-btn emoji-toggle-btn" title="表情反应">😊</button>
          ${this.renderReactionBtns(msg.reactions)}
          <button class="msg-action-btn edit-btn" title="编辑">✏️</button>
          <button class="msg-action-btn delete-btn" title="删除">🗑</button>
        </div>
      </div>
      <!-- 表情选择器 -->
      <div class="emoji-picker">
        ${this.emojis.map(e => `<button class="emoji-opt" data-emoji="${e}">${e}</button>`).join('')}
      </div>
    `;

    div.innerHTML = html;

    // 绑定事件
    this.bindNoteEvents(div, msg);

    return div;
  }

  renderReactionBtns(reactions) {
    if (!reactions || Object.keys(reactions).length === 0) return '';
    return Object.entries(reactions)
      .map(([emoji, count]) =>
        `<button class="msg-action-btn reaction-btn" data-emoji="${emoji}" title="${emoji}">
           ${emoji}<span class="count">${count}</span>
         </button>`
      )
      .join('');
  }

  bindNoteEvents(div, msg) {
    const id = msg.id;

    // 点赞
    const likeBtn = div.querySelector('.like-btn');
    if (likeBtn) {
      likeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleLike(id);
      });
    }

    // 表情反应
    div.querySelectorAll('.reaction-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.addReaction(id, btn.dataset.emoji);
      });
    });

    // 表情选择器
    const emojiToggle = div.querySelector('.emoji-toggle-btn');
    const picker = div.querySelector('.emoji-picker');

    if (emojiToggle && picker) {
      emojiToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        picker.classList.toggle('show');
      });
    }

    // 表情选项
    div.querySelectorAll('.emoji-opt').forEach(opt => {
      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        this.addReaction(id, opt.dataset.emoji);
        picker.classList.remove('show');
      });
    });

    // 编辑
    const editBtn = div.querySelector('.edit-btn');
    if (editBtn) {
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.enterEditMode(div, msg);
      });
    }

    // 删除
    const delBtn = div.querySelector('.delete-btn');
    if (delBtn) {
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.confirmDelete(id);
      });
    }
  }

  // ============================
  // CRUD 操作
  // ============================

  handleSend() {
    const textarea = this.modal?.querySelector('.msg-textarea');
    const nicknameInput = this.modal?.querySelector('.msg-nickname-input');
    if (!textarea) return;

    const content = textarea.value.trim();
    if (!content) {
      textarea.focus();
      return;
    }

    const nickname = nicknameInput ? (nicknameInput.value.trim() || '匿名') : '匿名';

    const newMsg = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      content,
      nickname,
      timestamp: Date.now(),
      likes: 999,
      reactions: {},
      isLiked: false,
      colorIndex: Math.floor(Math.random() * this.colors.length),
      rotation: parseFloat((Math.random() * 6 - 3).toFixed(1)),
    };

    this.messages.push(newMsg);
    this.saveToStorage();

    // 在最前面插入新便签（不全部重渲染）
    const noteEl = this.createNoteElement(newMsg);
    noteEl.style.animationDelay = '0ms';
    if (this.wall.firstChild && this.wall.firstChild.classList.contains('msg-empty')) {
      this.wall.innerHTML = '';
    }
    this.wall.insertBefore(noteEl, this.wall.firstChild);

    // 清空输入
    textarea.value = '';
    // 刷新首页预览卡片
    this.showRandomPreview();
  }

  toggleLike(id) {
    const msg = this.messages.find(m => m.id === id);
    if (!msg) return;

    if (msg.isLiked) {
      msg.isLiked = false;
      msg.likes = Math.max(0, (msg.likes || 0) - 1);
    } else {
      msg.isLiked = true;
      msg.likes = (msg.likes || 0) + 1;
    }
    this.saveToStorage();
    this.renderMessages(); // 简单起见全量重渲染
  }

  addReaction(id, emoji) {
    const msg = this.messages.find(m => m.id === id);
    if (!msg) return;
    if (!msg.reactions) msg.reactions = {};
    msg.reactions[emoji] = (msg.reactions[emoji] || 0) + 1;
    this.saveToStorage();
    this.renderMessages();
  }

  enterEditMode(div, msg) {
    const textEl = div.querySelector('.msg-text');
    if (!textEl) return;

    const currentText = msg.content;
    textEl.innerHTML = `
      <textarea class="msg-edit-area" rows="3">${this.escapeHtml(currentText)}</textarea>
      <div class="msg-edit-actions">
        <button class="msg-edit-btn cancel">取消</button>
        <button class="msg-edit-btn primary confirm">保存</button>
      </div>
    `;

    const textareaEl = textEl.querySelector('.msg-edit-area');
    const cancelBtn = textEl.querySelector('.cancel');
    const confirmBtn = textEl.querySelector('.confirm');

    textareaEl.focus();

    cancelBtn.addEventListener('click', () => this.renderMessages());
    confirmBtn.addEventListener('click', () => {
      const newContent = textareaEl.value.trim();
      if (newContent && newContent !== currentText) {
        msg.content = newContent;
        this.saveToStorage();
      }
      this.renderMessages();
    });
  }

  confirmDelete(id) {
    const dlg = document.createElement('div');
    dlg.className = 'msg-confirm-dlg show';
    dlg.innerHTML = `
      <div class="msg-confirm-box">
        <p>确定要删除这条留言吗？</p>
        <div class="msg-confirm-btns">
          <button class="msg-confirm-btn cancel">取消</button>
          <button class="msg-confirm-btn danger">删除</button>
        </div>
      </div>
    `;
    document.body.appendChild(dlg);

    dlg.querySelector('.cancel').addEventListener('click', () => dlg.remove());
    dlg.querySelector('.danger').addEventListener('click', () => {
      this.deleteMessage(id);
      dlg.remove();
    });
    dlg.addEventListener('click', (e) => {
      if (e.target === dlg) dlg.remove();
    });
  }

  deleteMessage(id) {
    this.messages = this.messages.filter(m => m.id !== id);
    this.saveToStorage();
    this.renderMessages();
  }

  // ============================
  // 工具方法
  // ============================

  escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  formatTime(ts) {
    const d = new Date(ts);
    const pad = n => String(n).padStart(2, '0');
    return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
}

// 全局实例
let messageBoard = null;

function initMessageBoard() {
  if (!messageBoard) messageBoard = new MessageBoard();
  messageBoard.init();
  return messageBoard;
}
