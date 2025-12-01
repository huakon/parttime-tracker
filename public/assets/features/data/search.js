// search.js - 数据搜索和筛选功能

class SearchManager {
  constructor() {
    this.createSearchPanel();
  }

  createSearchPanel() {
    const header = document.querySelector('.header');
    if (!header) return;

    // 创建搜索面板
    const searchPanel = document.createElement('div');
    searchPanel.id = 'searchPanel';
    searchPanel.style.cssText = `
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
      min-width: 300px;
      max-width: 400px;
      max-height: 80vh;
      overflow-y: auto;
    `;

    searchPanel.innerHTML = `
      <div style="font-weight: 600; margin-bottom: 12px;">🔍 搜索和筛选</div>
      
      <div style="margin-bottom: 12px;">
        <label style="font-size: 12px; color: var(--muted); display: block; margin-bottom: 4px;">按公司名称</label>
        <input id="searchCompany" type="text" placeholder="输入公司名称..." 
          style="width: 100%; padding: 6px; border-radius: 6px; border: 1px solid #ddd; box-sizing: border-box;">
      </div>

      <div style="margin-bottom: 12px;">
        <label style="font-size: 12px; color: var(--muted); display: block; margin-bottom: 4px;">开始日期</label>
        <input id="searchStartDate" type="date" 
          style="width: 100%; padding: 6px; border-radius: 6px; border: 1px solid #ddd; box-sizing: border-box;">
      </div>

      <div style="margin-bottom: 12px;">
        <label style="font-size: 12px; color: var(--muted); display: block; margin-bottom: 4px;">结束日期</label>
        <input id="searchEndDate" type="date" 
          style="width: 100%; padding: 6px; border-radius: 6px; border: 1px solid #ddd; box-sizing: border-box;">
      </div>

      <div style="margin-bottom: 12px;">
        <label style="font-size: 12px; color: var(--muted); display: block; margin-bottom: 4px;">最小工作时长（小时）</label>
        <input id="searchMinHours" type="number" placeholder="0" min="0" step="0.5"
          style="width: 100%; padding: 6px; border-radius: 6px; border: 1px solid #ddd; box-sizing: border-box;">
      </div>

      <div style="margin-bottom: 12px;">
        <label style="font-size: 12px; color: var(--muted); display: block; margin-bottom: 4px;">最大工作时长（小时）</label>
        <input id="searchMaxHours" type="number" placeholder="999" min="0" step="0.5"
          style="width: 100%; padding: 6px; border-radius: 6px; border: 1px solid #ddd; box-sizing: border-box;">
      </div>

      <div style="display: flex; gap: 8px;">
        <button id="searchBtn" class="btn small" style="flex: 1;">搜索</button>
        <button id="clearSearchBtn" class="btn small" style="flex: 1;">清空</button>
      </div>

      <div id="searchResults" style="margin-top: 12px; display: none; padding-top: 12px; border-top: 1px solid #f0f0f0;">
        <div style="font-weight: 600; margin-bottom: 8px;">📋 搜索结果</div>
        <div id="searchResultsList"></div>
      </div>
    `;

    document.body.appendChild(searchPanel);

    document.getElementById('searchBtn').onclick = () => this.performSearch();
    document.getElementById('clearSearchBtn').onclick = () => this.clearSearch();

    // 关闭搜索面板
    document.addEventListener('click', (e) => {
      if (!searchPanel.contains(e.target)) {
        searchPanel.style.display = 'none';
      }
    });

    // 回车搜索
    ['searchCompany', 'searchStartDate', 'searchEndDate', 'searchMinHours', 'searchMaxHours'].forEach(id => {
      const el = document.getElementById(id);
      if (el && el.tagName === 'INPUT' && el.type !== 'date') {
        el.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') this.performSearch();
        });
      }
    });

    // 暴露打开方法供操作菜单调用
    window.openSearchPanel = () => {
      searchPanel.style.display = (searchPanel.style.display === 'none' || searchPanel.style.display === '') ? 'block' : 'none';
    };
  }

  async performSearch() {
    try {
      const company = document.getElementById('searchCompany').value.trim();
      const startDate = document.getElementById('searchStartDate').value;
      const endDate = document.getElementById('searchEndDate').value;
      const minHours = parseFloat(document.getElementById('searchMinHours').value) || 0;
      const maxHours = parseFloat(document.getElementById('searchMaxHours').value) || 999;

      // 获取所有数据
      const response = await fetch(window.APP.apiBase + '?action=get_all_entries');
      const result = await response.json();

      if (!result.ok) {
        showNotification('获取数据失败', 'error');
        return;
      }

      let entries = result.data || [];

      // 应用筛选
      entries = entries.filter(entry => {
        // 公司名称筛选
        if (company && !entry.company?.toLowerCase().includes(company.toLowerCase())) {
          return false;
        }

        // 日期范围筛选
        if (startDate && entry.date < startDate) return false;
        if (endDate && entry.date > endDate) return false;

        // 工作时长筛选
        const minutes = this.getMinutes(entry.start, entry.end, entry.break_min || 0);
        const hours = minutes / 60;
        if (hours < minHours || hours > maxHours) {
          return false;
        }

        return true;
      });

      // 显示结果
      this.displaySearchResults(entries, company, startDate, endDate);

    } catch (e) {
      showNotification('搜索出错: ' + e.message, 'error');
    }
  }

  displaySearchResults(entries, company, startDate, endDate) {
    const resultsDiv = document.getElementById('searchResults');
    const resultsList = document.getElementById('searchResultsList');

    // 统计信息
    let totalMinutes = 0;
    let totalIncome = 0;
    const companies = new Set();

    entries.forEach(entry => {
      const minutes = this.getMinutes(entry.start, entry.end, entry.break_min || 0);
      totalMinutes += minutes;
      totalIncome += entry.hourly ? (minutes / 60) * entry.hourly : 0;
      companies.add(entry.company || '未分类');
    });

    resultsList.innerHTML = `
      <div style="background: rgba(10,132,255,0.05); padding: 8px; border-radius: 6px; margin-bottom: 8px; font-size: 12px;">
        <div><strong>找到 ${entries.length} 条记录</strong></div>
        <div>总工作: ${(totalMinutes / 60).toFixed(2)}小时 | 收入: ¥${totalIncome.toFixed(2)}</div>
        <div>涉及公司: ${Array.from(companies).join(', ') || '无'}</div>
      </div>
      <div style="max-height: 300px; overflow-y: auto;">
    `;

    entries.slice(0, 20).forEach(entry => {
      const minutes = this.getMinutes(entry.start, entry.end, entry.break_min || 0);
      const hours = (minutes / 60).toFixed(2);
      const income = entry.hourly ? (minutes / 60) * entry.hourly : 0;

      resultsList.innerHTML += `
        <div style="padding: 6px; background: var(--card); border-radius: 4px; margin-bottom: 6px; border-left: 2px solid var(--accent); font-size: 12px; cursor: pointer;" 
          onclick="try { window.openDay('${entry.date}'); } catch(e) { }">
          <div style="font-weight: 600; color: var(--text);">${entry.date} ${entry.start}-${entry.end}</div>
          <div style="color: var(--muted);">${entry.company || '未分类'} · ${hours}小时 · ¥${income.toFixed(2)}</div>
          <div style="color: var(--muted); font-size: 11px;">备注: ${entry.note || '无'}</div>
        </div>
      `;
    });

    resultsList.innerHTML += '</div>';

    if (entries.length > 20) {
      resultsList.innerHTML += `<div style="text-align: center; padding: 8px; color: var(--muted); font-size: 12px;">还有 ${entries.length - 20} 条记录，请调整搜索条件</div>`;
    }

    resultsDiv.style.display = 'block';
  }

  clearSearch() {
    document.getElementById('searchCompany').value = '';
    document.getElementById('searchStartDate').value = '';
    document.getElementById('searchEndDate').value = '';
    document.getElementById('searchMinHours').value = '';
    document.getElementById('searchMaxHours').value = '';
    document.getElementById('searchResults').style.display = 'none';
    showNotification('已清空搜索条件', 'info');
  }

  getMinutes(start, end, breakMin = 0) {
    const toMinutes = (t) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };
    return toMinutes(end) - toMinutes(start) - breakMin;
  }
}

// 初始化搜索管理器：兼容脚本在 DOMContentLoaded 之后加载的情况
(function(){
  const init = () => { try { window.searchManager = new SearchManager(); } catch(e){ } };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
