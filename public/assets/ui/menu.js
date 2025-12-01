// =============== 菜单控制 ===============
// 负责顶部菜单的下拉和响应式溢出控制

document.addEventListener('DOMContentLoaded', () => {
  const mainToggle = document.getElementById('topMenuMain');
  const mainDropdown = document.getElementById('topMenuMainDropdown');
  const actionsToggle = document.getElementById('topMenuActions');
  const actionsDropdown = document.getElementById('topMenuActionsDropdown');

  // 主菜单下拉控制
  if (mainToggle && mainDropdown) {
    mainToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      mainDropdown.style.display = (mainDropdown.style.display === 'block') ? 'none' : 'block';
    });
  }

  // 操作菜单下拉控制
  if (actionsToggle && actionsDropdown) {
    actionsToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      actionsDropdown.style.display = (actionsDropdown.style.display === 'block') ? 'none' : 'block';
    });
  }

  // 点击任意处收起所有下拉
  document.addEventListener('click', () => {
    if (mainDropdown) mainDropdown.style.display = 'none';
    if (actionsDropdown) actionsDropdown.style.display = 'none';
  });

  // 绑定内置功能到新菜单项
  bindMenuActions();
  
  // 设置响应式溢出菜单
  setupHeaderOverflow();
});

/**
 * 绑定菜单按钮的点击事件
 */
function bindMenuActions() {
  const menuExportCSV = document.getElementById('menuExportCSV');
  const menuExportXLSX = document.getElementById('menuExportXLSX');
  const menuExportPDF = document.getElementById('menuExportPDF');
  const menuStats = document.getElementById('menuStats');
  const menuVacation = document.getElementById('menuVacation');
  const menuLogo = document.getElementById('menuLogo');
  const menuSearch = document.getElementById('menuSearch');
  const menuTheme = document.getElementById('menuTheme');
  const menuImport = document.getElementById('menuImport');
  const menuShortcuts = document.getElementById('menuShortcuts');
  
  const actionsDropdown = document.getElementById('topMenuActionsDropdown');
  const mainDropdown = document.getElementById('topMenuMainDropdown');

  if (menuExportCSV) menuExportCSV.addEventListener('click', () => {
    doExportCurrentMonthCSV();
    if (actionsDropdown) actionsDropdown.style.display = 'none';
  });
  
  if (menuExportXLSX) menuExportXLSX.addEventListener('click', () => {
    doExportCurrentMonthXLSX();
    if (actionsDropdown) actionsDropdown.style.display = 'none';
  });
  
  if (menuExportPDF) menuExportPDF.addEventListener('click', () => {
    doExportCurrentMonthPDF();
    if (actionsDropdown) actionsDropdown.style.display = 'none';
  });

  if (menuStats) menuStats.addEventListener('click', () => {
    try {
      const m = document.getElementById('statsModal');
      if (m) m.style.display = 'flex';
    } catch (e) {}
    if (mainDropdown) mainDropdown.style.display = 'none';
  });
  
  if (menuVacation) menuVacation.addEventListener('click', () => {
    try {
      if (typeof showVacModal === 'function') {
        showVacModal();
      } else {
        const m = document.getElementById('vacModal');
        if (m) m.style.display = 'flex';
      }
    } catch (e) {}
    if (mainDropdown) mainDropdown.style.display = 'none';
  });
  
  if (menuLogo) menuLogo.addEventListener('click', () => {
    try {
      const m = document.getElementById('logoModal');
      if (m) m.style.display = 'flex';
    } catch (e) {}
    if (mainDropdown) mainDropdown.style.display = 'none';
  });

  if (menuSearch) menuSearch.addEventListener('click', (e) => {
    e.stopPropagation();
    let ok = false;
    try {
      if (typeof window.openSearchPanel === 'function') {
        window.openSearchPanel();
        ok = true;
      }
    } catch (e) {}
    if (!ok) {
      const p = document.getElementById('searchPanel');
      if (p) {
        p.style.display = (p.style.display === 'none' || p.style.display === '') ? 'block' : 'none';
        ok = true;
      }
    }
    if (!ok) {
      try {
        showNotification('搜索面板暂未就绪，请稍后再试', 'info');
      } catch (e) {}
    }
    if (actionsDropdown) actionsDropdown.style.display = 'none';
  });

  if (menuTheme) menuTheme.addEventListener('click', (e) => {
    e.stopPropagation();
    let ok = false;
    try {
      if (typeof window.openThemePanel === 'function') {
        window.openThemePanel();
        ok = true;
      }
    } catch (e) {}
    if (!ok) {
      const p = document.getElementById('themePanel');
      if (p) {
        p.style.display = (p.style.display === 'none' || p.style.display === '') ? 'block' : 'none';
        ok = true;
      }
    }
    if (!ok) {
      try {
        showNotification('主题面板暂未就绪，请稍后再试', 'info');
      } catch (e) {}
    }
    if (actionsDropdown) actionsDropdown.style.display = 'none';
  });

  if (menuImport) menuImport.addEventListener('click', (e) => {
    e.stopPropagation();
    let ok = false;
    try {
      if (typeof window.openImportPanel === 'function') {
        window.openImportPanel();
        ok = true;
      }
    } catch (e) {}
    if (!ok) {
      const p = document.getElementById('importPanel');
      if (p) {
        p.style.display = (p.style.display === 'none' || p.style.display === '') ? 'block' : 'none';
        ok = true;
      }
    }
    if (!ok) {
      try {
        showNotification('导入面板暂未就绪，请稍后再试', 'info');
      } catch (e) {}
    }
    if (actionsDropdown) actionsDropdown.style.display = 'none';
  });

  if (menuShortcuts) menuShortcuts.addEventListener('click', (e) => {
    e.stopPropagation();
    let ok = false;
    try {
      if (typeof window.openShortcutsPanel === 'function') {
        window.openShortcutsPanel();
        ok = true;
      }
    } catch (e) {}
    if (!ok) {
      const p = document.getElementById('shortcutsHint');
      if (p) {
        p.style.display = (p.style.display === 'none' || p.style.display === '') ? 'block' : 'none';
        ok = true;
      }
    }
    if (!ok) {
      try {
        showNotification('快捷键面板暂未就绪，请稍后再试', 'info');
      } catch (e) {}
    }
    if (actionsDropdown) actionsDropdown.style.display = 'none';
  });
}

/**
 * 设置响应式溢出菜单（当屏幕太小时，将菜单项移到"更多"下拉）
 */
function setupHeaderOverflow() {
  const controls = document.querySelector('.controls');
  if (!controls) return;

  // 如果已创建则跳过
  if (document.getElementById('moreToggle')) return;

  const moreToggle = document.createElement('button');
  moreToggle.id = 'moreToggle';
  moreToggle.className = 'btn small';
  moreToggle.textContent = '更多 ▾';

  const moreDropdown = document.createElement('div');
  moreDropdown.id = 'moreDropdownOverflow';

  moreToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    moreDropdown.style.display = (moreDropdown.style.display === 'block') ? 'none' : 'block';
  });

  // 点击任意处收起更多菜单
  document.addEventListener('click', (e) => {
    if (!moreDropdown.contains(e.target) && e.target !== moreToggle) {
      moreDropdown.style.display = 'none';
    }
  });

  controls.appendChild(moreToggle);
  controls.appendChild(moreDropdown);

  function redistribute() {
    // 先把 moreDropdown 中的项放回 controls
    while (moreDropdown.firstChild) {
      controls.insertBefore(moreDropdown.firstChild, moreToggle);
    }

    // 若没有溢出则隐藏 moreToggle
    if (controls.scrollWidth <= controls.clientWidth) {
      moreToggle.style.display = 'none';
      moreDropdown.style.display = 'none';
      return;
    }

    // 否则显示 moreToggle 并把多余的项移动到 dropdown
    moreToggle.style.display = 'inline-block';
    while (controls.scrollWidth > controls.clientWidth && controls.children.length > 1) {
      const last = controls.children[controls.children.length - 2];
      if (!last || last.id === 'moreToggle') break;
      const wrapper = document.createElement('div');
      wrapper.className = 'item';
      wrapper.appendChild(last);
      moreDropdown.insertBefore(wrapper, moreDropdown.firstChild);
    }
  }

  // 初始分配与窗口大小变化时重排
  setTimeout(redistribute, 50);
  window.addEventListener('resize', () => setTimeout(redistribute, 60));
  
  // 监听内容变动
  const mo = new MutationObserver(() => setTimeout(redistribute, 60));
  mo.observe(controls, { childList: true, subtree: true });
}
