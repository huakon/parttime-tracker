/**
 * API 数据获取模块
 * 负责与后端 API 交互，获取和处理数据
 */

/**
 * 获取假期列表
 */
async function fetchVacationList() {
    try {
        const res = await fetch('vacation/api.php?action=list');
        const js = await res.json();
        if(js.ok && js.vacations){
            return js.vacations.map(v=>{
                return {
                    start: new Date(v.start_date+'T00:00:00'),
                    end: new Date(v.end_date+'T23:59:59')
                };
            });
        }
    } catch(e){}
    return [];
}

/**
 * 判断指定日期是否在假期里
 */
function isInVacation(date, vacations){
    return vacations.some(v=>{
        return date >= v.start && date <= v.end;
    });
}

/**
 * 获取过去7天的工作时长（分钟）
 */
async function getPast7DaysMinutes(dateYMD) {
  try {
    const d = new Date(dateYMD + 'T00:00:00');

    const start = new Date(d);
    start.setDate(start.getDate() - 6);
    const startYMD = start.toISOString().slice(0, 10);

    const url = `${window.APP.apiBase}?action=get_range&start=${startYMD}&end=${dateYMD}`;

    const res = await fetch(url);
    if (!res.ok) return 0;

    const js = await res.json();
    if (!js.ok) return 0;

    return parseInt(js.total_minutes || 0, 10);

  } catch (err) {
    return 0;
  }
}

/**
 * 加载指定日期的工作记录并在表格中显示
 * @param {string} ymd 日期 (Y-m-d 格式)
 */
async function loadDay(ymd){
  try {
    const res = await fetch(`${window.APP.apiBase}?action=get_day&date=`+ymd);
    const js = await res.json();
    const tbody = document.querySelector('#entriesTable tbody');
    if(!tbody) return;
    
    while(tbody.firstChild) tbody.removeChild(tbody.firstChild);
    
    let minutes = 0; let income = 0;
    js.rows.forEach(r=>{
      const s = r.start; const e = r.end; const br = parseInt(r.break_min);
      const row = document.createElement('tr');
      const [sh,sm]=s.split(':').map(Number); const [eh,em]=e.split(':').map(Number);
      let diff = (eh*60+em) - (sh*60+sm); if (diff<0) diff+=24*60;
      let work = Math.max(0, diff - br);
      minutes += work;
      income += (work/60.0) * parseFloat(r.hourly);
      
      const companyName = r.company || '';
      const logoUrl = companyName ? (window.APP.companyLogos[companyName] || '') : '';
      
      const timeCell = document.createElement('td');
      if(logoUrl) {
        const img = document.createElement('img');
        img.src = logoUrl;
        img.style.cssText = 'height:20px;margin-right:4px;vertical-align:middle;';
        img.title = companyName;
        img.onerror = function() { this.style.display='none'; };
        timeCell.appendChild(img);
      }
      const timeText = document.createTextNode(`${s} - ${e}${companyName && !logoUrl ? ' (' + companyName + ')' : ''}`);
      timeCell.appendChild(timeText);
      row.appendChild(timeCell);
      
      const breakCell = document.createElement('td');
      breakCell.textContent = br;
      row.appendChild(breakCell);
      
      const workCell = document.createElement('td');
      workCell.textContent = work + ' 分';
      row.appendChild(workCell);
      
      const incomeCell = document.createElement('td');
      incomeCell.textContent = '￥' + ((work/60.0)*parseFloat(r.hourly)).toFixed(2);
      row.appendChild(incomeCell);
      
      const actionCell = document.createElement('td');
      const editBtn = document.createElement('button');
      editBtn.className = 'btn small';
      editBtn.textContent = '编辑';
      editBtn.onclick = () => editEntry(r.id);
      actionCell.appendChild(editBtn);
      
      const delBtn = document.createElement('button');
      delBtn.className = 'btn small';
      delBtn.textContent = '删除';
      delBtn.onclick = () => delEntry(r.id);
      actionCell.appendChild(delBtn);
      row.appendChild(actionCell);
      
      tbody.appendChild(row);
    });
    document.getElementById('day_work').textContent = minutes + ' 分';
    document.getElementById('day_income').textContent = income.toFixed(2);
  } catch(e) {}
}

/**
 * 加载当月的统计信息：总工时、收入、平均每天工时和收入
 * 在页面底部显示统计摘要
 */
async function loadCurrentMonthStats(){
    try {
        // 获取当前年月
        const year = window.currentYear || new Date().getFullYear();
        const month = window.currentMonth !== undefined ? window.currentMonth : new Date().getMonth();
        
        // 计算当月第一天和最后一天
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const start = firstDay.toISOString().slice(0, 10);
        const end = lastDay.toISOString().slice(0, 10);
        
        const res = await fetch(`${window.APP.apiBase}?action=get_range&start=${start}&end=${end}`);
        const js = await res.json();
        if(!js.ok) {
            document.getElementById('monthStats').innerText = '加载统计数据失败';
            return;
        }
        
        const totalMinutes = js.total_minutes || 0;
        const totalIncome = js.total_income || 0;
        const totalHours = (totalMinutes / 60).toFixed(2);
        const daysInMonth = lastDay.getDate();
        const avgHoursPerDay = (totalMinutes / 60 / daysInMonth).toFixed(2);
        const avgIncomePerDay = (totalIncome / daysInMonth).toFixed(2);
        
        const monthName = `${year}年${month + 1}月`;
        document.getElementById('monthStats').innerHTML = `
            <strong>${monthName}统计：</strong>
            工作时间 ${totalHours} 小时 | 
            收入 ¥${totalIncome.toFixed(2)} | 
            平均每天 ${avgHoursPerDay} 小时 | 
            平均收入 ¥${avgIncomePerDay}/天
        `;
    } catch(e) {
        document.getElementById('monthStats').innerText = '统计数据加载失败';
    }
}

const loadLast7Days = loadCurrentMonthStats;