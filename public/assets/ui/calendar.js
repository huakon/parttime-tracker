/**
 * 日历管理模块
 * 负责日历显示、日期选择和日期相关的交互
 */

let now = new Date();
let currentYear = now.getFullYear();
let currentMonth = now.getMonth();

/**
 * 加载指定月份的日历
 */
async function loadCalendar(y,m){
  try { window.currentYear = y; window.currentMonth = m; } catch(e){}
  document.getElementById('monthLabel').innerText = `${y}年${m+1}月`;
  const grid = document.getElementById('calendarGrid');
  grid.innerHTML = '';
  
  const start = new Date(y, m, 1);
  const end = new Date(y, m + 1, 0);
  const firstDay = start.getDay();
  
  for (let i = 0; i < 42; i++) {
    const card = document.createElement('div');
    card.className = 'daycard';
    
    const currentDate = new Date(start);
    currentDate.setDate(start.getDate() + (i - firstDay));
    
    if (currentDate.getMonth() === m && currentDate.getFullYear() === y) {
      const ymd = `${currentDate.getFullYear()}-${String(currentDate.getMonth()+1).padStart(2,'0')}-${String(currentDate.getDate()).padStart(2,'0')}`;
      const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
      
      const header = document.createElement('div');
      header.className = 'dayheader';
      
      const dateCirc = document.createElement('div');
      dateCirc.className = 'dateCircle';
      if (ymd === today) dateCirc.classList.add('today');
      dateCirc.innerText = currentDate.getDate();
      
      const muted = document.createElement('div');
      muted.className = 'muted';
      muted.innerText = weekdays[currentDate.getDay()];
      
      header.appendChild(dateCirc);
      header.appendChild(muted);
      card.appendChild(header);
      
      const entryLine = document.createElement('div');
      entryLine.className = 'entryLine';
      entryLine.innerText = '加载中...';
      card.appendChild(entryLine);
      
      card.onclick = () => openDay(ymd);
      
      (async (ymd, el) => {
        const res = await fetch(`${window.APP.apiBase}?action=get_day&date=${ymd}`);
        const js = await res.json();
        if (!js.ok) return;
        const rows = js.rows || [];


        if (rows.length === 0) {
  const todayStr = window.APP.today;
  const diff = Math.floor(
    (new Date(ymd + 'T00:00:00') - new Date(todayStr + 'T00:00:00')) / 86400000
  );

  if (diff >= 0 && diff <= 14) {
    el.innerText = '计算可用时长...';

    try {
      const pastMinutes = await getPast7DaysMinutes(ymd);
      const remain = WEEK_LIMIT * 60 - pastMinutes;

      if (remain <= 0) {
        el.innerText = '当天不可再工作';
      } else {
        const h = Math.floor(remain / 60);
        const m = remain % 60;
        el.innerText = `可用 ${h}小时${m}分`;
      }
    } catch (err) {
      el.innerText = js.vacation ? 'Vacation' : '无记录';
    }

  } else {
    el.innerText = js.vacation ? 'Vacation' : '无记录';
  }

} else {
          el.innerHTML = '';
          rows.slice(0, 2).forEach(r => {
            const div = document.createElement('div');
            div.className = 'entryLine';
            
            const companyName = r.company;
            const logoUrl = companyName ? (window.APP.companyLogos[companyName] || '') : '';
            const logoHtml = logoUrl ? `<img src="${logoUrl}" style="height:14px;margin-right:4px;vertical-align:middle;" title="${companyName}" onerror="this.style.display='none'">` : '';
            
            div.innerHTML = `<div style="font-weight:600">${logoHtml}${r.start}-${r.end}</div>`;
            el.appendChild(div);
          });
          
          if (rows.length > 2) {
            const more = document.createElement('div');
            more.className = 'muted';
            more.innerText = `另有 ${rows.length-2} 条`;
            el.appendChild(more);
          }
        }
      })(ymd, entryLine);
    } else {
      card.classList.add('other-month');
      card.innerHTML = '<div class="dayheader"><div class="dateCircle other-month"></div><div class="muted"></div></div>';
    }
    
    grid.appendChild(card);
  }
}

/**
 * 渲染移动端日期列表
 */
function renderMobileList(y, m){
  const cont = document.getElementById('mobileList'); 
  if (!cont) return;
  
  cont.innerHTML = '';
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  
  const start = new Date(y, m, 1);
  const end = new Date(y, m + 1, 0);
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)){
    const localDate = new Date(d);
    const ymd = `${localDate.getFullYear()}-${String(localDate.getMonth()+1).padStart(2,'0')}-${String(localDate.getDate()).padStart(2,'0')}`;
    const weekday = weekdays[localDate.getDay()];
    
    const card = document.createElement('div'); 
    card.className = 'cardCompact';
    
    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div style="flex:1;">
          <div style="font-weight:700;margin-bottom:4px;">${localDate.getMonth()+1}月${localDate.getDate()}日</div>
          <div class="muted">加载...</div>
        </div>
        <div class="muted" style="text-align:right;font-size:14px;">${weekday}</div>
      </div>`;
    
    card.onclick = ()=> openDay(ymd);
    
    cont.appendChild(card);
    
    (async ()=>{
      try {
        const res = await fetch(`${window.APP.apiBase}?action=get_day&date=${ymd}`); 
        const js = await res.json();
        if (!js.ok) return;
        
        const contentEl = card.querySelector('.muted');
        if (!contentEl) return;
        

     if (js.rows.length === 0) {
  const todayStr = window.APP.today;
  const diff = Math.floor(
    (new Date(ymd + 'T00:00:00') - new Date(todayStr + 'T00:00:00')) / 86400000
  );

  if (diff >= 0 && diff <= 14) {
    contentEl.innerText = '计算可用时长...';

    try {
      const pastMinutes = await getPast7DaysMinutes(ymd);
      const remain = WEEK_LIMIT * 60 - pastMinutes;

      if (remain <= 0) {
        contentEl.innerText = '当天不可再工作';
      } else {
        const h = Math.floor(remain / 60);
        const m = remain % 60;
        contentEl.innerText = `可用 ${h}小时${m}分`;
      }
    } catch (err) {
      contentEl.innerText = js.vacation ? 'Vacation' : '无记录';
    }

  } else {
    contentEl.innerText = js.vacation ? 'Vacation' : '无记录';
  }


} else {
          contentEl.innerHTML = '';
          
          js.rows.slice(0, 2).forEach(r => {
            const timeDiv = document.createElement('div');
            timeDiv.style.marginBottom = '2px';
            timeDiv.style.display = 'flex';
            timeDiv.style.alignItems = 'center';
            
            const companyName = r.company;
            const logoUrl = companyName ? (window.APP.companyLogos[companyName] || '') : '';
            const logoHtml = logoUrl ? 
              `<img src="${logoUrl}" style="height:16px;margin-right:6px;vertical-align:middle;" title="${companyName}" onerror="this.style.display='none'">` : '';
            
            timeDiv.innerHTML = `${logoHtml}${r.start}-${r.end}`;
            contentEl.appendChild(timeDiv);
          });
          
          if (js.rows.length > 2) {
            const more = document.createElement('div');
            more.className = 'muted';
            more.style.fontSize = '12px';
            more.innerText = `另有 ${js.rows.length-2} 条`;
            contentEl.appendChild(more);
          }
        }
      } catch (error) {
        const contentEl = card.querySelector('.muted');
        if (contentEl) contentEl.innerText = '加载失败';
      }
    })();
  }
}