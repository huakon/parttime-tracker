# 网络驱动器Git上传问题 - 解决方案

## ❌ 问题原因

Git在网络驱动器（RaiDrive/SFTP）上无法正常工作，出现以下错误：
- `Unlink of file '.git/config.lock' failed`
- `dubious ownership in repository`
- `unable to write loose object file`

这是因为网络文件系统的权限和文件锁定机制与Git不兼容。

## ✅ 推荐解决方案

### 方案1: 使用GitHub Desktop（最简单）⭐⭐⭐⭐⭐

GitHub Desktop会自动处理网络驱动器问题：

1. **打开 GitHub Desktop**
2. **File → Clone Repository**
3. **URL选项卡，输入：**
   ```
   https://github.com/huakon/parttime-tracker
   ```
4. **Local Path 选择本地目录**（不是网络驱动器）
   ```
   C:\Users\你的用户名\Documents\parttime-tracker
   ```
5. **点击 Clone**
6. **然后：**
   - 复制 Z:\domains\parttime... 下的所有文件到克隆的本地目录
   - 在GitHub Desktop中会看到所有改动
   - 提交并推送

### 方案2: 本地Git操作（推荐）⭐⭐⭐⭐⭐

**步骤：**

1. **复制项目到本地硬盘：**
   ```powershell
   # 在PowerShell中执行
   Copy-Item -Path "Z:\domains\parttime.huakon.serv00.net\public_html" -Destination "C:\Temp\parttime-tracker" -Recurse -Force
   
   # 进入本地目录
   cd C:\Temp\parttime-tracker
   ```

2. **删除数据库文件（确保不上传）：**
   ```powershell
   Remove-Item data\*.db -Force
   Remove-Item data\*.sqlite -Force
   ```

3. **初始化Git并推送：**
   ```powershell
   git init
   git add .
   git commit -m "Initial commit - v2.0.0"
   git branch -M main
   git remote add origin https://github.com/huakon/parttime-tracker.git
   git push -u origin main
   ```

### 方案3: GitHub网页直接上传 ⭐⭐⭐

**步骤：**

1. **访问你的仓库：**
   ```
   https://github.com/huakon/parttime-tracker
   ```

2. **点击 "uploading an existing file"**

3. **准备文件：**
   - 手动压缩项目目录
   - **排除**以下文件：
     - `data/*.db`
     - `data/*.sqlite`
     - `.git/`（如果有）

4. **拖拽上传**

5. **填写提交信息并提交**

## 🚀 快速执行（方案2 - 推荐）

复制并执行以下完整命令：

```powershell
# 1. 复制到本地
Write-Host "正在复制文件到本地..." -ForegroundColor Yellow
$source = "Z:\domains\parttime.huakon.serv00.net\public_html"
$dest = "C:\Temp\parttime-tracker"
Copy-Item -Path $source -Destination $dest -Recurse -Force

# 2. 进入目录
cd $dest

# 3. 删除数据库文件
Write-Host "删除数据库文件..." -ForegroundColor Yellow
Remove-Item data\*.db -Force -ErrorAction SilentlyContinue
Remove-Item data\*.sqlite -Force -ErrorAction SilentlyContinue

# 4. 删除旧的.git目录
Remove-Item .git -Recurse -Force -ErrorAction SilentlyContinue

# 5. 初始化Git
Write-Host "初始化Git..." -ForegroundColor Yellow
git init

# 6. 添加所有文件
Write-Host "添加文件..." -ForegroundColor Yellow
git add .

# 7. 提交
Write-Host "提交..." -ForegroundColor Yellow
git commit -m "Initial commit - v2.0.0" -m "完成代码重构和清理"

# 8. 设置远程仓库
Write-Host "设置远程仓库..." -ForegroundColor Yellow
git branch -M main
git remote add origin https://github.com/huakon/parttime-tracker.git

# 9. 推送
Write-Host "推送到GitHub..." -ForegroundColor Cyan
Write-Host "需要登录GitHub..." -ForegroundColor Yellow
git push -u origin main

Write-Host "`n✅ 完成！" -ForegroundColor Green
Write-Host "访问: https://github.com/huakon/parttime-tracker" -ForegroundColor Cyan
```

## 💡 推荐流程

**最简单且可靠的方式：**

1. 复制项目到本地硬盘（C盘）
2. 在本地使用Git操作
3. 推送到GitHub
4. 完成后可以删除本地副本

**原因：**
- ✅ 避免网络驱动器权限问题
- ✅ Git操作更快更稳定
- ✅ 不影响原始文件

## 🔧 如果需要继续使用网络驱动器

如果你想直接在网络驱动器上工作，建议：
1. 只在网络驱动器上编辑代码
2. 需要提交时，同步到本地再push
3. 或使用GitHub Desktop自动处理

---

**现在就开始吧！复制上面的完整命令到PowerShell执行。** 🚀
