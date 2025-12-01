// =============== 移动端优化 ===============
// 负责移动端的手势控制、响应式调整和UI优化

class MobileOptimizer {
  constructor() {
    this.setupSwipeGestures();
    this.optimizeClickTargets();
    this.optimizeModals();
  }

  setupSwipeGestures() {
  }

  optimizeClickTargets() {
    // 仅在移动设备上增大可点元素的点击区域（至少 44x44px）
    if (!document.body.classList.contains('mobile')) return;

    // 增大所有按钮的点击区域
    const buttons = document.querySelectorAll('button, [role="button"]');
    buttons.forEach(btn => {
      if (btn.offsetHeight < 44) {
        btn.style.padding = '12px 16px';
        btn.style.minHeight = '44px';
        btn.style.minWidth = '44px';
      }
    });

    // 增大表单输入框的高度
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      if (input.offsetHeight < 44) {
        input.style.padding = '12px';
        input.style.minHeight = '44px';
      }
    });
  }

  optimizeModals() {
    // 在移动设备上使用全屏模态框
    if (!document.body.classList.contains('mobile')) return;

    const modals = document.querySelectorAll('.modal, [class*="Modal"]');
    modals.forEach(modal => {
      const inner = modal.querySelector('[class*="Inner"]') || modal.firstElementChild;
      if (inner) {
        inner.style.cssText = `
          width: 100vw !important;
          max-width: 100vw !important;
          height: auto !important;
          max-height: calc(100vh - 48px) !important;
          border-radius: 8px !important;
          padding: 12px !important;
          overflow-y: auto !important;
          box-sizing: border-box;
        `;

        // 查找并放大关闭按钮
        let closeBtn = null;
        const allButtons = inner.querySelectorAll('button');
        for (let i = 0; i < allButtons.length; i++) {
          const b = allButtons[i];
          const cls = (b.className || '').toLowerCase();
          const id = (b.id || '').toLowerCase();
          const txt = (b.textContent || '').trim();
          if (cls.includes('close') || id.includes('close') || txt === '关闭' || txt.includes('关闭')) {
            closeBtn = b;
            break;
          }
        }
        if (closeBtn) {
          closeBtn.style.minHeight = '44px';
          closeBtn.style.minWidth = '44px';
        }
      }
    });

    // 优化表单间距
    const forms = document.querySelectorAll('form, .modalInner');
    forms.forEach(form => {
      form.style.rowGap = '12px';
    });
  }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  window.mobileOptimizer = new MobileOptimizer();
});
