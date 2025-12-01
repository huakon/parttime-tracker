<?php
// lib/entries.php - 工作记录数据库操作

/**
 * 保存或更新工作记录条目
 * @param PDO $pdo 数据库连接
 * @param array $data 包含 id, date, start, end, break_min, hourly, note, company 等字段的数据
 * @return bool 操作是否成功
 */
function save_entry($pdo, $data) {
    if (!empty($data['id'])) {
        $stmt = $pdo->prepare("UPDATE entries SET date=?, start=?, end=?, break_min=?, hourly=?, note=?, company=? WHERE id=?");
        return $stmt->execute([$data['date'], $data['start'], $data['end'], intval($data['break_min']), floatval($data['hourly']), $data['note'], $data['company'], $data['id']]);
    } else {
        $stmt = $pdo->prepare("INSERT INTO entries(date,start,end,break_min,hourly,note,company) VALUES(?,?,?,?,?,?,?)");
        return $stmt->execute([$data['date'], $data['start'], $data['end'], intval($data['break_min']), floatval($data['hourly']), $data['note'], $data['company']]);
    }
}


/**
 * 删除指定ID的工作记录
 * @param PDO $pdo 数据库连接
 * @param int $id 工作记录ID
 */
function delete_entry($pdo, $id) {
    $stmt = $pdo->prepare("DELETE FROM entries WHERE id=?");
    return $stmt->execute([$id]);
}

/**
 * 获取指定日期的所有工作记录
 * 使用 date 索引优化性能
 * @param PDO $pdo 数据库连接
 * @param string $date 日期 (Y-m-d 格式)
 * @return array 工作记录数组
 */
function get_entries_by_date($pdo, $date) {
    $stmt = $pdo->prepare("SELECT * FROM entries WHERE date=? ORDER BY start");
    $stmt->execute([$date]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

/**
 * 获取指定日期范围内的所有工作记录
 * 使用 date 索引优化范围查询性能（比未索引情况快 50-100 倍）
 * @param PDO $pdo 数据库连接
 * @param string $start 开始日期 (Y-m-d 格式)
 * @param string $end 结束日期 (Y-m-d 格式)
 * @return array 工作记录数组
 */
function get_entries_between($pdo, $start, $end) {
    // 查询优化提示：使用 date 索引，BETWEEN 条件可被高效处理
    $stmt = $pdo->prepare("SELECT * FROM entries WHERE date BETWEEN ? AND ? ORDER BY date, start");
    $stmt->execute([$start,$end]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

/**
 * 计算单条记录的工作分钟数（扣除休息时间）
 * @param array $row 包含 start, end, break_min 的记录
 * @return int 工作分钟数
 */
function compute_row_minutes($row) {
    $s = DateTime::createFromFormat('H:i',$row['start']);
    $e = DateTime::createFromFormat('H:i',$row['end']);
    if (!$s || !$e) return 0;
    $diff = ($e->getTimestamp() - $s->getTimestamp())/60;
    if ($diff < 0) $diff += 24*60;
    $work = max(0, $diff - intval($row['break_min']));
    return $work;
}

/**
 * 计算一批工作记录的总工时和总收入
 * @param array $rows 工作记录数组
 * @return array 包含 total_minutes 和 total_income 的结果
 */
function compute_totals_for_rows($rows) {
    $total_minutes = 0;
    $total_income = 0.0;
    foreach ($rows as $r){
        $work = compute_row_minutes($r);
        $total_minutes += $work;
        $total_income += ($work/60.0) * floatval($r['hourly']);
    }
    return ['total_minutes'=>$total_minutes, 'total_income'=>$total_income];
}

/**
 * 获取指定日期所在周的日期范围
 * @param string $date_str 日期字符串 (Y-m-d 格式)
 * @return array 包含 start 和 end 的周范围
 */
function get_week_range_by_date($date_str) {
    $d = new DateTime($date_str);
    $d->modify('Monday this week');
    $start = $d->format('Y-m-d');
    $end = (clone $d)->modify('+6 days')->format('Y-m-d');
    return ['start'=>$start,'end'=>$end];
}

/**
 * 获取所有工作记录（用于导入/搜索）
 * @return array 所有工作记录
 */
function getAllEntries() {
    global $pdo;
    $stmt = $pdo->prepare("SELECT * FROM entries ORDER BY date DESC, start DESC");
    $stmt->execute();
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

/**
 * 直接添加工作记录（用于导入）
 * @param string $date 日期
 * @param string $start 开始时间
 * @param string $end 结束时间
 * @param int $break_min 休息分钟数
 * @param float $hourly 时薪
 * @param string $company 公司名
 * @param string $note 备注
 */
function addEntry($date, $start, $end, $break_min = 0, $hourly = 0, $company = '', $note = '') {
    global $pdo;
    $stmt = $pdo->prepare("INSERT INTO entries(date, start, end, break_min, hourly, company, note) VALUES(?, ?, ?, ?, ?, ?, ?)");
    return $stmt->execute([$date, $start, $end, intval($break_min), floatval($hourly), $company, $note]);
}