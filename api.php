<?php
// =============== API 端点 ===============
// api.php - 所有 AJAX 请求处理、包括 CSRF 保护和输入验证
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/lib/entries.php';
require_once __DIR__ . '/lib/settings.php';
require_once __DIR__ . '/lib/vacations.php';

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
header('X-XSS-Protection: 1; mode=block');

// 启用会话用于 CSRF token
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

function jsonResponse($data){
    echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

// CSRF 令牌验证（针对 POST 请求）
function verifyCsrfToken() {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $token = $_POST['csrf_token'] ?? $_SERVER['HTTP_X_CSRF_TOKEN'] ?? null;
        if (!$token || !isset($_SESSION['csrf_token']) || $token !== $_SESSION['csrf_token']) {
            jsonResponse(['ok' => false, 'error' => 'CSRF token 验证失败']);
        }
    }
}

// 生成 CSRF 令牌
function generateCsrfToken() {
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

// 验证输入数据
function validateInput($data, $rules) {
    foreach ($rules as $field => $rule) {
        if (!isset($data[$field])) {
            return "缺少必要字段: $field";
        }
        $value = $data[$field];
        if ($rule['type'] === 'time' && !preg_match('/^\\d{2}:\\d{2}$/', $value)) {
            return "时间格式不正确: $field";
        }
        if ($rule['type'] === 'date' && !preg_match('/^\\d{4}-\\d{2}-\\d{2}$/', $value)) {
            return "日期格式不正确: $field";
        }
        if ($rule['type'] === 'number' && !is_numeric($value)) {
            return "必须为数字: $field";
        }
        if (isset($rule['max']) && $value > $rule['max']) {
            return "{$field} 超过最大值 {$rule['max']}";
        }
        if (isset($rule['min']) && $value < $rule['min']) {
            return "{$field} 低于最小值 {$rule['min']}";
        }
    }
    return null;
}

verifyCsrfToken();

$action = $_POST['action'] ?? $_GET['action'] ?? null;

// =============== ENTRY 操作 ===============
// 保存或更新工作记录条目
if ($action === 'save_entry') {
    // 验证输入
    $error = validateInput($_POST, [
        'date' => ['type' => 'date'],
        'start' => ['type' => 'time'],
        'end' => ['type' => 'time'],
        'break_min' => ['type' => 'number', 'min' => 0, 'max' => 480],
        'hourly' => ['type' => 'number', 'min' => 0, 'max' => 10000]
    ]);
    if ($error) {
        jsonResponse(['ok' => false, 'error' => $error]);
    }
    
    $data = [
        'id' => isset($_POST['id']) && ctype_digit($_POST['id']) ? intval($_POST['id']) : '',
        'date' => $_POST['date'],
        'start' => $_POST['start'],
        'end' => $_POST['end'],
        'break_min' => intval($_POST['break_min']),
        'hourly' => floatval($_POST['hourly']),
        'note' => isset($_POST['note']) ? htmlspecialchars($_POST['note'], ENT_QUOTES, 'UTF-8') : '',
        'company' => isset($_POST['company']) ? htmlspecialchars($_POST['company'], ENT_QUOTES, 'UTF-8') : ''
    ];
    
    try {
        save_entry($pdo, $data);
        jsonResponse(['ok' => true]);
    } catch (Exception $e) {
        error_log('save_entry 错误: ' . $e->getMessage());
        jsonResponse(['ok' => false, 'error' => '保存失败，请重试']);
    }
}

// 删除指定的工作记录条目
if ($action === 'delete_entry') {
    $id = intval($_POST['id'] ?? 0);
    delete_entry($pdo, $id);
    jsonResponse(['ok' => true]);
}

// 获取指定日期的所有工作记录及统计
if ($action === 'get_day') {
    $date = $_GET['date'] ?? '';
    $rows = get_entries_by_date($pdo, $date);
    foreach ($rows as &$r) { if (!isset($r['company'])) $r['company'] = ''; }
    $totals = compute_totals_for_rows($rows);
    $isVac = is_vacation($pdo, $date);
    jsonResponse([
        'ok' => true,
        'rows' => $rows,
        'total_minutes' => $totals['total_minutes'],
        'total_income' => $totals['total_income'],
        'vacation' => $isVac
    ]);
}

// =============== 日期范围查询 ===============
// 获取指定时间段内的所有工作记录和统计数据（支持月份或自定义日期范围）
if ($action === 'get_range') {
    // 支持两种方式：start+end，或 start + days
    $start = $_GET['start'] ?? '';
    $end = $_GET['end'] ?? '';

    if (empty($start) && isset($_GET['days']) && !empty($_GET['start'])) {
        // 不常用的情况，优先用 start/end
    }

    // 如果传了 days 而没有 end，则把 end 设为 start + (days-1)
    if (empty($end) && isset($_GET['days']) && is_numeric($_GET['days'])) {
        $days = intval($_GET['days']);
        $d = new DateTime($start);
        $d->modify('+' . ($days - 1) . ' days');
        $end = $d->format('Y-m-d');
    }

    if (empty($start) || empty($end)) {
        jsonResponse(['ok' => false, 'error' => 'missing start or end']);
    }

    try {
        $rows = get_entries_between($pdo, $start, $end);
        $totals = compute_totals_for_rows($rows);
        jsonResponse(['ok' => true, 'start' => $start, 'end' => $end, 'total_minutes' => $totals['total_minutes'], 'total_income' => $totals['total_income'], 'rows' => $rows, 'rows_count' => count($rows)]);
    } catch (Exception $e) {
        jsonResponse(['ok' => false, 'error' => $e->getMessage()]);
    }
}

// 获取指定周的工作统计数据（包括周上限判断）
if ($action === 'get_week') {
    $date = $_GET['date'] ?? '';
    try {
        $range = get_week_range_by_date($date);
    } catch(Exception $e){
        jsonResponse(['ok' => false, 'error' => 'invalid date']);
    }
    $rows = get_entries_between($pdo, $range['start'], $range['end']);
    $total_minutes = 0;
    foreach ($rows as $r) $total_minutes += compute_row_minutes($r);
    $vac_cnt = count_vacations_between($pdo, $range['start'], $range['end']);
    $week_max = $vac_cnt > 0 ? 40 : 28;
    jsonResponse([
        'ok' => true,
        'start' => $range['start'],
        'end' => $range['end'],
        'total_minutes' => $total_minutes,
        'week_max' => $week_max,
        'vac_count' => $vac_cnt
    ]);
}

// =============== 系统设置 ===============
// 获取指定的系统设置值
if ($action === 'get_setting') {
    $key = $_GET['key'] ?? '';
    $val = get_setting($pdo, $key);
    jsonResponse(['ok' => true, 'val' => $val]);
}

// 保存系统设置值
if ($action === 'set_setting') {
    $key = $_POST['key'] ?? '';
    $val = $_POST['val'] ?? '';
    set_setting($pdo, $key, $val);
    jsonResponse(['ok' => true]);
}

// =============== 假期管理 ===============
// 切换指定日期的假期状态
if ($action === 'toggle_vacation') {
    $date = $_POST['date'] ?? '';
    $on = isset($_POST['on']) && ($_POST['on']=='1' || $_POST['on']=='true' || $_POST['on']==1);
    toggle_vacation($pdo, $date, $on);
    jsonResponse(['ok' => true, 'vacation' => $on]);
}

// (vacation ranges are handled by public/vacation/api.php now)

// 获取过去7天的工作统计数据（用于首页显示）
if ($action === 'get_last7days') {
    $today = date('Y-m-d');
    $start = (new DateTime($today))->modify('-6 days')->format('Y-m-d');
    $rows = get_entries_between($pdo, $start, $today);
    $totals = compute_totals_for_rows($rows);
    jsonResponse(['ok' => true, 'total_minutes' => $totals['total_minutes'], 'total_income' => $totals['total_income'], 'start' => $start, 'end' => $today, 'rows' => $rows]);
}

// =============== 公司管理 ===============
// 获取所有不重复的公司列表（用于下拉菜单）
if ($action === 'get_companies') {
    $stmt = $pdo->query("SELECT DISTINCT company FROM entries WHERE company IS NOT NULL AND company != '' ORDER BY company");
    $rows = $stmt->fetchAll(PDO::FETCH_COLUMN);
    jsonResponse(['ok' => true, 'rows' => $rows]);
}

// =============== Logo 管理 ===============
// 初始化 logo 数据库
$logoDbPath = __DIR__ . '/data/logo.db';
if (!is_dir(dirname($logoDbPath))) {
    @mkdir(dirname($logoDbPath), 0755, true);
}

try {
    $logoPdo = new PDO("sqlite:$logoDbPath");
    $logoPdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $logoPdo->exec("CREATE TABLE IF NOT EXISTS company_logos (
        company TEXT PRIMARY KEY,
        logo_url TEXT NOT NULL
    );");
} catch (PDOException $e) {
    // Logo 初始化失败时不影响主要功能
    error_log("Logo DB 初始化失败: " . $e->getMessage());
}

// 获取所有 Logo
if ($action === 'logo_list') {
    try {
        $stmt = $logoPdo->query("SELECT company, logo_url FROM company_logos ORDER BY company");
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        jsonResponse(['ok' => true, 'data' => $rows]);
    } catch (Exception $e) {
        jsonResponse(['ok' => false, 'error' => $e->getMessage()]);
    }
}

// 添加或更新 Logo
if ($action === 'logo_set' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $company = $_POST['company'] ?? '';
        $url = $_POST['url'] ?? '';
        
        if (!$company || !$url) {
            jsonResponse(['ok' => false, 'error' => '公司名和 URL 不能为空']);
            exit;
        }
        
        $stmt = $logoPdo->prepare("REPLACE INTO company_logos (company, logo_url) VALUES (?, ?)");
        $stmt->execute([$company, $url]);
        jsonResponse(['ok' => true]);
    } catch (Exception $e) {
        jsonResponse(['ok' => false, 'error' => $e->getMessage()]);
    }
}

// 删除 Logo
if ($action === 'logo_delete' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $company = $_POST['company'] ?? '';
        
        if (!$company) {
            jsonResponse(['ok' => false, 'error' => '公司名不能为空']);
            exit;
        }
        
        $stmt = $logoPdo->prepare("DELETE FROM company_logos WHERE company = ?");
        $stmt->execute([$company]);
        jsonResponse(['ok' => true]);
    } catch (Exception $e) {
        jsonResponse(['ok' => false, 'error' => $e->getMessage()]);
    }
}

// ------------------- 获取所有工作记录（用于导入/搜索） -------------------
if ($action === 'get_all_entries') {
    try {
        $entries = getAllEntries();
        jsonResponse(['ok' => true, 'data' => $entries]);
    } catch (Exception $e) {
        jsonResponse(['ok' => false, 'error' => $e->getMessage()]);
    }
}

// ------------------- 添加工作记录（用于导入） -------------------
if ($action === 'add_entry') {
    try {
        $date = $_POST['date'] ?? '';
        $start = $_POST['start'] ?? '';
        $end = $_POST['end'] ?? '';
        $break_min = intval($_POST['break_min'] ?? 0);
        $hourly = floatval($_POST['hourly'] ?? 0);
        $company = $_POST['company'] ?? '';
        $note = $_POST['note'] ?? '';

        if (!$date || !$start || !$end) {
            jsonResponse(['ok' => false, 'error' => '必要字段缺失']);
        }

        addEntry($date, $start, $end, $break_min, $hourly, $company, $note);
        jsonResponse(['ok' => true, 'message' => '添加成功']);
    } catch (Exception $e) {
        jsonResponse(['ok' => false, 'error' => $e->getMessage()]);
    }
}

// ------------------- DEFAULT -------------------
jsonResponse(['ok' => false, 'error' => 'unknown action']);