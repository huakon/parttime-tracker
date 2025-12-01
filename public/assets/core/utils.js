/**
 * 工具函数模块
 * 提供通用工具函数，CSRF 令牌、日期处理、日本年号转换等
 */

/**
 * 获取 CSRF token 从页面 meta 标签
 * @return {string} CSRF token
 */
function getCsrfToken() {
    const token = document.querySelector('meta[name="csrf-token"]')?.content;
    return token || '';
}

/**
 * 判断指定日期是否在假期里
 * @param {Date} date 要检查的日期
 * @param {array} vacations 假期数组，每项包含 start 和 end 日期
 * @return {boolean} 是否在假期中
 */
function isInVacation(date, vacations){
    return vacations.some(v=>{
        return date >= v.start && date <= v.end;
    });
}

function handleWeekWarning(total_minutes, week_max=28){
  const el = document.getElementById('week_warn');
  const hrs = total_minutes/60.0;
  el.innerText = '';
  if (hrs > week_max) {
    el.innerHTML = `<span class="warn">警告：本周已 ${hrs.toFixed(2)} 小时，超过 ${week_max} 小时/周</span>`;
  } else {
    el.innerHTML = `<span class="muted">本周 ${hrs.toFixed(2)} 小时 / ${week_max} 小时</span>`;
  }
}

function startOfMonth(y,m){ return new Date(y,m,1); }
function endOfMonth(y,m){ return new Date(y,m+1,0); }

/**
 * 将西历年份转换为日本年号
 * @param {number} year 西历年份
 * @return {string} 日本年号字符串
 */
function getJapaneseEra(year) {
    if (year >= 2019) {
        const reiwaYear = year - 2018;
        return `令和${reiwaYear}年`;
    } else if (year >= 1989) {
        const heiseiYear = year - 1988;
        return `平成${heiseiYear}年`;
    } else if (year >= 1926) {
        const showaYear = year - 1925;
        return `昭和${showaYear}年`;
    } else {
        return `${year}年`;
    }
}

/**
 * 更新页面上的日本年号显示
 */
function updateJapaneseEraDisplay() {
    const eraDisplay = document.getElementById('eraDisplay');
    if (eraDisplay) {
        const currentYear = new Date().getFullYear();
        eraDisplay.textContent = getJapaneseEra(currentYear);
    }
}

// 页面加载完成后初始化年号显示
document.addEventListener('DOMContentLoaded', () => {
    updateJapaneseEraDisplay();
});