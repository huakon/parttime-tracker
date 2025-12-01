<?php
// public/index.php - 页面渲染

require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../lib/settings.php';

// 启用会话以支持 CSRF 令牌
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// 生成 CSRF 令牌
function generateCsrfToken() {
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

$csrf_token = generateCsrfToken();
$default_hourly = get_setting($pdo, 'hourly_rate') ?: 1000.0;
$today = date('Y-m-d');

// 初始化公司 Logo 数据库 (位于 public/data 目录)
$logoDbPath = __DIR__ . '/../data/logo.db';

// 初始化公司 Logo
$companyLogos = [];
try {
    // 如果数据库不存在，创建它
    $dbExists = file_exists($logoDbPath);
    $logoPdo = new PDO("sqlite:$logoDbPath");
    $logoPdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // 如果是新数据库，创建表
    if (!$dbExists) {
        $logoPdo->exec("CREATE TABLE company_logos (
            company TEXT PRIMARY KEY,
            logo_url TEXT NOT NULL
        );");
    }
    
    // 读取 Logo 数据
    $stmt = $logoPdo->query("SELECT company, logo_url FROM company_logos");
    while($row = $stmt->fetch(PDO::FETCH_ASSOC)){
        $companyLogos[$row['company']] = $row['logo_url'];
    }
} catch(PDOException $e){
    $companyLogos = [];
    error_log("读取 logo 数据库失败: ".$e->getMessage());
}
?>
<!doctype html>
<html lang="zh">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="csrf-token" content="<?php echo htmlspecialchars($csrf_token); ?>">
<title>留学生工时记录器</title>
<link rel="stylesheet" href="assets/style.css">
</head>
<body class="<?php echo (preg_match('/Android|iPhone|iPad|Mobile|Opera Mini|IEMobile|Windows Phone/i', $_SERVER['HTTP_USER_AGENT'] ?? '') ? 'mobile' : 'desktop'); ?>">
<!-- 自定义通知容器 -->
<div id="notificationContainer" style="position:fixed;top:20px;right:20px;z-index:9999;max-width:400px;"></div>

<div class="header" style="position:relative;">
  <div class="title">留学生工时记录器</div>
  <div class="controls">
    <!-- 仅显示两个主菜单按钮："菜单" 和 "操作"，其余功能放入下拉多层级里 -->
    <div class="menu" style="position:relative;display:inline-block;margin-right:8px;">
      <button class="btn small" id="topMenuMain">菜单 ▾</button>
      <div id="topMenuMainDropdown" style="display:none;position:absolute;left:0;top:36px;background:#fff;border:1px solid #ddd;padding:8px;border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,.1);z-index:1000;min-width:160px;">
        <div><button class="btn" id="menuStats">统计</button></div>
        <div style="margin-top:6px;"><button class="btn" id="menuVacation">休假管理</button></div>
        <div style="margin-top:6px;"><button class="btn" id="menuLogo">Logo 管理</button></div>
      </div>
    </div>

    <div class="menu" style="position:relative;display:inline-block;margin-right:8px;">
      <button class="btn small" id="topMenuActions">操作 ▾</button>
      <div id="topMenuActionsDropdown" style="display:none;position:absolute;left:0;top:36px;background:#fff;border:1px solid #ddd;padding:8px;border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,.1);z-index:1000;min-width:200px;">
        <div><button class="btn" id="menuExportCSV">保存 CSV</button></div>
        <div style="margin-top:6px;"><button class="btn" id="menuExportXLSX">导出 Excel</button></div>
        <div style="margin-top:6px;"><button class="btn" id="menuExportPDF">导出 PDF</button></div>
        <div style="margin-top:6px;"><button class="btn" id="menuSearch">搜索</button></div>
        <div style="margin-top:6px;"><button class="btn" id="menuTheme">主题</button></div>
        <div style="margin-top:6px;"><button class="btn" id="menuImport">导入</button></div>
        <div style="margin-top:6px;"><button class="btn" id="menuShortcuts">快捷键</button></div>
        
        <div style="margin-top:6px;"><button class="btn" id="todayBtn">今⽇</button></div>
      </div>
    </div>
    
    <div id="japaneseEra" style="display:inline-block;padding:8px 12px;background:#f0f0f0;border-radius:6px;font-size:14px;color:#555;font-weight:500;margin-left:4px;">
      <span id="eraDisplay">令和7年</span>
    </div>
    
  </div>
</div>

<div class="container">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;gap:12px;">
    <div>
      <label>默认时薪（¥） <input id="defaultHourly" class="input small" style="width:90px;display:inline-block;" value="<?php echo htmlspecialchars($default_hourly); ?>"></label>
      <button class="btn small" id="saveHourly">保存</button>
    </div>
    <div>
      <label class="note">无</label>
    </div>
  </div>

  <!-- month nav -->
  <div class="monthNav">
    <button class="btn small" id="prevMonth">← 上月</button>
    <div class="monthLabel" id="monthLabel"></div>
    <button class="btn small" id="nextMonth">下月 →</button>
  </div>

  <!-- week heads -->
  <div class="weekHead">
    <div>月</div><div>火</div><div>水</div><div>木</div><div>金</div><div>土</div><div>日</div>
  </div>

  <!-- Desktop calendar -->
  <div class="calendar" id="calendarGrid"></div>

  <!-- Mobile view -->
  <div class="mobileView" id="mobileList"></div>

  
  <div id="recentSummary" style="margin-top:14px;padding:12px;background:#fff;border-radius:10px;box-shadow:0 2px 5px rgba(0,0,0,.05);">
    <h4 style="margin:0 0 8px 0;">当月统计</h4>
    <div id="monthStats" class="note">加载中...</div>
  </div>

  <div style="margin-top:12px;">
    <div class="note">工时限制以官方公告为准。</div>
  </div>
</div>

<!-- modal (日详情) -->
<div class="modal" id="modal">
  <div class="modalInner">
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <h3 id="modalTitle">日详情</h3>
      <div><button class="btn small" id="closeModal">关闭</button></div>
    </div>

    <div class="row">
      <div class="col">
        <label style="display:flex;align-items:center;gap:8px;">日期 <input id="d_date" class="input" readonly style="flex:1;min-width:0;"></label>
      </div>
    </div>

    <div style="margin-top:6px;">
      <h4>新增 / 编辑时段</h4>
      <div class="row">
        <div class="col"><input id="d_start" class="input" placeholder="起(08:30)"></div>
        <div class="col"><input id="d_end" class="input" placeholder="止(17:00)"></div>
        <div style="width:120px;"><input id="d_break" class="input" placeholder="休息(分钟)"></div>
        <div style="width:120px;"><input id="d_hourly" class="input" placeholder="时薪(¥)"></div>
        <div style="width:150px;">
          <select id="d_company" class="input">
            <option value="">选择公司</option>
            <?php foreach($companyLogos as $c => $url): ?>
            <option value="<?php echo htmlspecialchars($c); ?>"><?php echo htmlspecialchars($c); ?></option>
            <?php endforeach; ?>
          </select>
        </div>
        <div style="width:80px;"><button class="btn" id="addEntry">保存</button></div>
      </div>
    </div>

    <div style="margin-top:8px;">
      <table class="table" id="entriesTable">
        <thead><tr><th>时段</th><th>休息(分)</th><th>工时</th><th>收入(¥)</th><th></th></tr></thead>
        <tbody></tbody>
      </table>
      <div class="summary" style="margin-top:12px;">
        <div>当天实际工时：<span id="day_work">0 分钟</span></div>
        <div>当天收入：¥<span id="day_income">0</span></div>
        <div id="week_warn" style="margin-left:auto;"></div>
      </div>
    </div>

  </div>
</div>

<!-- 统计弹窗 -->
<div class="modal" id="statsModal" style="display:none;">
  <div class="modalInner" style="width:90%;max-width:1200px;max-height:90vh;overflow-y:auto;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
      <h2>工作统计</h2>
      <button class="btn small" id="closeStats">关闭</button>
    </div>

    <div style="display:flex;gap:16px;margin-bottom:16px;flex-wrap:wrap;align-items:flex-end;">
      <div style="flex:1;min-width:200px;">
        <label style="display:block;font-weight:500;margin-bottom:6px;color:#333;">选择月份</label>
        <input type="month" id="statsMonthPicker" style="width:100%;padding:8px 12px;border:1px solid #ddd;border-radius:6px;font-size:14px;background:#fafafa;transition:all 0.3s;box-sizing:border-box;" onfocus="this.style.borderColor='#007aff';this.style.background='#fff';" onblur="this.style.borderColor='#ddd';this.style.background='#fafafa';">
      </div>
      <div style="flex:1;min-width:300px;">
        <label style="display:block;font-weight:500;margin-bottom:6px;color:#333;">或日期范围</label>
        <div style="display:flex;gap:8px;align-items:center;">
          <input type="date" id="statsStartDate" style="flex:1;padding:8px 12px;border:1px solid #ddd;border-radius:6px;font-size:14px;background:#fafafa;transition:all 0.3s;box-sizing:border-box;" onfocus="this.style.borderColor='#007aff';this.style.background='#fff';" onblur="this.style.borderColor='#ddd';this.style.background='#fafafa';">
          <span style="color:#999;">—</span>
          <input type="date" id="statsEndDate" style="flex:1;padding:8px 12px;border:1px solid #ddd;border-radius:6px;font-size:14px;background:#fafafa;transition:all 0.3s;box-sizing:border-box;" onfocus="this.style.borderColor='#007aff';this.style.background='#fff';" onblur="this.style.borderColor='#ddd';this.style.background='#fafafa';">
        </div>
      </div>
      <button id="statsLoadBtn" class="btn" style="padding:10px 20px;background:#007aff;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:500;transition:background 0.3s;" onmouseover="this.style.background='#0056b3';" onmouseout="this.style.background='#007aff';">加载统计</button>
    </div>

    <div class="summary" style="padding:12px;background:#f5f5f5;border-radius:8px;margin-bottom:16px;">
      <p id="statsAvgWork">平均每天工作时间：-- 分钟</p>
    </div>

    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(380px,1fr));gap:12px;">
      <div style="background:#fff;padding:10px;border-radius:8px;box-shadow:0 2px 5px rgba(0,0,0,.05);">
        <h3 style="margin:0 0 8px 0;font-size:14px;">每日工作时间（小时）</h3>
        <canvas id="statsChartWork" style="max-height:200px;"></canvas>
      </div>
      <div style="background:#fff;padding:10px;border-radius:8px;box-shadow:0 2px 5px rgba(0,0,0,.05);">
        <h3 style="margin:0 0 8px 0;font-size:14px;">每日收入（¥）</h3>
        <canvas id="statsChartIncome" style="max-height:200px;"></canvas>
      </div>
      <div style="background:#fff;padding:10px;border-radius:8px;box-shadow:0 2px 5px rgba(0,0,0,.05);">
        <h3 style="margin:0 0 8px 0;font-size:14px;">公司占比（按工作时间）</h3>
        <canvas id="statsChartCompany" style="max-height:200px;"></canvas>
      </div>
      <div style="background:#fff;padding:10px;border-radius:8px;box-shadow:0 2px 5px rgba(0,0,0,.05);">
        <h3 style="margin:0 0 8px 0;font-size:14px;">每周工作天数</h3>
        <canvas id="statsChartWeekDays" style="max-height:200px;"></canvas>
      </div>
      <div style="background:#fff;padding:10px;border-radius:8px;box-shadow:0 2px 5px rgba(0,0,0,.05);">
        <h3 style="margin:0 0 8px 0;font-size:14px;">公司收入分布（¥）</h3>
        <canvas id="statsChartWeekLimit" style="max-height:200px;"></canvas>
      </div>
    </div>

    <!-- 新增可视化容器 -->
    <div id="visualizationsContainer" style="margin-top:20px;">
      <!-- 月度汇总统计 -->
      <div id="monthlySummaryContainer" style="margin-bottom:20px;"></div>
      
      <!-- 日历热力图 -->
      <div id="heatmapContainer" style="margin-bottom:20px;"></div>
      
      <!-- 时间线视图 -->
      <div id="timelineContainer" style="margin-bottom:20px;"></div>
      
      <!-- 甘特图 -->
      <div id="ganttContainer" style="margin-bottom:20px;"></div>
      
      <!-- 年度统计趋势 -->
      <div id="yearlyTrendContainer" style="margin-bottom:20px;"></div>
      
      <!-- 按公司统计收入 -->
      <div id="companyComparisonContainer" style="margin-bottom:20px;"></div>
    </div>
  </div>
</div>

<!-- 导出加载覆盖层 -->
<style>
@keyframes __cp_spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
#exportLoading { display:none; position:fixed; left:0; top:0; width:100%; height:100%; background:rgba(0,0,0,0.45); z-index:2200; align-items:center; justify-content:center; }
#exportLoading .inner { background:#fff; padding:18px 22px; border-radius:10px; box-shadow:0 6px 18px rgba(0,0,0,.2); display:flex; gap:12px; align-items:center; }
#exportLoading .spinner { width:36px; height:36px; border:4px solid #eee; border-top-color:#007aff; border-radius:50%; animation:__cp_spin 1s linear infinite; }
#exportLoading .text { font-size:14px; color:#333; }
</style>
<div id="exportLoading">
  <div class="inner">
    <div class="spinner" aria-hidden="true"></div>
    <div class="text" id="exportLoadingText">正在导出 CSV，请稍候…</div>
  </div>
</div>

<!-- 休假管理弹窗 -->
<div class="modal" id="vacModal" style="display:none;">
  <div class="modalInner" style="width:90%;max-width:900px;max-height:90vh;overflow:auto;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
      <h2>休假管理</h2>
      <button class="btn small" id="closeVac">关闭</button>
    </div>

    <form id="vacForm" style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px;align-items:flex-end;padding:12px;background:#f9f9f9;border-radius:8px;">
      <div style="flex:1;min-width:150px;">
        <label style="display:block;font-weight:500;margin-bottom:4px;color:#333;font-size:13px;">开始日期</label>
        <input type="date" name="start" required style="width:100%;padding:8px 12px;border:1px solid #ddd;border-radius:6px;font-size:14px;box-sizing:border-box;transition:all 0.3s;" onfocus="this.style.borderColor='#007aff';this.style.boxShadow='0 0 0 3px rgba(0,122,255,0.1)';" onblur="this.style.borderColor='#ddd';this.style.boxShadow='none';">
      </div>
      <div style="flex:1;min-width:150px;">
        <label style="display:block;font-weight:500;margin-bottom:4px;color:#333;font-size:13px;">结束日期</label>
        <input type="date" name="end" required style="width:100%;padding:8px 12px;border:1px solid #ddd;border-radius:6px;font-size:14px;box-sizing:border-box;transition:all 0.3s;" onfocus="this.style.borderColor='#007aff';this.style.boxShadow='0 0 0 3px rgba(0,122,255,0.1)';" onblur="this.style.borderColor='#ddd';this.style.boxShadow='none';">
      </div>
      <div style="flex:1;min-width:150px;">
        <label style="display:block;font-weight:500;margin-bottom:4px;color:#333;font-size:13px;">备注（可选）</label>
        <input type="text" name="note" placeholder="例如：春假" style="width:100%;padding:8px 12px;border:1px solid #ddd;border-radius:6px;font-size:14px;box-sizing:border-box;transition:all 0.3s;" onfocus="this.style.borderColor='#007aff';this.style.boxShadow='0 0 0 3px rgba(0,122,255,0.1)';" onblur="this.style.borderColor='#ddd';this.style.boxShadow='none';">
      </div>
      <button class="btn" type="submit" style="padding:8px 16px;background:#28a745;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:500;transition:background 0.3s;font-size:14px;" onmouseover="this.style.background='#218838';" onmouseout="this.style.background='#28a745';">添加</button>
    </form>

    <div id="desktopUI">
      <table id="vacList">
        <tr><th>开始</th><th>结束</th><th>备注</th><th>操作</th></tr>
      </table>
    </div>
    <div id="mobileUI" style="display:none;padding:0 10px;"></div>
  </div>
</div>

<!-- Logo 管理弹窗 -->
<div class="modal" id="logoModal" style="display:none;">
  <div class="modalInner" style="width:90%;max-width:800px;max-height:90vh;overflow:auto;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
      <h2>公司 Logo 管理</h2>
      <button class="btn small" id="closeLogoModal">关闭</button>
    </div>

    <div style="background:#f0f8ff;border-left:4px solid #007bff;padding:12px;margin-bottom:12px;border-radius:4px;">
      <p style="color:#004085;margin:0;font-size:13px;">在此添加公司 Logo，会显示在工作记录表中。Logo URL 需要是网络可访问的图片链接。</p>
    </div>

    <div style="background:white;border:1px solid #ddd;padding:15px;border-radius:6px;margin-bottom:15px;">
      <h4 style="margin-bottom:10px;">添加新 Logo</h4>
      <div style="margin-bottom:10px;">
        <label style="display:block;font-weight:500;margin-bottom:4px;">公司名</label>
        <input type="text" id="logoCompanyInput" class="input" placeholder="例如：Google, Amazon">
      </div>
      <div style="margin-bottom:10px;">
        <label style="display:block;font-weight:500;margin-bottom:4px;">Logo URL</label>
        <input type="text" id="logoUrlInput" class="input" placeholder="例如：https://example.com/logo.png">
      </div>
      <button class="btn" id="addLogoBtn">添加</button>
    </div>

    <h4 style="margin-bottom:10px;">Logo 列表</h4>
    <div id="logoList" style="display:grid;gap:10px;"></div>
  </div>
</div>

<script>
window.APP = {
  today: "<?php echo $today; ?>",
  defaultHourly: "<?php echo htmlspecialchars($default_hourly); ?>",
  apiBase: "../api.php",
  companyLogos: <?php echo json_encode($companyLogos, JSON_UNESCAPED_SLASHES); ?>
};

// 加载指定日期的工作记录并在表格中显示
async function loadDay(ymd){
  try {
    const res = await fetch(`${window.APP.apiBase}?action=get_day&date=${ymd}`);
    const js = await res.json();
    const tbody = document.querySelector('#entriesTable tbody');
    if(!tbody) return;
    
    // 安全清空：使用 textContent 替代 innerHTML
    while(tbody.firstChild) tbody.removeChild(tbody.firstChild);
    
    let minutes = 0, income = 0;
    js.rows.forEach(r=>{
      const s=r.start,e=r.end,br=parseInt(r.break_min||0,10);
      const [sh,sm]=s.split(':').map(Number);
      const [eh,em]=e.split(':').map(Number);
      let diff=(eh*60+em)-(sh*60+sm);
      if(diff<0) diff+=24*60;
      let work=Math.max(0,diff-br);
      minutes+=work;
      income+=(work/60)*parseFloat(r.hourly||0);

      const row=document.createElement('tr');
      const companyName = r.company || '';
      const logoUrl = companyName ? (window.APP.companyLogos[companyName]||'') : '';
      
      // 时间段单元格
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
      
      // 休息时间
      const breakCell = document.createElement('td');
      breakCell.textContent = br;
      row.appendChild(breakCell);
      
      // 工时
      const workCell = document.createElement('td');
      workCell.textContent = work + ' 分';
      row.appendChild(workCell);
      
      // 收入
      const incomeCell = document.createElement('td');
      incomeCell.textContent = '¥' + ((work/60)*parseFloat(r.hourly||0)).toFixed(2);
      row.appendChild(incomeCell);
      
      // 操作按钮
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
    document.getElementById('day_work').textContent=minutes+' 分';
    document.getElementById('day_income').textContent=income.toFixed(2);
  } catch(e){ 
    console.error('加载日期数据失败:', e);
    alert('加载数据失败: ' + (e.message || '未知错误'));
  }
}

// 旧的下拉脚本已移除，统一由 assets/main.js 管理“菜单/操作”行为
</script>

<!-- ============ 核心模块 ============ -->
<script src="assets/core/config.js"></script>
<script src="assets/core/utils.js"></script>
<script src="assets/core/api.js"></script>

<!-- ============ UI模块 ============ -->
<script src="assets/ui/notifications.js"></script>
<script src="assets/ui/calendar.js"></script>
<script src="assets/ui/modal.js"></script>
<script src="assets/ui/menu.js"></script>
<script src="assets/ui/mobile.js"></script>

<!-- ============ 核心初始化（依赖UI模块） ============ -->
<script src="assets/core/main.js"></script>

<!-- ============ 功能模块 ============ -->
<!-- 数据管理 -->
<script src="assets/features/data/import.js"></script>
<script src="assets/features/data/export.js"></script>
<script src="assets/features/data/search.js"></script>

<!-- 公司管理 -->
<script src="assets/features/company/companyManager.js"></script>

<!-- 统计分析 -->
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script src="assets/features/statistics/statistics.js"></script>
<script src="assets/features/statistics/visualizations.js"></script>

<!-- 其他功能 -->
<script src="assets/features/vacation.js"></script>
<script src="assets/features/theme.js"></script>

<!-- ============ 交互功能 ============ -->
<script src="assets/interactions/shortcuts.js"></script>

<!-- ============ 第三方库 ============ -->
<script src="assets/lib/xlsx.full.min.js"></script>
<script src="assets/lib/jspdf.umd.min.js"></script>
<script src="assets/lib/jspdf.plugin.autotable.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>

</body>
</html>