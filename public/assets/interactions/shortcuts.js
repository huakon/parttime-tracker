// shortcuts.js - 键盘快捷键和快速导航功能

class ShortcutsManager {
  constructor() {
    this.setupKeyboardShortcuts();
    this.createQuickNavigation();
    this.setupNetworkIndicator();
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // 当焦点在可编辑元素时，避免影响用户输入（除显式组合键外）
      const tag = (document.activeElement && document.activeElement.tagName) ? document.activeElement.tagName.toLowerCase() : '';
      const isEditable = (tag === 'input' || tag === 'textarea' || tag === 'select' || (document.activeElement && document.activeElement.isContentEditable));

      // Ctrl+S 保存
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        this.handleSaveShortcut();
      }

      // Esc 关闭弹窗
      if (e.key === 'Escape') {
        this.closeAllModals();
      }

      // 数字键快速导航（输入框聚焦时不生效）
      if (!isEditable && e.key >= '1' && e.key <= '9') {
        const dayNum = parseInt(e.key);
        const year = window.currentYear;
        const month = window.currentMonth;
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        if (dayNum <= daysInMonth) {
          const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
          try { window.openDay(date); } catch (err) { }
        }
      }

      // Ctrl+[ 上月, Ctrl+] 下月
      if ((e.ctrlKey || e.metaKey) && e.key === '[') {
        e.preventDefault();
        const prevBtn = document.getElementById('prevMonth');
        if (prevBtn) prevBtn.click();
      }

      if ((e.ctrlKey || e.metaKey) && e.key === ']') {
        e.preventDefault();
        const nextBtn = document.getElementById('nextMonth');
        if (nextBtn) nextBtn.click();
      }

      // Ctrl+Y 今日（避免浏览器保留快捷键 Ctrl+T 打开新标签）
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        const todayBtn = document.getElementById('todayBtn');
        if (todayBtn) todayBtn.click();
        else { try { showNotification('已跳转到今日', 'success'); } catch(err){} }
      }

      // Ctrl+E 打开操作菜单（原导出按钮已重构）
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        const actionsToggle = document.getElementById('topMenuActions');
        if (actionsToggle) actionsToggle.click();
      }

      // 编辑弹窗内：_ / + 切换前一天/后一天（避免在输入框中触发）
      const modalEl = document.getElementById('modal');
      const isModalOpen = modalEl && modalEl.style.display === 'flex';
      if (isModalOpen && !isEditable && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const dateInput = document.getElementById('d_date');
        if (dateInput && dateInput.value) {
          const moveDay = (delta) => {
            try {
              const cur = new Date(dateInput.value);
              if (isNaN(cur.getTime())) return;
              cur.setDate(cur.getDate() + delta);
              const y = cur.getFullYear();
              const m = String(cur.getMonth() + 1).padStart(2, '0');
              const d = String(cur.getDate()).padStart(2, '0');
              const next = `${y}-${m}-${d}`;
              if (typeof window.openDay === 'function') window.openDay(next);
            } catch(err) { }
          };

          // '_' 常见为 Shift + '-'；'+' 常见为 Shift + '='
          if (e.key === '_' || (e.key === '-' && e.shiftKey)) {
            e.preventDefault();
            moveDay(-1);
          } else if (e.key === '+' || (e.key === '=' && e.shiftKey)) {
            e.preventDefault();
            moveDay(1);
          }
        }
      }
    });
  }

  handleSaveShortcut() {
    const modal = document.getElementById('modal');
    if (modal && modal.style.display === 'flex') {
      const saveBtn = document.querySelector('.saveBtn');
      if (saveBtn) {
        // 触发保存事件
        try { 
          saveBtn.click(); 
          showNotification('快捷键保存成功', 'success');
        } catch (e) { }
      }
    } else {
      showNotification('没有打开的工作记录编辑框', 'info');
    }
  }

  closeAllModals() {
    const modals = ['modal', 'statsModal', 'vacModal', 'logoModal'];
    modals.forEach(id => {
      const el = document.getElementById(id);
      if (el && el.style.display === 'flex') {
        el.style.display = 'none';
      }
    });

    const dropdowns = document.querySelectorAll('[style*="display: block"]');
    dropdowns.forEach(el => {
      if (el.className.includes('Dropdown') || el.id.includes('Dropdown')) {
        el.style.display = 'none';
      }
    });
  }

  createQuickNavigation() {
    // 在月份导航旁添加日期选择器
    const monthNav = document.querySelector('.monthNav');
    if (!monthNav) return;

    const quickNav = document.createElement('div');
    quickNav.id = 'quickNav';
    quickNav.style.cssText = `
      display: flex;
      gap: 12px;
      align-items: center;
      flex-wrap: wrap;
      margin-left: 16px;
    `;

    const input = document.createElement('input');
    input.type = 'month';
    input.style.cssText = `
      padding: 6px 10px;
      border-radius: 6px;
      border: 1px solid #ddd;
      font-size: 13px;
      cursor: pointer;
      background: var(--card);
      color: var(--text);
    `;

    // 设置默认值为当前年月
    const now = new Date();
    input.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    input.addEventListener('change', (e) => {
      const [year, month] = e.target.value.split('-');
      window.currentYear = parseInt(year);
      window.currentMonth = parseInt(month) - 1;
      try { 
        window.loadCalendar(window.currentYear, window.currentMonth);
        window.renderMobileList(window.currentYear, window.currentMonth);
        showNotification(`已跳转到 ${year}年${month}月`, 'success');
      } catch (err) { }
    });

    // 本周按钮
    const thisWeekBtn = document.createElement('button');
    thisWeekBtn.className = 'btn small';
    thisWeekBtn.textContent = '本周';
    thisWeekBtn.onclick = () => {
      const today = new Date();
      const dayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1;
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - dayOfWeek);
      
      window.currentYear = weekStart.getFullYear();
      window.currentMonth = weekStart.getMonth();
      try {
        window.loadCalendar(window.currentYear, window.currentMonth);
        showNotification('已显示本周视图', 'success');
      } catch (err) { }
    };

    // 本月按钮
    const thisMonthBtn = document.createElement('button');
    thisMonthBtn.className = 'btn small';
    thisMonthBtn.textContent = '本月';
    thisMonthBtn.onclick = () => {
      const today = new Date();
      window.currentYear = today.getFullYear();
      window.currentMonth = today.getMonth();
      try {
        window.loadCalendar(window.currentYear, window.currentMonth);
        showNotification('已显示本月视图', 'success');
      } catch (err) { }
    };

    quickNav.appendChild(input);
    quickNav.appendChild(thisWeekBtn);
    quickNav.appendChild(thisMonthBtn);

    // 查找月份导航容器并添加快速导航
    const navContainer = document.querySelector('div[style*="justify-content: space-between"]');
    if (navContainer) {
      navContainer.appendChild(quickNav);
    }

    // 显示快捷键提示
    this.showShortcutsHint();
  }

  setupNetworkIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'networkIndicator';
    indicator.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      padding: 8px 12px;
      border-radius: 8px;
      background: #4caf50;
      color: white;
      font-size: 12px;
      font-weight: 600;
      z-index: 9998;
      display: none;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    `;

    document.body.appendChild(indicator);

    const updateNetworkStatus = () => {
      if (navigator.onLine) {
        indicator.textContent = '✓ 网络已连接';
        indicator.style.background = '#4caf50';
        indicator.style.display = 'block';
        setTimeout(() => {
          indicator.style.display = 'none';
        }, 3000);
      } else {
        indicator.textContent = '✗ 网络已断开';
        indicator.style.background = '#f44336';
        indicator.style.display = 'block';
      }
    };

    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);

    // 初始状态
    updateNetworkStatus();
  }

  showShortcutsHint() {
    const hint = document.createElement('div');
    hint.id = 'shortcutsHint';
    hint.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: var(--card);
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 12px 16px;
      font-size: 12px;
      z-index: 9997;
      max-width: 250px;
      display: none;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    `;

    hint.innerHTML = `
      <div style="font-weight: 600; margin-bottom: 8px;">⌨️ 快捷键</div>
      <div>Ctrl+S：保存</div>
      <div>Esc：关闭弹窗/菜单</div>
      <div>Ctrl+Y：今日</div>
      <div>Ctrl+[ / Ctrl+]：上月 / 下月</div>
      <div>Ctrl+E：打开“操作”菜单</div>
      <div>数字 1-9：跳转当月对应日期</div>
      <div>（编辑弹窗）_ / +：前一天 / 后一天</div>
      <div style="color:#888;margin-top:6px;">提示：输入框聚焦时不触发数字跳转；按「?」可开关此面板</div>
    `;

    document.body.appendChild(hint);

    // 按下 ? 显示快捷键
    document.addEventListener('keydown', (e) => {
      const tag = (document.activeElement && document.activeElement.tagName) ? document.activeElement.tagName.toLowerCase() : '';
      const isEditable = (tag === 'input' || tag === 'textarea' || tag === 'select' || (document.activeElement && document.activeElement.isContentEditable));
      if (!isEditable && (e.key === '?' || e.key === '？')) {
        hint.style.display = hint.style.display === 'none' ? 'block' : 'none';
      }
    });
  }
}

// 初始化快捷键管理器（兼容脚本加载时机）并暴露打开面板方法
(function(){
  const init = () => {
    try {
      if (!window.shortcutsManager) window.shortcutsManager = new ShortcutsManager();
      window.openShortcutsPanel = () => {
        let hint = document.getElementById('shortcutsHint');
        if (!hint) {
          try { window.shortcutsManager.showShortcutsHint(); hint = document.getElementById('shortcutsHint'); } catch(e){}
        }
        if (hint) {
          hint.style.display = (hint.style.display === 'none' || hint.style.display === '') ? 'block' : 'none';
        }
      };
    } catch(e){ }
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
