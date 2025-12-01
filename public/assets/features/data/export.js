// export.js - 包含 CSV / XLSX / PDF 导出（从原 exportCSV.js 迁移并重命名）

// =============== CSV导出功能 ===============
// 负责将当前月份的工作数据导出为 CSV 文件

// 将导出逻辑封装为函数，便于复用（例如菜单调用）
async function doExportCurrentMonthCSV(){
  const overlay = document.getElementById('exportLoading');
  const textEl = document.getElementById('exportLoadingText');
  try {
    if(overlay) overlay.style.display = 'flex';
    if(textEl) textEl.innerText = '正在导出 CSV，请稍候…';
    const rows = [];
    const totalDays = new Date(currentYear, currentMonth+1, 0).getDate();

    rows.push(['日期','开始','结束','休息(分钟)','实际工作(分钟)','时薪','收入','备注','公司']);

    for(let i=1;i<=totalDays;i++){
      const ymd = `${currentYear}-${String(currentMonth+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
      const res = await fetch(`${window.APP.apiBase}?action=get_day&date=${ymd}`);
      const js = await res.json();
      if(!js || !js.ok) continue;

      js.rows.forEach(r=>{
        const [sh, sm] = r.start.split(':').map(Number);
        const [eh, em] = r.end.split(':').map(Number);
        let diff = (eh*60+em) - (sh*60+sm);
        if(diff<0) diff += 24*60;
        const work = Math.max(0, diff - parseInt(r.break_min||0,10));
        const income = ((work/60.0)*parseFloat(r.hourly||0)).toFixed(2);
        rows.push([ymd, r.start, r.end, r.break_min||0, work, r.hourly||0, income, r.note||'', r.company||'']);
      });
    }

    const csvContent = rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], {type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentYear}-${String(currentMonth+1).padStart(2,'0')}_工作记录.csv`;
    a.click();
    URL.revokeObjectURL(url);
  } catch(e){
    showNotification('导出失败，请查看控制台', 'error');
  } finally {
    if(overlay) overlay.style.display = 'none';
  }
}

// 页面加载时，绑定到可能存在的触发元素（老按钮或菜单按钮）
document.addEventListener('DOMContentLoaded', ()=>{
  const ids = ['exportCSV', 'menuExportCSV'];
  ids.forEach(id=>{
    const el = document.getElementById(id);
    if(el){
      el.addEventListener('click', (e)=>{ e.preventDefault(); doExportCurrentMonthCSV(); });
    }
  });
});

// =============== Excel (XLSX) 导出 ===============
async function doExportCurrentMonthXLSX(){
  const overlay = document.getElementById('exportLoading');
  const textEl = document.getElementById('exportLoadingText');
  try {
    if(overlay) overlay.style.display = 'flex';
    if(textEl) textEl.innerText = '正在导出 Excel，请稍候…';
    const rows = [];
    const totalDays = new Date(currentYear, currentMonth+1, 0).getDate();
    rows.push(['日期','开始','结束','休息(分钟)','实际工作(分钟)','时薪','收入','备注','公司']);
    for(let i=1;i<=totalDays;i++){
      const ymd = `${currentYear}-${String(currentMonth+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
      const res = await fetch(`${window.APP.apiBase}?action=get_day&date=${ymd}`);
      const js = await res.json();
      if(!js || !js.ok) continue;
      js.rows.forEach(r=>{
        const [sh, sm] = r.start.split(':').map(Number);
        const [eh, em] = r.end.split(':').map(Number);
        let diff = (eh*60+em) - (sh*60+sm);
        if(diff<0) diff += 24*60;
        const work = Math.max(0, diff - parseInt(r.break_min||0,10));
        const income = ((work/60.0)*parseFloat(r.hourly||0)).toFixed(2);
        rows.push([ymd, r.start, r.end, r.break_min||0, work, r.hourly||0, income, r.note||'', r.company||'']);
      });
    }

    // 使用 SheetJS 创建工作簿并导出
    if(!window.XLSX){
      showNotification('Excel 库加载中，请稍候后重试', 'error');
      return;
    }
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '工作记录');
    const wbout = XLSX.write(wb, {bookType:'xlsx', type:'array'});
    const blob = new Blob([wbout], {type:'application/octet-stream'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentYear}-${String(currentMonth+1).padStart(2,'0')}_工作记录.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  } catch(e){
    showNotification('导出 Excel 失败，请查看控制台', 'error');
  } finally { if(overlay) overlay.style.display = 'none'; }
}

// =============== PDF 导出 ===============
async function doExportCurrentMonthPDF(){
  const overlay = document.getElementById('exportLoading');
  const textEl = document.getElementById('exportLoadingText');
  try {
    if(overlay) overlay.style.display = 'flex';
    if(textEl) textEl.innerText = '正在导出 PDF，请稍候…';
    const rows = [];
    const totalDays = new Date(currentYear, currentMonth+1, 0).getDate();
    rows.push(['日期','开始','结束','休息(分钟)','实际工作(分钟)','时薪','收入','备注','公司']);
    for(let i=1;i<=totalDays;i++){
      const ymd = `${currentYear}-${String(currentMonth+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
      const res = await fetch(`${window.APP.apiBase}?action=get_day&date=${ymd}`);
      const js = await res.json();
      if(!js || !js.ok) continue;
      js.rows.forEach(r=>{
        const [sh, sm] = r.start.split(':').map(Number);
        const [eh, em] = r.end.split(':').map(Number);
        let diff = (eh*60+em) - (sh*60+sm);
        if(diff<0) diff += 24*60;
        const work = Math.max(0, diff - parseInt(r.break_min||0,10));
        const income = ((work/60.0)*parseFloat(r.hourly||0)).toFixed(2);
        rows.push([ymd, r.start, r.end, String(r.break_min||0), String(work), String(r.hourly||0), String(income), r.note||'', r.company||'']);
      });
    }

    // 使用 jsPDF + autoTable，为中文提供更好的支持
    if(!window.jspdf || !window.jspdf.jsPDF){
      showNotification('PDF 库加载中，请稍候后重试', 'error');
      return;
    }
    
    // 创建一个 HTML 文档，包含标题和表格，然后通过 canvas 转为 PDF
    const titleText = `${currentYear}年${String(currentMonth+1).padStart(2,'0')}月 工作记录`;
    const htmlContent = `
      <div style="font-family:Arial,sans-serif;padding:20px;background:#fff;">
        <h2 style="text-align:center;margin-bottom:20px;font-size:18px;color:#333;">${titleText}</h2>
        <table style="border-collapse:collapse;width:100%;font-size:13px;">
          <thead>
            <tr style="background:#f0f0f0;">
              <th style="border:1px solid #ddd;padding:8px;text-align:center;">日期</th>
              <th style="border:1px solid #ddd;padding:8px;text-align:center;">开始</th>
              <th style="border:1px solid #ddd;padding:8px;text-align:center;">结束</th>
              <th style="border:1px solid #ddd;padding:8px;text-align:center;">休息(分)</th>
              <th style="border:1px solid #ddd;padding:8px;text-align:center;">实际工时(分)</th>
              <th style="border:1px solid #ddd;padding:8px;text-align:center;">时薪</th>
              <th style="border:1px solid #ddd;padding:8px;text-align:center;">收入</th>
              <th style="border:1px solid #ddd;padding:8px;text-align:center;">备注</th>
              <th style="border:1px solid #ddd;padding:8px;text-align:center;">公司</th>
            </tr>
          </thead>
          <tbody>
            ${rows.slice(1).map(r => `
              <tr>
                ${r.map(cell => `<td style="border:1px solid #ddd;padding:6px;text-align:center;font-size:12px;">${cell}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    
    // 创建临时 div 用于渲染
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    tempDiv.style.cssText = 'position:absolute;left:-9999px;top:-9999px;width:1200px;background:white;';
    document.body.appendChild(tempDiv);
    
    try {
      // 使用 html2canvas 转为图像（如果可用）
      if(window.html2canvas) {
        const canvas = await window.html2canvas(tempDiv, { 
          scale: 2, 
          useCORS: true,
          backgroundColor: '#ffffff'
        });
        const imgData = canvas.toDataURL('image/png');
        const doc = new window.jspdf.jsPDF('p', 'mm', 'a4'); // 改为纵向
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        
        const imgWidth = pageWidth - 10; // 两边各 5mm 边距
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        let yPos = 5;
        doc.addImage(imgData, 'PNG', 5, yPos, imgWidth, imgHeight);
        
        // 如果内容超过一页，添加新页面
        if(imgHeight > pageHeight - 10) {
          let remainingHeight = imgHeight;
          let posY = pageHeight - 10;
          while(remainingHeight > 0) {
            doc.addPage();
            doc.addImage(imgData, 'PNG', 5, -posY + 5, imgWidth, imgHeight);
            remainingHeight -= (pageHeight - 10);
            posY += (pageHeight - 10);
          }
        }
        
        doc.save(`${currentYear}-${String(currentMonth+1).padStart(2,'0')}_工作记录.pdf`);
      } else {
        // 回退：使用纯文本
        showNotification('html2canvas 库未加载，尝试用纯文本导出...', 'info');
        const doc = new window.jspdf.jsPDF('l', 'pt', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();
        doc.setFontSize(14);
        doc.text('Work Records', pageWidth/2, 40, {align:'center'});
        
        let yPos = 60;
        const headers = ['Date','Start','End','Break(m)','Work(m)','Rate','Income','Note','Company'];
        headers.forEach((h, i) => doc.text(h, 20 + i*90, yPos));
        yPos += 15;
        
        rows.slice(1).forEach(r => {
          let xPos = 20;
          r.forEach((cell, i) => {
            doc.text(String(cell).substring(0, 15), xPos + i*90, yPos);
          });
          yPos += 12;
          if(yPos > 550) {
            doc.addPage();
            yPos = 20;
          }
        });
        doc.save(`${currentYear}-${String(currentMonth+1).padStart(2,'0')}_工作记录.pdf`);
      }
    } finally {
      document.body.removeChild(tempDiv);
    }

  } catch(e){
    showNotification('导出 PDF 失败，请查看控制台', 'error');
  } finally { if(overlay) overlay.style.display = 'none'; }
}

// 绑定新按钮
document.addEventListener('DOMContentLoaded', ()=>{
  const elX = document.getElementById('menuExportXLSX');
  if(elX) elX.addEventListener('click', (e)=>{ e.preventDefault(); doExportCurrentMonthXLSX(); });
  const elP = document.getElementById('menuExportPDF');
  if(elP) elP.addEventListener('click', (e)=>{ e.preventDefault(); doExportCurrentMonthPDF(); });
});
