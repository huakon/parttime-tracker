// =============== 数据导入功能 ===============
// 负责CSV和Excel文件的导入

class DataImportManager {
  constructor() {
    this.createImportPanel();
  }

  createImportPanel() {
    const header = document.querySelector('.header');
    if (!header) return;

    const importPanel = document.createElement('div');
    importPanel.id = 'importPanel';
    importPanel.style.cssText = `
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
      min-width: 280px;
    `;

    importPanel.innerHTML = `
      <div style="font-weight: 600; margin-bottom: 12px;">📥 数据导入</div>
      
      <div style="margin-bottom: 12px;">
        <label style="font-size: 12px; color: var(--muted); display: block; margin-bottom: 4px;">
          选择 CSV 或 Excel 文件
        </label>
        <input id="importFile" type="file" accept=".csv,.xlsx,.xls" 
          style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid #ddd; box-sizing: border-box;">
      </div>

      <div style="margin-bottom: 12px;">
        <label style="font-size: 12px; color: var(--muted); display: block; margin-bottom: 4px;">
          <input id="importMerge" type="checkbox"> 合并导入（不覆盖现有数据）
        </label>
      </div>

      <button id="importStartBtn" class="btn small" style="width: 100%; margin-bottom: 8px;">开始导入</button>
      
      <div id="importStatus" style="display: none; padding: 8px; background: #f0f0f0; border-radius: 6px; font-size: 12px;">
        <div id="importMessage"></div>
        <div id="importProgress" style="margin-top: 6px; display: none;">
          <div style="background: #ddd; height: 4px; border-radius: 2px; overflow: hidden;">
            <div id="importProgressBar" style="width: 0%; height: 100%; background: var(--accent); transition: width 0.3s;"></div>
          </div>
        </div>
      </div>

      <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #f0f0f0; font-size: 12px; color: var(--muted);">
        <strong>文件格式要求：</strong>
        <div>CSV 列: date, start, end, break_min, hourly, company, note</div>
        <div>示例: 2024-11-20, 08:30, 17:00, 60, 150, ABC公司, 无休息</div>
      </div>
    `;

    document.body.appendChild(importPanel);

    document.getElementById('importStartBtn').onclick = () => this.handleImport();

    // 关闭导入面板
    document.addEventListener('click', (e) => {
      if (!importPanel.contains(e.target)) {
        importPanel.style.display = 'none';
      }
    });

    // 暴露方法供菜单调用
    window.openImportPanel = () => {
      importPanel.style.display = (importPanel.style.display === 'none' || importPanel.style.display === '') ? 'block' : 'none';
    };
  }

  async handleImport() {
    const fileInput = document.getElementById('importFile');
    const file = fileInput.files[0];

    if (!file) {
      showNotification('请选择文件', 'error');
      return;
    }

    const merge = document.getElementById('importMerge').checked;
    const statusDiv = document.getElementById('importStatus');
    const messageDiv = document.getElementById('importMessage');
    const progressDiv = document.getElementById('importProgress');
    const progressBar = document.getElementById('importProgressBar');

    statusDiv.style.display = 'block';
    progressDiv.style.display = 'block';
    messageDiv.textContent = '正在读取文件...';
    progressBar.style.width = '10%';

    try {
      const text = await file.text();
      messageDiv.textContent = '正在解析数据...';
      progressBar.style.width = '30%';

      // 解析 CSV
      const entries = this.parseCSV(text);

      if (entries.length === 0) {
        messageDiv.textContent = '❌ 未找到有效的数据行';
        progressBar.style.width = '100%';
        return;
      }

      messageDiv.textContent = `🔍 已识别 ${entries.length} 条记录，正在导入...`;
      progressBar.style.width = '50%';

      // 逐条导入
      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < entries.length; i++) {
        try {
          const entry = entries[i];
          
          // 验证数据
          if (!entry.date || !entry.start || !entry.end) {
            failCount++;
            continue;
          }

          // 发送到 API
          const resp = await fetch(window.APP.apiBase, {
            method: 'POST',
            body: new URLSearchParams({
              action: 'add_entry',
              csrf_token: getCsrfToken(),
              date: entry.date,
              start: entry.start,
              end: entry.end,
              break_min: entry.break_min || 0,
              hourly: entry.hourly || 0,
              company: entry.company || '',
              note: entry.note || ''
            })
          });

          const result = await resp.json();
          if (result.ok) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (e) {
          failCount++;
        }

        // 更新进度
        const progress = 50 + (i / entries.length) * 50;
        progressBar.style.width = progress + '%';
      }

      messageDiv.textContent = `✅ 导入完成：成功 ${successCount} 条，失败 ${failCount} 条`;
      progressBar.style.width = '100%';

      // 刷新显示
      setTimeout(() => {
        try {
          window.loadCalendar(window.currentYear, window.currentMonth);
          window.renderMobileList(window.currentYear, window.currentMonth);
        } catch (e) { }
        showNotification(`已导入 ${successCount} 条工作记录`, 'success');
      }, 500);

    } catch (e) {
      messageDiv.textContent = `❌ 导入失败: ${e.message}`;
      showNotification('导入失败: ' + e.message, 'error');
    }
  }

  parseCSV(text) {
    const lines = text.split('\n').filter(line => line.trim());
    const entries = [];

    // 跳过标题行
    let startIndex = 0;
    if (lines[0] && (lines[0].includes('date') || lines[0].includes('开始'))) {
      startIndex = 1;
    }

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // 解析 CSV 行
      const parts = line.split(',').map(p => p.trim());

      if (parts.length >= 3) {
        entries.push({
          date: parts[0],
          start: parts[1],
          end: parts[2],
          break_min: parts[3] ? parseInt(parts[3]) : 0,
          hourly: parts[4] ? parseFloat(parts[4]) : 0,
          company: parts[5] || '',
          note: parts[6] || ''
        });
      }
    }

    return entries;
  }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  window.dataImportManager = new DataImportManager();
});
