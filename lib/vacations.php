<?php
// =============== 假期管理 ===============
// lib/vacations.php - 管理长期假期标记（影响周上限判断：有假期的周上限为40小时）

/**
 * 检查指定日期是否被标记为假期
 * @param PDO $pdo 数据库连接
 * @param string $date 日期 (Y-m-d 格式)
 * @return bool 是否为假期
 */
function is_vacation($pdo, $date) {
    $v = $pdo->prepare("SELECT 1 FROM vacations WHERE date=?");
    $v->execute([$date]);
    return $v->fetchColumn() ? true : false;
}

/**
 * 切换指定日期的假期状态
 * @param PDO $pdo 数据库连接
 * @param string $date 日期 (Y-m-d 格式)
 * @param bool $on 是否标记为假期
 */
function toggle_vacation($pdo, $date, $on) {
    if ($on) {
        $stmt = $pdo->prepare("INSERT OR IGNORE INTO vacations(date) VALUES(?)");
        return $stmt->execute([$date]);
    } else {
        $stmt = $pdo->prepare("DELETE FROM vacations WHERE date=?");
        return $stmt->execute([$date]);
    }
}

/**
 * 统计指定日期范围内的假期天数
 * @param PDO $pdo 数据库连接
 * @param string $start 开始日期 (Y-m-d 格式)
 * @param string $end 结束日期 (Y-m-d 格式)
 * @return int 假期天数
 */
function count_vacations_between($pdo, $start, $end) {
    $vstmt = $pdo->prepare("SELECT COUNT(*) FROM vacations WHERE date BETWEEN ? AND ?");
    $vstmt->execute([$start,$end]);
    return intval($vstmt->fetchColumn() ?: 0);
}