<?php
// =============== 系统设置 ===============
// lib/settings.php - 管理应用系统设置（如默认时薪）

/**
 * 获取系统设置值
 * @param PDO $pdo 数据库连接
 * @param string $key 设置键名
 * @return string|null 设置值
 */
function get_setting($pdo, $key) {
    $v = $pdo->prepare("SELECT val FROM settings WHERE key=?");
    $v->execute([$key]);
    return $v->fetchColumn();
}
function set_setting($pdo, $key, $val) {
    $stmt = $pdo->prepare("REPLACE INTO settings(key,val) VALUES(?,?)");
    return $stmt->execute([$key,$val]);
}