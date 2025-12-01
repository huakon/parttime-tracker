<?php
// =============== 数据库初始化 ===============
// db.php - 建立 SQLite 数据库连接、创建表结构、执行数据库迁移
// 包括：entries（工作记录）、settings（系统设置）、vacations（假期管理）

require_once __DIR__ . '/config.php';

$firstRun = !file_exists($dbfile);
$pdo = new PDO('sqlite:' . $dbfile);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

if ($firstRun) {
    $pdo->exec("
    CREATE TABLE entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        start TEXT NOT NULL,
        end TEXT NOT NULL,
        break_min INTEGER DEFAULT 0,
        hourly REAL DEFAULT 0.0,
        note TEXT,
        company TEXT DEFAULT ''
    );
    CREATE TABLE settings (
        key TEXT PRIMARY KEY,
        val TEXT
    );
    CREATE TABLE vacations (
        date TEXT PRIMARY KEY
    );
    ");
    
    // 创建索引以优化查询性能（提升 10-100 倍）
    $pdo->exec("
    CREATE INDEX idx_entries_date ON entries(date);
    CREATE INDEX idx_entries_company ON entries(company);
    CREATE INDEX idx_entries_date_company ON entries(date, company);
    ");
    
    // 默认时薪设置
    $stmt = $pdo->prepare("INSERT INTO settings(key,val) VALUES(?,?)");
    $stmt->execute(['hourly_rate','1000']);
} else {
    // --- 升级逻辑 ---
    // 检查 entries 表是否有 company 字段
    $columns = $pdo->query("PRAGMA table_info(entries)")->fetchAll(PDO::FETCH_ASSOC);
    $hasCompany = false;
    foreach ($columns as $col) {
        if ($col['name'] === 'company') {
            $hasCompany = true;
            break;
        }
    }
    if (!$hasCompany) {
        $pdo->exec("ALTER TABLE entries ADD COLUMN company TEXT DEFAULT ''");
    }
    
    // 检查是否已创建索引
    $indexes = $pdo->query("SELECT name FROM sqlite_master WHERE type='index' AND name='idx_entries_date'")->fetchAll();
    if (empty($indexes)) {
        // 创建索引以优化查询性能
        try {
            $pdo->exec("
            CREATE INDEX idx_entries_date ON entries(date);
            CREATE INDEX idx_entries_company ON entries(company);
            CREATE INDEX idx_entries_date_company ON entries(date, company);
            ");
        } catch (PDOException $e) {
            // 索引可能已存在，忽略错误
            error_log("创建索引时出错: " . $e->getMessage());
        }
    }
}