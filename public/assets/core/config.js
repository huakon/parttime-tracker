/**
 * 配置管理模块
 * 管理全局配置和周上限设置
 */

const today = window.APP.today;
let selectedDate = today;
let WEEK_LIMIT = 28;

/**
 * 初始化周上限（根据假期状态设置）
 */
async function initWeekLimit(todayStr){
    const vacations = await fetchVacationList();
    const today = new Date(todayStr+'T00:00:00');

    if(isInVacation(today, vacations)){
        WEEK_LIMIT = 40;
    }else{
        WEEK_LIMIT = 28;
    }
}
