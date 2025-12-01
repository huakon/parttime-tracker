// statistics.js - 统计功能模块
// 处理统计弹窗的打开/关闭、数据加载、图表渲染

let statsChartWork, statsChartIncome, statsChartCompany, statsChartWeekDays, statsChartWeekLimit;

/**
 * 初始化统计弹窗事件监听器
 */
function initStatsModal() {
  const closeStats = document.getElementById('closeStats');
  const statsModal = document.getElementById('statsModal');

  // 兼容老的 #statsBtn 与新的菜单按钮 #menuStats
  const openStats = (e) => {
    if(e && e.preventDefault) e.preventDefault();
    if(!statsModal) return;
    statsModal.style.display = 'flex';
    const today = new Date();
    const defaultMonth = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0');
    const picker = document.getElementById('statsMonthPicker');
    if(picker) picker.value = defaultMonth;
  };

  // 关闭统计弹窗
  if (closeStats) closeStats.onclick = () => { if(statsModal) statsModal.style.display = 'none'; };

  // 点击统计弹窗本身关闭（防止事件冒泡）
  statsModal.onclick = (e) => {
    if (e.target === statsModal) {
      statsModal.style.display = 'none';
    }
  };

  // 打开按钮绑定（支持旧 ID 和新菜单 ID）
  ['statsBtn','menuStats'].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.addEventListener('click', openStats);
  });

  // 加载统计数据
  const statsLoadBtn = document.getElementById('statsLoadBtn');
  if(statsLoadBtn) statsLoadBtn.onclick = loadStatsData;
}

/**
 * 加载统计数据
 * 根据选择的月份或日期范围从 API 获取数据，并调用渲染函数
 */
async function loadStatsData() {
  const monthPicker = document.getElementById('statsMonthPicker');
  const startDate = document.getElementById('statsStartDate');
  const endDate = document.getElementById('statsEndDate');

  let url = '../api.php?action=get_range';
  
  if (monthPicker.value) {
    const [year, month] = monthPicker.value.split('-');
    const monthStart = `${year}-${month}-01`;
    const lastDay = new Date(year, parseInt(month), 0).getDate();
    const monthEnd = `${year}-${month}-${lastDay}`;
    url += `&start=${monthStart}&end=${monthEnd}`;
  } else if (startDate.value && endDate.value) {
    url += `&start=${startDate.value}&end=${endDate.value}`;
  } else {
    showNotification('请选择月份或日期范围', 'error');
    return;
  }

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    if (!data.ok || !data.rows) {
      showNotification('加载失败：' + (data.error || '无数据'), 'error');
      return;
    }

    const rows = data.rows.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    if (rows.length === 0) {
      showNotification('该时间段没有工作记录', 'error');
      return;
    }

    renderStatsCharts(rows);
  } catch (error) {
    showNotification('加载统计数据出错: ' + error.message, 'error');
  }
}

/**
 * 渲染所有统计图表
 * @param {array} rows 工作记录数组
 * 图表包括：每日工作时间、每日收入、公司占比、每周工作天数、公司收入分布
 */
function renderStatsCharts(rows) {
  // ---- 每日工作时间（分钟计算，后转小时） ----
  const labels = rows.map(r => r.date);
  const workMinutes = rows.map(r => {
    const [sh, sm] = r.start.split(':').map(Number);
    const [eh, em] = r.end.split(':').map(Number);
    let diff = (eh * 60 + em) - (sh * 60 + sm);
    if (diff < 0) diff += 24 * 60;
    return diff - (parseInt(r.break_min) || 0);
  });
  
  const workData = workMinutes.map(m => (m / 60).toFixed(2));

  // ---- 每日收入 ----
  const incomeData = rows.map((r, i) => {
    const workHours = workMinutes[i] / 60;
    return (workHours * parseFloat(r.hourly || 0)).toFixed(2);
  });

  // ---- 公司占比（按工作时间） ----
  const companyHours = {};
  rows.forEach((r, i) => {
    if (r.company) {
      const hours = parseFloat(workData[i]) || 0;
      companyHours[r.company] = (companyHours[r.company] || 0) + hours;
    }
  });
  const companyLabels = Object.keys(companyHours);
  const companyData = Object.values(companyHours).map(h => h.toFixed(2));

  // ---- 每周工作天数 ----
  const weekDaysCount = {};
  rows.forEach(r => {
    const d = new Date(r.date);
    const weekNum = getWeekNumber(d);
    weekDaysCount[weekNum] = (weekDaysCount[weekNum] || 0) + 1;
  });
  const weekLabels = Object.keys(weekDaysCount);
  const weekData = Object.values(weekDaysCount);

  // ---- 按公司分类的收入 ----
  const companyIncomeCount = {};
  rows.forEach((r, i) => {
    const company = r.company || '无公司';
    const income = parseFloat(incomeData[i]) || 0;
    companyIncomeCount[company] = (companyIncomeCount[company] || 0) + income;
  });
  const companyIncomeLabels = Object.keys(companyIncomeCount);
  const companyIncomeData = Object.values(companyIncomeCount).map(v => parseFloat(v).toFixed(2));

  // ---- 平均每天工作时间 ----
  const avgDaily = rows.length ? (workData.reduce((a, b) => parseFloat(a) + parseFloat(b), 0) / rows.length).toFixed(2) : 0;
  document.getElementById('statsAvgWork').innerText = `平均每天工作时间：${avgDaily} 小时`;

  // ---------- 绘制图表 ----------
  const ctx1 = document.getElementById('statsChartWork');
  // 完全销毁旧图表并清理内存
  if(statsChartWork) {
    statsChartWork.destroy();
    statsChartWork = null;
  }
  statsChartWork = new Chart(ctx1, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: '工作时间 (小时)',
        data: workData,
        borderColor: '#007aff',
        backgroundColor: 'rgba(0,122,255,0.2)',
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 2.5,
      plugins: { legend: { display: true, labels: { font: { size: 11 } } } },
      interaction: { mode: 'index', intersect: false },
      scales: { y: { beginAtZero: true, ticks: { font: { size: 10 } } }, x: { ticks: { font: { size: 10 } } } }
    }
  });

  const ctx2 = document.getElementById('statsChartIncome');
  if(statsChartIncome) {
    statsChartIncome.destroy();
    statsChartIncome = null;
  }
  statsChartIncome = new Chart(ctx2, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: '收入 (¥)',
        data: incomeData,
        borderColor: '#ff9500',
        backgroundColor: 'rgba(255,149,0,0.2)',
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 2.5,
      plugins: { legend: { display: true, labels: { font: { size: 11 } } } },
      interaction: { mode: 'index', intersect: false },
      scales: { y: { beginAtZero: true, ticks: { font: { size: 10 } } }, x: { ticks: { font: { size: 10 } } } }
    }
  });

  const ctx3 = document.getElementById('statsChartCompany');
  if(statsChartCompany) {
    statsChartCompany.destroy();
    statsChartCompany = null;
  }
  statsChartCompany = new Chart(ctx3, {
    type: 'pie',
    data: {
      labels: companyLabels,
      datasets: [{
        label: '公司占比（工作时间）',
        data: companyData,
        backgroundColor: companyLabels.map((_, i) => `hsl(${i * 60},70%,50%)`)
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 1.5,
      plugins: { 
        legend: { position: 'bottom', labels: { font: { size: 11 } } },
        tooltip: {
          callbacks: {
            label: context => {
              const label = context.label || '';
              const value = parseFloat(context.raw) || 0;
              const total = context.dataset.data.reduce((a, b) => parseFloat(a) + parseFloat(b), 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${label}: ${value}小时 (${percentage}%)`;
            }
          }
        }
      }
    }
  });

  const ctx4 = document.getElementById('statsChartWeekDays');
  if(statsChartWeekDays) {
    statsChartWeekDays.destroy();
    statsChartWeekDays = null;
  }
  statsChartWeekDays = new Chart(ctx4, {
    type: 'bar',
    data: {
      labels: weekLabels,
      datasets: [{
        label: '工作天数',
        data: weekData,
        backgroundColor: '#34c759'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 2.5,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { font: { size: 10 } } }, x: { ticks: { font: { size: 10 } } } }
    }
  });

  const ctx5 = document.getElementById('statsChartWeekLimit');
  if(statsChartWeekLimit) {
    statsChartWeekLimit.destroy();
    statsChartWeekLimit = null;
  }
  statsChartWeekLimit = new Chart(ctx5, {
    type: 'pie',
    data: {
      labels: companyIncomeLabels,
      datasets: [{
        label: '公司收入分布 (¥)',
        data: companyIncomeData,
        backgroundColor: companyIncomeLabels.map((_, i) => `hsl(${i * 45},70%,60%)`)
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 1.5,
      plugins: {
        legend: { position: 'bottom', labels: { font: { size: 11 } } },
        tooltip: {
          callbacks: {
            label: context => `${context.label}: ¥${context.raw}`
          }
        }
      }
    }
  });

  // ========== 新增高级可视化 ==========
  if (window.visualizationManager) {
    // 提取年月信息
    const firstDate = rows[0]?.date ? new Date(rows[0].date + 'T00:00:00') : new Date();
    const year = firstDate.getFullYear();
    const month = firstDate.getMonth();

    // 清空可视化容器
    const monthlySummaryContainer = document.getElementById('monthlySummaryContainer');
    const heatmapContainer = document.getElementById('heatmapContainer');
    const timelineContainer = document.getElementById('timelineContainer');
    const ganttContainer = document.getElementById('ganttContainer');
    const yearlyTrendContainer = document.getElementById('yearlyTrendContainer');
    const companyComparisonContainer = document.getElementById('companyComparisonContainer');

    if (monthlySummaryContainer) {
      monthlySummaryContainer.innerHTML = '';
      monthlySummaryContainer.appendChild(window.visualizationManager.generateMonthlySummary(rows, year, month));
    }

    if (heatmapContainer) {
      heatmapContainer.innerHTML = '';
      heatmapContainer.appendChild(window.visualizationManager.generateHeatmap(rows, year, month));
    }

    if (timelineContainer) {
      timelineContainer.innerHTML = '';
      timelineContainer.appendChild(window.visualizationManager.generateTimeline(rows));
    }

    if (ganttContainer) {
      ganttContainer.innerHTML = '';
      ganttContainer.appendChild(window.visualizationManager.generateGanttChart(rows));
    }

    if (yearlyTrendContainer) {
      yearlyTrendContainer.innerHTML = '';
      // 获取全年数据用于年度趋势
      const allEntriesUrl = '../api.php?action=get_all_entries';
      fetch(allEntriesUrl)
        .then(res => res.json())
        .then(result => {
          if (result.ok && result.data) {
            yearlyTrendContainer.appendChild(window.visualizationManager.generateYearlyTrend(result.data));
          }
        })
        .catch(e => {});
    }

    if (companyComparisonContainer) {
      companyComparisonContainer.innerHTML = '';
      // 获取全年数据用于公司比较
      const allEntriesUrl = '../api.php?action=get_all_entries';
      fetch(allEntriesUrl)
        .then(res => res.json())
        .then(result => {
          if (result.ok && result.data) {
            companyComparisonContainer.appendChild(window.visualizationManager.generateCompanyIncomeComparison(result.data));
          }
        })
        .catch(e => {});
    }
  }
}

/**
 * 计算一年中指定日期的周数
 * @param {Date} d 日期对象
 * @return {number} 周数
 */
function getWeekNumber(d) {
  const onejan = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d - onejan) / 86400000) + onejan.getDay() + 1) / 7);
}

// 页面加载时初始化统计功能
document.addEventListener('DOMContentLoaded', () => {
  initStatsModal();
});
