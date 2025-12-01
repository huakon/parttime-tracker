// visualizations.js - 高级数据可视化：热力图、时间线、甘特图、月度统计

class VisualizationManager {
  constructor() {
    this.monthlyStats = {};
  }

  /**
   * 生成日历热力图 - 显示每天的工作强度
   * @param {array} entries - 工作记录数组
   * @param {number} year - 年份
   * @param {number} month - 月份（0-11）
   */
  generateHeatmap(entries, year, month) {
    const container = document.createElement('div');
    container.id = 'calendarHeatmap';
    container.style.cssText = `
      margin: 16px 0;
      padding: 16px;
      background: linear-gradient(135deg, rgba(10,132,255,0.05), rgba(10,132,255,0.02));
      border-radius: 10px;
      border: 1px solid rgba(10,132,255,0.1);
    `;

    const title = document.createElement('div');
    title.style.cssText = 'font-weight: 600; margin-bottom: 12px; color: var(--text);';
    title.textContent = '📊 工作热力图';
    container.appendChild(title);

    // 计算每天的工作时间
    const dailyMinutes = {};
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayEntries = entries.filter(e => e.date === dateStr);
      const minutes = dayEntries.reduce((sum, e) => sum + this.getMinutes(e.start, e.end, e.break_min || 0), 0);
      dailyMinutes[day] = minutes;
    }

    const maxMinutes = Math.max(...Object.values(dailyMinutes), 480); // 默认最大8小时
    const heatmapGrid = document.createElement('div');
    heatmapGrid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 6px;
      margin-bottom: 12px;
    `;

    // 周一到周日
    const dayLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    const firstDay = new Date(year, month, 1).getDay();
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;

    // 添加周标题
    dayLabels.forEach(label => {
      const labelEl = document.createElement('div');
      labelEl.textContent = label;
      labelEl.style.cssText = 'text-align: center; font-weight: 600; font-size: 12px; padding: 4px; color: var(--muted);';
      heatmapGrid.appendChild(labelEl);
    });

    // 添加空白开始日期
    for (let i = 0; i < startOffset; i++) {
      const empty = document.createElement('div');
      empty.style.cssText = 'background: transparent;';
      heatmapGrid.appendChild(empty);
    }

    // 添加日期单元格
    for (let day = 1; day <= daysInMonth; day++) {
      const minutes = dailyMinutes[day] || 0;
      const intensity = minutes > 0 ? Math.min(minutes / maxMinutes, 1) : 0;
      
      const cell = document.createElement('div');
      cell.style.cssText = `
        padding: 8px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 12px;
        cursor: pointer;
        background: rgba(10, 132, 255, ${intensity * 0.8});
        color: ${intensity > 0.5 ? '#fff' : 'var(--text)'};
        border: 1px solid rgba(10, 132, 255, ${intensity * 0.3});
        transition: all 0.3s ease;
      `;
      
      cell.textContent = day;
      cell.title = `${minutes}分钟（${(minutes / 60).toFixed(1)}小时）`;
      
      cell.addEventListener('mouseover', () => {
        cell.style.transform = 'scale(1.1)';
        cell.style.boxShadow = '0 4px 12px rgba(10,132,255,0.3)';
      });
      
      cell.addEventListener('mouseout', () => {
        cell.style.transform = 'scale(1)';
        cell.style.boxShadow = 'none';
      });

      cell.addEventListener('click', () => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        try { window.openDay(dateStr); } catch (e) { }
      });

      heatmapGrid.appendChild(cell);
    }

    container.appendChild(heatmapGrid);

    // 图例
    const legend = document.createElement('div');
    legend.style.cssText = 'font-size: 12px; color: var(--muted); text-align: center;';
    legend.textContent = `工作时间分布 (最少: 0分钟 → 最多: ${(maxMinutes / 60).toFixed(1)}小时)`;
    container.appendChild(legend);

    return container;
  }

  /**
   * 生成甘特图 - 按公司显示工作分布
   * @param {array} entries - 工作记录数组
   */
  generateGanttChart(entries) {
    const container = document.createElement('div');
    container.id = 'ganttChart';
    container.style.cssText = `
      margin: 16px 0;
      padding: 16px;
      background: linear-gradient(135deg, rgba(76,175,80,0.05), rgba(76,175,80,0.02));
      border-radius: 10px;
      border: 1px solid rgba(76,175,80,0.1);
    `;

    const title = document.createElement('div');
    title.style.cssText = 'font-weight: 600; margin-bottom: 12px; color: var(--text);';
    title.textContent = '📈 工作分布甘特图';
    container.appendChild(title);

    // 按公司分组统计
    const companyData = {};
    entries.forEach(entry => {
      const company = entry.company || '未分类';
      if (!companyData[company]) {
        companyData[company] = 0;
      }
      companyData[company] += this.getMinutes(entry.start, entry.end, entry.break_min || 0);
    });

    // 排序
    const sorted = Object.entries(companyData).sort((a, b) => b[1] - a[1]);
    const totalMinutes = sorted.reduce((sum, [_, mins]) => sum + mins, 0);

    sorted.forEach(([company, minutes]) => {
      const percentage = (minutes / totalMinutes * 100).toFixed(1);
      const hours = (minutes / 60).toFixed(2);

      const row = document.createElement('div');
      row.style.cssText = `
        margin-bottom: 12px;
        display: flex;
        align-items: center;
        gap: 12px;
      `;

      const label = document.createElement('div');
      label.style.cssText = `
        min-width: 120px;
        font-size: 13px;
        font-weight: 500;
        color: var(--text);
        text-align: right;
      `;
      label.textContent = company;

      const barContainer = document.createElement('div');
      barContainer.style.cssText = `
        flex: 1;
        height: 24px;
        background: #f0f0f0;
        border-radius: 6px;
        overflow: hidden;
        position: relative;
      `;

      const bar = document.createElement('div');
      bar.style.cssText = `
        height: 100%;
        width: ${percentage}%;
        background: linear-gradient(90deg, #4caf50, #81c784);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 12px;
        font-weight: 600;
        transition: width 0.3s ease;
        min-width: ${percentage > 5 ? 'auto' : '0'};
      `;
      bar.textContent = percentage > 5 ? `${percentage}%` : '';
      barContainer.appendChild(bar);

      const stats = document.createElement('div');
      stats.style.cssText = `
        min-width: 100px;
        text-align: right;
        font-size: 12px;
        color: var(--muted);
      `;
      stats.textContent = `${hours}小时`;

      row.appendChild(label);
      row.appendChild(barContainer);
      row.appendChild(stats);
      container.appendChild(row);
    });

    return container;
  }

  /**
   * 生成时间线视图 - 按日期显示工作记录
   * @param {array} entries - 工作记录数组（按日期排序）
   */
  generateTimeline(entries) {
    const container = document.createElement('div');
    container.id = 'timeline';
    container.style.cssText = `
      margin: 16px 0;
      padding: 16px;
      background: linear-gradient(135deg, rgba(255,152,0,0.05), rgba(255,152,0,0.02));
      border-radius: 10px;
      border: 1px solid rgba(255,152,0,0.1);
    `;

    const title = document.createElement('div');
    title.style.cssText = 'font-weight: 600; margin-bottom: 12px; color: var(--text);';
    title.textContent = '📅 工作时间线';
    container.appendChild(title);

    // 按日期分组
    const byDate = {};
    entries.forEach(entry => {
      if (!byDate[entry.date]) {
        byDate[entry.date] = [];
      }
      byDate[entry.date].push(entry);
    });

    Object.entries(byDate).sort().reverse().slice(0, 14).forEach(([date, dayEntries]) => {
      const dayContainer = document.createElement('div');
      dayContainer.style.cssText = `
        margin-bottom: 12px;
        padding: 10px;
        background: var(--card);
        border-radius: 8px;
        border-left: 3px solid var(--accent);
      `;

      const dateHeader = document.createElement('div');
      dateHeader.style.cssText = 'font-weight: 600; font-size: 13px; color: var(--text); margin-bottom: 6px;';
      dateHeader.textContent = new Date(date + 'T00:00:00').toLocaleDateString('zh-CN', { weekday: 'short', month: 'short', day: 'numeric' });
      dayContainer.appendChild(dateHeader);

      let dayMinutes = 0;
      dayEntries.forEach(entry => {
        const minutes = this.getMinutes(entry.start, entry.end, entry.break_min || 0);
        dayMinutes += minutes;

        const entryEl = document.createElement('div');
        entryEl.style.cssText = 'font-size: 12px; color: var(--muted); margin: 4px 0; display: flex; justify-content: space-between;';
        entryEl.innerHTML = `
          <span>${entry.start} → ${entry.end} ${entry.company ? `@ ${entry.company}` : ''}</span>
          <span>${(minutes / 60).toFixed(2)}小时</span>
        `;
        dayContainer.appendChild(entryEl);
      });

      const dayTotal = document.createElement('div');
      dayTotal.style.cssText = 'font-size: 12px; font-weight: 600; color: var(--accent); margin-top: 6px; padding-top: 6px; border-top: 1px solid #f0f0f0;';
      dayTotal.textContent = `小计: ${(dayMinutes / 60).toFixed(2)}小时`;
      dayContainer.appendChild(dayTotal);

      container.appendChild(dayContainer);
    });

    return container;
  }

  /**
   * 生成月度汇总统计面板
   * @param {array} entries - 工作记录数组
   * @param {number} year - 年份
   * @param {number} month - 月份（0-11）
   */
  generateMonthlySummary(entries, year, month) {
    const container = document.createElement('div');
    container.id = 'monthlySummary';
    container.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 12px;
      margin-bottom: 16px;
    `;

    // 计算统计数据
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let totalMinutes = 0;
    let totalIncome = 0;
    let workDays = 0;
    const workDaySet = new Set();

    entries.forEach(entry => {
      const minutes = this.getMinutes(entry.start, entry.end, entry.break_min || 0);
      totalMinutes += minutes;
      totalIncome += entry.hourly ? (minutes / 60) * entry.hourly : 0;
      workDaySet.add(entry.date);
    });

    workDays = workDaySet.size;
    const avgHoursPerDay = workDays > 0 ? (totalMinutes / 60 / workDays).toFixed(2) : 0;

    const stats = [
      { label: '总工作时间', value: `${(totalMinutes / 60).toFixed(2)}小时`, icon: '⏱️' },
      { label: '总收入', value: `¥${totalIncome.toFixed(2)}`, icon: '💰' },
      { label: '工作天数', value: `${workDays}天`, icon: '📅' },
      { label: '日均时长', value: `${avgHoursPerDay}小时`, icon: '📊' }
    ];

    stats.forEach(stat => {
      const card = document.createElement('div');
      card.style.cssText = `
        padding: 16px;
        background: linear-gradient(135deg, var(--card), rgba(10,132,255,0.05));
        border-radius: 10px;
        border: 1px solid rgba(10,132,255,0.1);
        text-align: center;
      `;

      const icon = document.createElement('div');
      icon.textContent = stat.icon;
      icon.style.cssText = 'font-size: 24px; margin-bottom: 6px;';
      card.appendChild(icon);

      const label = document.createElement('div');
      label.textContent = stat.label;
      label.style.cssText = 'font-size: 12px; color: var(--muted); margin-bottom: 4px;';
      card.appendChild(label);

      const value = document.createElement('div');
      value.textContent = stat.value;
      value.style.cssText = 'font-size: 18px; font-weight: 600; color: var(--accent);';
      card.appendChild(value);

      container.appendChild(card);
    });

    return container;
  }

  /**
   * 年度统计趋势
   * @param {array} allEntries - 全年工作记录
   */
  generateYearlyTrend(allEntries) {
    const container = document.createElement('div');
    container.id = 'yearlyTrend';
    container.style.cssText = `
      margin: 16px 0;
      padding: 16px;
      background: linear-gradient(135deg, rgba(156,39,176,0.05), rgba(156,39,176,0.02));
      border-radius: 10px;
      border: 1px solid rgba(156,39,176,0.1);
    `;

    const title = document.createElement('div');
    title.style.cssText = 'font-weight: 600; margin-bottom: 12px; color: var(--text);';
    title.textContent = '📈 年度统计趋势';
    container.appendChild(title);

    // 按月份统计
    const monthlyData = {};
    for (let m = 0; m < 12; m++) {
      monthlyData[m] = { hours: 0, income: 0, days: new Set() };
    }

    allEntries.forEach(entry => {
      const entryDate = new Date(entry.date + 'T00:00:00');
      const monthIndex = entryDate.getMonth();
      const minutes = this.getMinutes(entry.start, entry.end, entry.break_min || 0);

      monthlyData[monthIndex].hours += minutes / 60;
      monthlyData[monthIndex].income += entry.hourly ? (minutes / 60) * entry.hourly : 0;
      monthlyData[monthIndex].days.add(entry.date);
    });

    const grid = document.createElement('div');
    grid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      gap: 8px;
    `;

    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    const maxHours = Math.max(...Object.values(monthlyData).map(m => m.hours), 100);

    months.forEach((month, index) => {
      const data = monthlyData[index];
      const percentage = Math.min(data.hours / maxHours * 100, 100);

      const monthCard = document.createElement('div');
      monthCard.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
      `;

      const bar = document.createElement('div');
      bar.style.cssText = `
        width: 100%;
        height: 80px;
        background: #f0f0f0;
        border-radius: 6px;
        position: relative;
        overflow: hidden;
        display: flex;
        align-items: flex-end;
      `;

      const fill = document.createElement('div');
      fill.style.cssText = `
        width: 100%;
        height: ${percentage}%;
        background: linear-gradient(180deg, #9c27b0, #ce93d8);
        transition: all 0.3s ease;
      `;
      bar.appendChild(fill);

      bar.title = `${month}: ${data.hours.toFixed(1)}小时, 收入¥${data.income.toFixed(2)}, ${data.days.size}天`;

      const label = document.createElement('div');
      label.textContent = month;
      label.style.cssText = 'font-size: 11px; text-align: center; color: var(--text);';

      monthCard.appendChild(bar);
      monthCard.appendChild(label);
      grid.appendChild(monthCard);
    });

    container.appendChild(grid);

    return container;
  }

  /**
   * 按公司统计年度收入对比
   * @param {array} allEntries - 全年工作记录
   */
  generateCompanyIncomeComparison(allEntries) {
    const container = document.createElement('div');
    container.id = 'companyComparison';
    container.style.cssText = `
      margin: 16px 0;
      padding: 16px;
      background: linear-gradient(135deg, rgba(233,30,99,0.05), rgba(233,30,99,0.02));
      border-radius: 10px;
      border: 1px solid rgba(233,30,99,0.1);
    `;

    const title = document.createElement('div');
    title.style.cssText = 'font-weight: 600; margin-bottom: 12px; color: var(--text);';
    title.textContent = '🏢 按公司收入统计';
    container.appendChild(title);

    // 按公司统计
    const companyStats = {};
    allEntries.forEach(entry => {
      const company = entry.company || '未分类';
      if (!companyStats[company]) {
        companyStats[company] = { hours: 0, income: 0 };
      }
      const minutes = this.getMinutes(entry.start, entry.end, entry.break_min || 0);
      companyStats[company].hours += minutes / 60;
      companyStats[company].income += entry.hourly ? (minutes / 60) * entry.hourly : 0;
    });

    const sorted = Object.entries(companyStats).sort((a, b) => b[1].income - a[1].income);

    sorted.forEach(([company, data], index) => {
      const row = document.createElement('div');
      row.style.cssText = `
        display: grid;
        grid-template-columns: 120px 1fr 100px;
        gap: 12px;
        align-items: center;
        padding: 12px;
        background: var(--card);
        border-radius: 8px;
        margin-bottom: 8px;
        border-left: 3px solid ${['#e91e63', '#2196f3', '#4caf50', '#ff9800', '#673ab7'][index % 5]};
      `;

      const nameEl = document.createElement('div');
      nameEl.style.cssText = 'font-weight: 600; font-size: 13px; color: var(--text);';
      nameEl.textContent = company;

      const barContainer = document.createElement('div');
      barContainer.style.cssText = `
        height: 24px;
        background: #f0f0f0;
        border-radius: 6px;
        overflow: hidden;
      `;

      const maxIncome = sorted[0]?.[1]?.income || 1;
      const percentage = (data.income / maxIncome * 100).toFixed(0);

      const bar = document.createElement('div');
      bar.style.cssText = `
        height: 100%;
        width: ${percentage}%;
        background: linear-gradient(90deg, #e91e63, #f06292);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 11px;
        font-weight: 600;
      `;
      bar.textContent = percentage > 5 ? `${percentage}%` : '';
      barContainer.appendChild(bar);

      const statsEl = document.createElement('div');
      statsEl.style.cssText = 'text-align: right; font-size: 12px;';
      statsEl.innerHTML = `
        <div style="font-weight: 600; color: var(--accent);">¥${data.income.toFixed(2)}</div>
        <div style="color: var(--muted); font-size: 11px;">${data.hours.toFixed(1)}小时</div>
      `;

      row.appendChild(nameEl);
      row.appendChild(barContainer);
      row.appendChild(statsEl);
      container.appendChild(row);
    });

    return container;
  }

  getMinutes(start, end, breakMin = 0) {
    const toMinutes = (t) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };
    return toMinutes(end) - toMinutes(start) - breakMin;
  }
}

// 初始化可视化管理器
window.visualizationManager = new VisualizationManager();
