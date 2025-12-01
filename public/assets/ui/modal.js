// =============== 日详情弹窗 ===============
// 负责日期详情模态窗口的打开/关闭、表单操作、工作记录的增删改查

const modal = document.getElementById('modal');

// 关闭日详情弹窗
document.getElementById('closeModal').onclick = ()=> modal.style.display='none';

async function openDay(ymd){
  selectedDate = ymd;
  document.getElementById('d_date').value = ymd;
  document.getElementById('modalTitle').innerText = ymd + ' — 日详情';
  
  // load day entries
  await loadDay(ymd);
  
  // load week totals
  const wk = await (await fetch(`${window.APP.apiBase}?action=get_week&date=`+ymd)).json();
  handleWeekWarning(wk.total_minutes, wk.week_max);
  
  modal.style.display='flex';
  
  const vacCheckbox = document.getElementById('d_vac');
  if (vacCheckbox) {
    try {
      const dayRes = await (await fetch(`${window.APP.apiBase}?action=get_day&date=`+ymd)).json();
      vacCheckbox.checked = !!dayRes.vacation;
    } catch (error) {
    }
  }
}

// 原 addEntry 默认逻辑，抽取成函数
async function defaultAddEntryHandler(){
  const date = document.getElementById('d_date').value;
  let start = document.getElementById('d_start').value.trim();
  let end = document.getElementById('d_end').value.trim();
  const br = document.getElementById('d_break').value || 0;
  const hourly = document.getElementById('d_hourly').value || window.APP.defaultHourly;
  const company = document.getElementById('d_company').value || '';
  
  // 验证输入
  if (!date || !start || !end) {
    showNotification('请填写日期、开始时间和结束时间', 'error');
    return;
  }
  
  // 格式化时间为 HH:MM
  const formatTime = (t) => {
    t = String(t).trim().replace(/\s/g, '');
    // 处理 H:MM 或 HH:MM 格式
    if (/^\d{1,2}:\d{2}$/.test(t)) {
      const [h, m] = t.split(':');
      const hh = String(h).padStart(2, '0');
      const mm = String(m).padStart(2, '0');
      return hh + ':' + mm;
    }
    // 如果是4位纯数字，转为 HH:MM (如 0830 -> 08:30)
    if (/^\d{4}$/.test(t)) {
      return t.slice(0, 2) + ':' + t.slice(2);
    }
    return t;
  };
  
  start = formatTime(start);
  end = formatTime(end);
  
  // 验证时间格式
  if (!/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end)) {
    showNotification('时间格式错误，请使用 HH:MM 格式（例：08:30）', 'error');
    return;
  }
  
  const body = new URLSearchParams({
    action:'save_entry', 
    csrf_token: getCsrfToken(),
    date, start, end, break_min:br, hourly, company
  });
  
  try {
    const resp = await fetch(window.APP.apiBase, {method:'POST', body});
    const result = await resp.json();
    
    if (!result.ok) {
      showNotification('保存失败: ' + (result.error || '未知错误'), 'error');
      return;
    }
    
    // 保存成功，刷新日期数据
    await loadDay(date);
    
    // 更新周提醒
    const wkResp = await fetch(`${window.APP.apiBase}?action=get_week&date=`+date);
    const wk = await wkResp.json();
    if (wk.ok) {
      handleWeekWarning(wk.total_minutes, wk.week_max);
    }
    
    showNotification('已保存', 'success');
    // 刷新日历、移动端列表和顶部统计
    try { loadCalendar(currentYear, currentMonth); } catch(e){}
    try { renderMobileList(currentYear, currentMonth); } catch(e){}
    try { loadCurrentMonthStats(); } catch(e){}
  } catch(e) {
    showNotification('保存失败: ' + (e.message || '网络错误'), 'error');
  }
}

window.editEntry = async function(id){
  // 获取当天所有条目，找到对应 id
  const res = await fetch(`${window.APP.apiBase}?action=get_day&date=` + selectedDate);
  const js = await res.json();
  const row = js.rows.find(r => r.id == id);
  if (!row) return;

  // 填充 modal 输入框
  document.getElementById('d_start').value = row.start;
  document.getElementById('d_end').value = row.end;
  document.getElementById('d_break').value = row.break_min;
  document.getElementById('d_hourly').value = row.hourly;
  document.getElementById('d_company').value = row.company || ''; // 保留原值

  // 临时修改 addEntry 点击事件，用于保存编辑
  const saveBtn = document.getElementById('addEntry');
  const originalHandler = saveBtn.onclick;

  saveBtn.onclick = async () => {
    const date = document.getElementById('d_date').value;
    let start = document.getElementById('d_start').value.trim();
    let end = document.getElementById('d_end').value.trim();
    const br = document.getElementById('d_break').value || 0;
    const hourly = document.getElementById('d_hourly').value || window.APP.defaultHourly;
    const company = document.getElementById('d_company').value; // 直接取 input，不 fallback

    // 验证输入
    if (!date || !start || !end) {
      showNotification('请填写日期、开始时间和结束时间', 'error');
      return;
    }

    // 格式化时间为 HH:MM
    const formatTime = (t) => {
      t = String(t).trim().replace(/\s/g, '');
      // 处理 H:MM 或 HH:MM 格式
      if (/^\d{1,2}:\d{2}$/.test(t)) {
        const [h, m] = t.split(':');
        const hh = String(h).padStart(2, '0');
        const mm = String(m).padStart(2, '0');
        return hh + ':' + mm;
      }
      // 如果是4位纯数字，转为 HH:MM (如 0830 -> 08:30)
      if (/^\d{4}$/.test(t)) {
        return t.slice(0, 2) + ':' + t.slice(2);
      }
      return t;
    };

    start = formatTime(start);
    end = formatTime(end);

    // 验证时间格式
    if (!/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end)) {
      showNotification('时间格式错误，请使用 HH:MM 格式（例：08:30）', 'error');
      return;
    }

    const body = new URLSearchParams({
      action: 'save_entry',
      csrf_token: getCsrfToken(),
      id: id,          // 编辑模式
      date,
      start,
      end,
      break_min: br,
      hourly,
      company          // ✅ 确保传给后端
    });

    try {
      const resp = await fetch(window.APP.apiBase, {method: 'POST', body});
      const result = await resp.json();
      
      if (!result.ok) {
        showNotification('保存失败: ' + (result.error || '未知错误'), 'error');
        return;
      }

      // 恢复 addEntry 原来的事件
      saveBtn.onclick = originalHandler;

      // 重新加载日详情和周提醒
      await loadDay(date);
      const wkResp = await fetch(`${window.APP.apiBase}?action=get_week&date=` + date);
      const wk = await wkResp.json();
      if (wk.ok) {
        handleWeekWarning(wk.total_minutes, wk.week_max);
      }
      
      showNotification('已保存', 'success');
      // 刷新日历、移动端列表和顶部统计
      try { loadCalendar(currentYear, currentMonth); } catch(e){}
      try { renderMobileList(currentYear, currentMonth); } catch(e){}
      try { loadCurrentMonthStats(); } catch(e){}
    } catch(e) {
      showNotification('保存失败: ' + (e.message || '网络错误'), 'error');
    }
  };
};

window.delEntry = async function(id){
  if (!confirm('确认删除？')) return;
  try {
    const resp = await fetch(window.APP.apiBase, {method:'POST', body:new URLSearchParams({
      action:'delete_entry', 
      csrf_token: getCsrfToken(),
      id
    })});
    const result = await resp.json();
    
    if (!result.ok) {
      showNotification('删除失败: ' + (result.error || '未知错误'), 'error');
      return;
    }

    await loadDay(selectedDate);
    const wkResp = await fetch(`${window.APP.apiBase}?action=get_week&date=`+selectedDate);
    const wk = await wkResp.json();
    if (wk.ok) {
      handleWeekWarning(wk.total_minutes, wk.week_max);
    }
    try { loadCurrentMonthStats(); } catch(e){}
    try { loadCalendar(currentYear, currentMonth); } catch(e){}
    try { renderMobileList(currentYear, currentMonth); } catch(e){}
    showNotification('已删除', 'success');
  } catch(e) {
    showNotification('删除失败: ' + (e.message || '网络错误'), 'error');
  }
};