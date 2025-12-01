<?php
// public/vacation/api.php - 简单 API 供前端直接读写 public/vacation/vacation.sqlite
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/db.php'; // returns $pdo_vac
$action = $_GET['action'] ?? $_POST['action'] ?? '';

if($action === 'list'){
    $stmt = $pdo_vac->query("SELECT id,start_date,end_date,note FROM vacations ORDER BY start_date DESC");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['ok'=>true,'vacations'=>$rows], JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
    exit;
}

if($action === 'add'){
    $start = $_POST['start'] ?? '';
    $end = $_POST['end'] ?? '';
    $note = $_POST['note'] ?? '';
    if(!$start || !$end){ echo json_encode(['ok'=>false,'msg'=>'日期不能为空']); exit; }
    $stmt = $pdo_vac->prepare("INSERT INTO vacations(start_date,end_date,note) VALUES(?,?,?)");
    $ok = $stmt->execute([$start,$end,$note]);
    echo json_encode(['ok'=>boolval($ok)]);
    exit;
}

if($action === 'delete'){
    $id = intval($_POST['id'] ?? 0);
    if(!$id){ echo json_encode(['ok'=>false,'msg'=>'缺少ID']); exit; }
    $stmt = $pdo_vac->prepare("DELETE FROM vacations WHERE id=?");
    $ok = $stmt->execute([$id]);
    echo json_encode(['ok'=>boolval($ok)]);
    exit;
}

echo json_encode(['ok'=>false,'msg'=>'unknown action']);
