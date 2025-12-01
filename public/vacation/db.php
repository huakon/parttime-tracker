<?php
// public/vacation/db.php - local sqlite for vacation ranges used by public UI
$dbFile = __DIR__ . '/../../data/vacation.sqlite';
$first = !file_exists($dbFile);
$pdo_vac = new PDO('sqlite:' . $dbFile);
$pdo_vac->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
if($first){
    $pdo_vac->exec("CREATE TABLE IF NOT EXISTS vacations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        note TEXT
    );");
}
return $pdo_vac;
