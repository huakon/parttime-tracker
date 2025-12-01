/**
 * 主程序模块
 * 负责主要事件监听和应用初始化
 */

document.addEventListener('DOMContentLoaded', () => {
  const todayBtn = document.getElementById('todayBtn');
  if (todayBtn) {
    todayBtn.onclick = () => openDay(today);
  }

  const saveHourlyBtn = document.getElementById('saveHourly');
  if (saveHourlyBtn) {
    saveHourlyBtn.onclick = async () => {
      const v = document.getElementById('defaultHourly').value;
      await fetch(`${window.APP.apiBase}?action=set_setting`, {
        method: 'POST',
        body: new URLSearchParams({
          key: 'hourly_rate',
          val: v,
          csrf_token: getCsrfToken()
        })
      });
      showNotification('已保存默认时薪', 'success');
      loadCalendar(currentYear, currentMonth);
    };
  }

  const prevMonthBtn = document.getElementById('prevMonth');
  if (prevMonthBtn) {
    prevMonthBtn.onclick = () => {
      currentMonth--;
      if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
      }
      loadCalendar(currentYear, currentMonth);
      renderMobileList(currentYear, currentMonth);
      loadCurrentMonthStats();
    };
  }

  const nextMonthBtn = document.getElementById('nextMonth');
  if (nextMonthBtn) {
    nextMonthBtn.onclick = () => {
      currentMonth++;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }
      loadCalendar(currentYear, currentMonth);
      renderMobileList(currentYear, currentMonth);
      loadCurrentMonthStats();
    };
  }

  const addEntryBtn = document.getElementById('addEntry');
  if (addEntryBtn && typeof defaultAddEntryHandler === 'function') {
    addEntryBtn.onclick = defaultAddEntryHandler;
  }

  initApp();
});

/**
 * 初始化应用
 */
async function initApp() {
  await initWeekLimit(window.APP.today);

  loadCalendar(currentYear, currentMonth);
  renderMobileList(currentYear, currentMonth);
  loadCurrentMonthStats();
}