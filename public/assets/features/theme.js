// theme.js - 主题定制系统（黑暗模式、配色方案、字体大小）

class ThemeManager {
  constructor() {
    this.themes = {
      light: {
        name: '浅色',
        colors: {
          bg: '#f7f7fb',
          card: '#ffffff',
          accent: '#0a84ff',
          text: '#222',
          muted: '#6b6b6b',
          danger: '#ff3b30'
        }
      },
      dark: {
        name: '深色',
        colors: {
          bg: '#1a1a1a',
          card: '#2d2d2d',
          accent: '#0a84ff',
          text: '#f0f0f0',
          muted: '#999',
          danger: '#ff3b30'
        }
      },
      ocean: {
        name: '海洋蓝',
        colors: {
          bg: '#e8f4f8',
          card: '#ffffff',
          accent: '#0066cc',
          text: '#003366',
          muted: '#666',
          danger: '#e74c3c'
        }
      },
      forest: {
        name: '森林绿',
        colors: {
          bg: '#f0f8f4',
          card: '#ffffff',
          accent: '#27ae60',
          text: '#1a3a2a',
          muted: '#666',
          danger: '#e74c3c'
        }
      },
      sunset: {
        name: '日落橙',
        colors: {
          bg: '#fef5f0',
          card: '#ffffff',
          accent: '#e67e22',
          text: '#333',
          muted: '#666',
          danger: '#c0392b'
        }
      }
    };

    this.fontSizes = {
      small: { label: '小', factor: 0.9 },
      normal: { label: '正常', factor: 1 },
      large: { label: '大', factor: 1.15 },
      xlarge: { label: '特大', factor: 1.35 }
    };

    this.currentTheme = localStorage.getItem('theme') || 'light';
    this.currentFontSize = localStorage.getItem('fontSize') || 'normal';
    
    this.init();
  }

  init() {
    this.applyTheme();
    this.applyFontSize();
    this.createThemePanel();
  }

  applyTheme(themeName = this.currentTheme) {
    const theme = this.themes[themeName];
    if (!theme) return;

    const root = document.documentElement;
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });

    localStorage.setItem('theme', themeName);
    this.currentTheme = themeName;
    document.body.classList.toggle('dark-mode', themeName === 'dark');
  }

  applyFontSize(sizeKey = this.currentFontSize) {
    const fontSize = this.fontSizes[sizeKey];
    if (!fontSize) return;

    const root = document.documentElement;
    root.style.setProperty('--font-size-factor', fontSize.factor);
    
    localStorage.setItem('fontSize', sizeKey);
    this.currentFontSize = sizeKey;
  }

  createThemePanel() {
    // 检查是否已存在面板
    if (document.getElementById('themePanel')) return;

    // 创建主题面板按钮
    const header = document.querySelector('.header');
    if (!header) return;

    const themePanel = document.createElement('div');
    themePanel.id = 'themePanel';
    themePanel.style.cssText = `
      position: fixed;
      right: 20px;
      top: 60px;
      background: var(--card);
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      display: none;
      min-width: 220px;
    `;

    let panelHTML = `
      <div style="margin-bottom: 16px;">
        <div style="font-weight: 600; margin-bottom: 8px;">配色方案</div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
    `;

    Object.entries(this.themes).forEach(([key, theme]) => {
      panelHTML += `
        <button class="theme-option-btn" data-theme="${key}" 
          style="padding: 8px; border-radius: 6px; border: ${this.currentTheme === key ? '2px solid var(--accent)' : '1px solid #ddd'}; 
          background: linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.bg}); 
          cursor: pointer; font-size: 12px; font-weight: 500;"
        >${theme.name}</button>
      `;
    });

    panelHTML += `
        </div>
      </div>
      <div>
        <div style="font-weight: 600; margin-bottom: 8px;">字体大小</div>
        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
    `;

    Object.entries(this.fontSizes).forEach(([key, size]) => {
      panelHTML += `
        <button class="font-size-btn" data-size="${key}"
          style="padding: 6px 10px; border-radius: 6px; border: ${this.currentFontSize === key ? '2px solid var(--accent)' : '1px solid #ddd'}; 
          background: var(--card); cursor: pointer; font-size: 12px; font-weight: ${this.currentFontSize === key ? '600' : '400'};"
        >${size.label}</button>
      `;
    });

    panelHTML += `
        </div>
      </div>
    `;

    themePanel.innerHTML = panelHTML;
    document.body.appendChild(themePanel);

    // 配色方案切换
    themePanel.querySelectorAll('.theme-option-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const themeName = e.target.getAttribute('data-theme');
        this.applyTheme(themeName);
        
        // 更新按钮样式
        themePanel.querySelectorAll('.theme-option-btn').forEach(b => {
          b.style.border = themeName === b.getAttribute('data-theme') ? '2px solid var(--accent)' : '1px solid #ddd';
        });
      });
    });

    // 字体大小切换
    themePanel.querySelectorAll('.font-size-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const sizeKey = e.target.getAttribute('data-size');
        this.applyFontSize(sizeKey);
        
        // 更新按钮样式
        themePanel.querySelectorAll('.font-size-btn').forEach(b => {
          const isSelected = sizeKey === b.getAttribute('data-size');
          b.style.border = isSelected ? '2px solid var(--accent)' : '1px solid #ddd';
          b.style.fontWeight = isSelected ? '600' : '400';
        });
      });
    });

    // 点击外部关闭
    document.addEventListener('click', (e) => {
      if (!themePanel.contains(e.target)) {
        themePanel.style.display = 'none';
      }
    });

    // 暴露打开方法供操作菜单调用
    window.openThemePanel = () => {
      themePanel.style.display = (themePanel.style.display === 'none' || themePanel.style.display === '') ? 'block' : 'none';
    };
  }

  exportSettings() {
    return {
      theme: this.currentTheme,
      fontSize: this.currentFontSize
    };
  }

  importSettings(settings) {
    if (settings.theme) this.applyTheme(settings.theme);
    if (settings.fontSize) this.applyFontSize(settings.fontSize);
  }
}

// 初始化主题管理器：若脚本晚于 DOMContentLoaded 加载，仍确保立即初始化
(function(){
  const init = () => { try { window.themeManager = new ThemeManager(); } catch(e){ } };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
